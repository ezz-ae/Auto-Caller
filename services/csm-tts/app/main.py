import io
import logging
import os
import subprocess
import wave
from dataclasses import dataclass
from typing import List, Literal, Optional

import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from transformers import AutoProcessor, CsmForConditionalGeneration

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("csm-tts")

CSM_MODEL_ID = os.getenv("CSM_MODEL_ID", "sesame/csm-1b")
HF_TOKEN = os.getenv("HF_TOKEN", "").strip() or None
NO_TORCH_COMPILE = os.getenv("NO_TORCH_COMPILE", "0").strip() == "1"
CSM_SAMPLE_RATE = int(os.getenv("CSM_SAMPLE_RATE", "24000"))
CSM_SPEAKER_COUNT = max(1, int(os.getenv("CSM_SPEAKER_COUNT", "4")))


class ContextTurn(BaseModel):
    speaker: int = 0
    text: str = ""
    audio_b64_wav: Optional[str] = None


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1)
    speaker: int = 0
    context: List[ContextTurn] = Field(default_factory=list)
    max_audio_ms: int = 10000
    format: Literal["wav", "mp3", "ulaw_8khz"] = "wav"


@dataclass
class RuntimeState:
    processor: Optional[AutoProcessor] = None
    model: Optional[CsmForConditionalGeneration] = None
    sample_rate: int = CSM_SAMPLE_RATE
    device: str = "cpu"
    ready: bool = False
    load_error: str = ""


state = RuntimeState()

app = FastAPI(title="CSM TTS Service", version="0.1.0")


def _gpu_required() -> None:
    if not torch.cuda.is_available():
        raise HTTPException(status_code=503, detail="GPU required: CUDA device not detected")


def _load_model() -> None:
    _gpu_required()
    state.device = "cuda"

    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    logger.info("Loading CSM model '%s' on %s with dtype=%s", CSM_MODEL_ID, state.device, dtype)

    processor = AutoProcessor.from_pretrained(CSM_MODEL_ID, token=HF_TOKEN)
    model = CsmForConditionalGeneration.from_pretrained(
        CSM_MODEL_ID,
        torch_dtype=dtype,
        token=HF_TOKEN,
        low_cpu_mem_usage=True,
    ).to(state.device)
    model.eval()

    if not NO_TORCH_COMPILE:
        try:
            model = torch.compile(model, mode="reduce-overhead")
            logger.info("torch.compile enabled")
        except Exception as compile_error:  # pragma: no cover
            logger.warning("torch.compile failed, continuing without it: %s", compile_error)
    else:
        logger.info("NO_TORCH_COMPILE=1, torch.compile disabled")

    sample_rate = int(getattr(processor, "sampling_rate", CSM_SAMPLE_RATE))
    state.processor = processor
    state.model = model
    state.sample_rate = sample_rate if sample_rate > 0 else CSM_SAMPLE_RATE
    state.ready = True
    state.load_error = ""
    logger.info("CSM model ready (sample_rate=%s)", state.sample_rate)


def _build_prompt(text: str, speaker: int, context: List[ContextTurn]) -> str:
    lines: List[str] = []
    for turn in context[-8:]:
        turn_text = turn.text.strip()
        if not turn_text:
            continue
        lines.append(f"[Speaker {max(0, int(turn.speaker))}] {turn_text}")
    lines.append(f"[Speaker {max(0, int(speaker))}] {text.strip()}")
    return "\n".join(lines).strip()


def _prepare_inputs(prompt: str):
    assert state.processor is not None

    try:
        inputs = state.processor(text=prompt, return_tensors="pt")
    except TypeError:
        inputs = state.processor([prompt], return_tensors="pt")

    for key, value in list(inputs.items()):
        if torch.is_tensor(value):
            inputs[key] = value.to(state.device)
    return inputs


def _extract_waveform(output) -> torch.Tensor:
    candidates = []

    if isinstance(output, dict):
        candidates.extend(
            [
                output.get("audio_values"),
                output.get("waveform"),
                output.get("audio"),
            ]
        )
    else:
        candidates.extend(
            [
                getattr(output, "audio_values", None),
                getattr(output, "waveform", None),
                getattr(output, "audio", None),
            ]
        )
    candidates.append(output)

    for candidate in candidates:
        if candidate is None:
            continue
        if isinstance(candidate, (list, tuple)) and len(candidate) > 0:
            candidate = candidate[0]
        if torch.is_tensor(candidate):
            waveform = candidate.detach().float().cpu()
            if waveform.dim() == 3:
                waveform = waveform[0, 0]
            elif waveform.dim() == 2:
                waveform = waveform[0]
            elif waveform.dim() > 3:
                continue
            if waveform.dim() == 1:
                return waveform.clamp(-1.0, 1.0)

    raise RuntimeError(
        "Unable to extract waveform from model output. Check installed transformers/Csm API compatibility."
    )


def _float_waveform_to_wav_bytes(waveform: torch.Tensor, sample_rate: int) -> bytes:
    pcm = (waveform.numpy() * 32767.0).astype(np.int16)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm.tobytes())
    return buffer.getvalue()


def _ffmpeg_convert(input_wav: bytes, output_format: str, content_hint: str) -> bytes:
    ffmpeg_cmd = [
        "ffmpeg",
        "-nostdin",
        "-v",
        "error",
        "-f",
        "wav",
        "-i",
        "pipe:0",
    ]
    ffmpeg_cmd.extend(output_format.split())
    ffmpeg_cmd.append("pipe:1")

    process = subprocess.run(ffmpeg_cmd, input=input_wav, capture_output=True, check=False)
    if process.returncode != 0:
        stderr = process.stderr.decode("utf-8", errors="ignore").strip()
        raise RuntimeError(f"ffmpeg failed for {content_hint}: {stderr or 'unknown error'}")
    return process.stdout


def _convert_format(wav_bytes: bytes, fmt: str) -> bytes:
    if fmt == "wav":
        return wav_bytes
    if fmt == "mp3":
        return _ffmpeg_convert(wav_bytes, "-f mp3", "mp3")
    if fmt == "ulaw_8khz":
        return _ffmpeg_convert(wav_bytes, "-ac 1 -ar 8000 -f mulaw", "ulaw_8khz")
    raise RuntimeError(f"Unsupported format: {fmt}")


def _content_type(fmt: str) -> str:
    if fmt == "mp3":
        return "audio/mpeg"
    if fmt == "ulaw_8khz":
        return "audio/basic"
    return "audio/wav"


@app.on_event("startup")
def _startup() -> None:
    try:
        _load_model()
    except Exception as error:  # pragma: no cover
        state.ready = False
        state.load_error = str(error)
        logger.exception("Failed to initialize CSM model: %s", error)


@app.get("/health")
def health():
    return {
        "status": "ok" if state.ready else "degraded",
        "ready": state.ready,
        "device": state.device,
        "cuda_available": torch.cuda.is_available(),
        "model_id": CSM_MODEL_ID,
        "load_error": state.load_error,
    }


@app.get("/voices")
def voices():
    return {"speakers": list(range(CSM_SPEAKER_COUNT))}


@app.post("/tts")
def tts(request: TTSRequest):
    if not state.ready or state.model is None or state.processor is None:
        detail = state.load_error or "CSM model is not ready"
        if "GPU required" in detail:
            raise HTTPException(status_code=503, detail=detail)
        raise HTTPException(status_code=503, detail=f"CSM unavailable: {detail}")

    try:
        prompt = _build_prompt(request.text, request.speaker, request.context)
        inputs = _prepare_inputs(prompt)

        with torch.inference_mode():
            generated = state.model.generate(**inputs)
        waveform = _extract_waveform(generated)

        max_audio_ms = max(250, int(request.max_audio_ms or 10000))
        max_samples = int((max_audio_ms / 1000.0) * state.sample_rate)
        if max_samples > 0 and waveform.shape[0] > max_samples:
            waveform = waveform[:max_samples]

        wav_bytes = _float_waveform_to_wav_bytes(waveform, state.sample_rate)
        audio_bytes = _convert_format(wav_bytes, request.format)
        return Response(content=audio_bytes, media_type=_content_type(request.format))
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("TTS synthesis failed: %s", error)
        raise HTTPException(status_code=500, detail=f"CSM synthesis error: {error}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("CSM_TTS_PORT", "7010")))

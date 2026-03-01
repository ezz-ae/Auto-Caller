# CSM TTS Microservice

FastAPI service for Sesame CSM-1B speech synthesis.

## Requirements

- NVIDIA GPU with CUDA runtime available to the container
- Hugging Face access to `sesame/csm-1b` (accepted model terms)
- `HF_TOKEN` set in environment

If no GPU is available, `/health` reports degraded and `/tts` returns `503 GPU required`.

## Run Locally

```bash
cd services/csm-tts
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export HF_TOKEN=hf_xxx
export CSM_MODEL_ID=sesame/csm-1b
export NO_TORCH_COMPILE=1
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 7010
```

## Endpoints

- `GET /health`
- `GET /voices`
- `POST /tts`

### Curl example (`wav`)

```bash
curl -X POST http://localhost:7010/tts \
  -H "Content-Type: application/json" \
  --data '{
    "text":"Hello from CSM",
    "speaker":0,
    "context":[{"speaker":1,"text":"Can you introduce yourself?"}],
    "max_audio_ms":10000,
    "format":"wav"
  }' \
  --output out.wav
```

### Curl example (`ulaw_8khz`, telephony-ready)

```bash
curl -X POST http://localhost:7010/tts \
  -H "Content-Type: application/json" \
  --data '{"text":"Hello from CSM","speaker":0,"max_audio_ms":8000,"format":"ulaw_8khz"}' \
  --output out.ulaw
```

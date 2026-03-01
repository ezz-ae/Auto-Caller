import { getSettings } from './store';

export type CsmAudioFormat = 'wav' | 'mp3' | 'ulaw_8khz';

export interface CsmContextTurn {
  speaker: number;
  text: string;
  audio_b64_wav?: string;
}

export interface GenerateSpeechCSMOptions {
  userId?: string;
  voiceId?: string;
  speaker?: number;
  context?: CsmContextTurn[];
  maxAudioMs?: number;
  format?: CsmAudioFormat;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveCsmBaseUrl(): string {
  const value = String(process.env.CSM_TTS_URL || 'http://localhost:7010').trim();
  return normalizeBaseUrl(value || 'http://localhost:7010');
}

function parseSpeakerFromVoiceId(voiceId?: string): number | null {
  const raw = String(voiceId || '').trim();
  const match = raw.match(/^csm_speaker_(\d+)$/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
}

function normalizeSpeaker(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

export function csmSpeakerVoiceId(speaker: number): string {
  return `csm_speaker_${normalizeSpeaker(speaker, 0)}`;
}

export function resolveCsmContentType(format: CsmAudioFormat): string {
  if (format === 'mp3') return 'audio/mpeg';
  if (format === 'ulaw_8khz') return 'audio/basic';
  return 'audio/wav';
}

export async function listCSMSpeakers(userId = 'default'): Promise<number[]> {
  const settings = await getSettings(userId);
  const defaultSpeaker = normalizeSpeaker(settings.csmSpeaker, 0);
  const fallback = [defaultSpeaker];

  if (!settings.csmEnabled && settings.ttsProvider !== 'csm') {
    return fallback;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${resolveCsmBaseUrl()}/voices`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(`CSM voices request failed (${response.status}): ${details || 'no details'}`);
    }
    const data = await response.json().catch(() => ({}));
    const speakers = Array.isArray(data?.speakers)
      ? data.speakers
          .map((item: unknown) => normalizeSpeaker(item, -1))
          .filter((value: number) => value >= 0)
      : [];
    return speakers.length > 0 ? speakers : fallback;
  } catch (error: any) {
    throw new Error(`CSM service is unavailable: ${error?.message || 'unknown error'}`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateSpeechCSM(
  text: string,
  options: GenerateSpeechCSMOptions = {}
): Promise<Buffer> {
  const userId = String(options.userId || 'default').trim() || 'default';
  const settings = await getSettings(userId);

  if (!settings.csmEnabled) {
    throw new Error('CSM TTS is disabled in workspace settings');
  }

  const cleanedText = String(text || '').trim();
  if (!cleanedText) {
    throw new Error('Text is required for CSM TTS');
  }

  const format: CsmAudioFormat = options.format || 'wav';
  const speakerFromVoice = parseSpeakerFromVoiceId(options.voiceId);
  const speaker = normalizeSpeaker(
    options.speaker ?? speakerFromVoice ?? settings.csmSpeaker ?? 0,
    0
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${resolveCsmBaseUrl()}/tts`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: resolveCsmContentType(format),
      },
      body: JSON.stringify({
        text: cleanedText,
        speaker,
        context: Array.isArray(options.context) ? options.context : [],
        max_audio_ms: normalizeSpeaker(options.maxAudioMs, 10000),
        format,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(`CSM request failed (${response.status}): ${details || 'no details'}`);
    }

    const payload = await response.arrayBuffer();
    if (!payload || payload.byteLength === 0) {
      throw new Error('CSM returned empty audio response');
    }
    return Buffer.from(payload);
  } catch (error: any) {
    throw new Error(`Failed to synthesize with CSM: ${error?.message || 'unknown error'}`);
  } finally {
    clearTimeout(timeout);
  }
}

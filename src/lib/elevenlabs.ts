// Auto Caller Pro - ElevenLabs Service

import { getSettings } from './store';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID || 'SAz9YHcvj6GT2YYXdXww';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url: string;
}

interface ElevenLabsVoicesResponse {
  voices: ElevenLabsVoice[];
}

function getFloatEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function getBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = String(process.env[name] || '').trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

function normalizeTtsText(input: string): string {
  return String(input || '')
    .replace(/[*_`#>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get available voices
export async function getVoices(userId = 'default'): Promise<ElevenLabsVoice[]> {
  const settings = await getSettings(userId);
  
  if (!settings.elevenLabsApiKey) {
    // Return default voices if no API key
    return [
      { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade', labels: { accent: 'american', gender: 'female', description: 'calm' }, preview_url: '' },
      { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade', labels: { accent: 'american', gender: 'female', description: 'strong' }, preview_url: '' },
      { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade', labels: { accent: 'american', gender: 'female', description: 'soft' }, preview_url: '' },
      { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade', labels: { accent: 'american', gender: 'male', description: 'warm' }, preview_url: '' },
      { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', category: 'premade', labels: { accent: 'american', gender: 'female', description: 'emotional' }, preview_url: '' },
      { voice_id: 'TxGEqnHWrfWFT1GWmBXj', name: 'Josh', category: 'premade', labels: { accent: 'american', gender: 'male', description: 'confident' }, preview_url: '' },
      { voice_id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', category: 'premade', labels: { accent: 'american', gender: 'male', description: 'deep' }, preview_url: '' },
      { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'premade', labels: { accent: 'american', gender: 'male', description: 'casual' }, preview_url: '' },
      { voice_id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', category: 'premade', labels: { accent: 'american', gender: 'male', description: 'gravelly' }, preview_url: '' },
    ];
  }
  
  const response = await fetch(`${ELEVENLABS_API_URL}/voices?show_legacy=true`, {
    headers: {
      'xi-api-key': settings.elevenLabsApiKey,
    },
  });
  
  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }
  
  const data: ElevenLabsVoicesResponse = await response.json();
  return data.voices;
}

// Generate speech audio
export async function generateSpeech(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID,
  options: {
    language?: string;
    userId?: string;
    channel?: 'phone' | 'preview';
  } = {}
): Promise<Buffer> {
  const settings = await getSettings(options.userId || 'default');
  
  if (!settings.elevenLabsApiKey) {
    throw new Error('ElevenLabs API key not configured');
  }
  
  // Default to quality-first model; users can override with ELEVENLABS_MODEL_ID.
  const modelId =
    process.env.ELEVENLABS_MODEL_ID ||
    process.env.ELEVENLABS_PHONE_MODEL_ID ||
    'eleven_multilingual_v2';
  // Tuned defaults for more human cadence: slightly slower with softer control.
  const stability = getFloatEnv('ELEVENLABS_VOICE_STABILITY', 0.34);
  const similarityBoost = getFloatEnv('ELEVENLABS_VOICE_SIMILARITY_BOOST', 0.88);
  const style = getFloatEnv('ELEVENLABS_VOICE_STYLE', 0.16);
  const speed = getFloatEnv('ELEVENLABS_VOICE_SPEED', 0.90);
  const useSpeakerBoost = getBooleanEnv('ELEVENLABS_USE_SPEAKER_BOOST', true);
  // 0 favors quality over latency and typically sounds less synthetic.
  const optimizeLatency = Math.max(0, Math.min(4, Math.round(getFloatEnv('ELEVENLABS_OPTIMIZE_STREAMING_LATENCY', 0))));
  const channel = options.channel || 'phone';
  const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || (channel === 'preview' ? 'mp3_44100_128' : 'mp3_44100_128');
  const normalizedText = normalizeTtsText(text);

  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}?optimize_streaming_latency=${optimizeLatency}&output_format=${encodeURIComponent(outputFormat)}`, {
    method: 'POST',
    headers: {
      'xi-api-key': settings.elevenLabsApiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: normalizedText,
      model_id: modelId,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
        style,
        speed,
        use_speaker_boost: useSpeakerBoost,
      },
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS error: ${error}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Generate speech URL for Twilio (returns a hosted URL)
export async function generateSpeechForCall(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<string> {
  // For Twilio calls, we'll use Twilio's built-in TTS or generate audio
  // This returns a URL that Twilio can use
  
  // If we have ElevenLabs, we could host the audio somewhere
  // For now, we'll use Twilio's native TTS which is simpler
  
  // Return empty to indicate we should use Twilio TTS
  return '';
}

// Get voice preview URL
export async function getVoicePreview(voiceId: string): Promise<string> {
  const voices = await getVoices();
  const voice = voices.find(v => v.voice_id === voiceId);
  
  if (!voice) {
    throw new Error('Voice not found');
  }
  
  return voice.preview_url;
}

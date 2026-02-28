// Auto Caller Pro - ElevenLabs Service

import { getSettings } from './store';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

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

// Get available voices
export async function getVoices(): Promise<ElevenLabsVoice[]> {
  const settings = await getSettings();
  
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
  
  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
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
  voiceId: string = '21m00Tcm4TlvDq8ikWAM',
  options: {
    language?: string;
  } = {}
): Promise<Buffer> {
  const settings = await getSettings();
  
  if (!settings.elevenLabsApiKey) {
    throw new Error('ElevenLabs API key not configured');
  }
  
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': settings.elevenLabsApiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.85,
        style: 0.35,
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
  voiceId: string = '21m00Tcm4TlvDq8ikWAM'
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

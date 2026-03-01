import { NextResponse } from 'next/server';
import { getVoices as getVoiceEngineVoices } from '@/lib/elevenlabs';
import { NextRequest } from 'next/server';
import { requireUserIdFromRequest } from '@/lib/request-user';
import { isUnauthorizedError } from '@/lib/route-errors';

const HUMAN_PREFERRED_IDS = new Set([
  '21m00Tcm4TlvDq8ikWAM', // Rachel
  'AZnzlk1XvdvUeBnXmlld', // Domi
  'EXAVITQu4vr4xnSDxMaL', // Bella
  'MF3mGyEYCl7XYWbV9V6O', // Elli
  'ErXwobaYiN019PkySvjV', // Antoni
  'TxGEqnHWrfWFT1GWmBXj', // Josh
  'pNInz6obpgDQGcFmaJgB', // Adam
  'VR6AewLTigWG4xSOukaG', // Arnold
]);

function inferLanguage(labels: Record<string, string> = {}): string {
  const direct = (labels.language || labels.locale || '').trim();
  if (direct) return direct;

  const accent = (labels.accent || '').toLowerCase();
  if (accent.includes('british') || accent.includes('uk')) return 'en-GB';
  if (accent.includes('american') || accent.includes('us')) return 'en-US';
  if (accent.includes('australian')) return 'en-AU';
  if (accent.includes('spanish')) return 'es-ES';
  if (accent.includes('arab')) return 'ar-SA';
  if (accent.includes('french')) return 'fr-FR';
  if (accent.includes('german')) return 'de-DE';
  return 'en-US';
}

function qualityScore(input: { id: string; category: string; labels: Record<string, string>; name: string }) {
  let score = 0;

  if (HUMAN_PREFERRED_IDS.has(input.id)) score += 120;
  if (input.category === 'premade') score += 30;

  const description = String(input.labels?.description || '').toLowerCase();
  if (description.includes('natural') || description.includes('realistic') || description.includes('warm')) {
    score += 20;
  }

  const name = input.name.toLowerCase();
  if (name.includes('rachel') || name.includes('bella') || name.includes('domi') || name.includes('antoni')) {
    score += 20;
  }

  return score;
}

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const voices = await getVoiceEngineVoices(userId);
    const telephonyVoices = [
      { id: 'default-female', name: 'Standard Female', category: 'telephony', labels: { gender: 'female', language: 'multi' }, language: 'multi', source: 'telephony', previewUrl: '' },
      { id: 'default-male', name: 'Standard Male', category: 'telephony', labels: { gender: 'male', language: 'en-US' }, language: 'en-US', source: 'telephony', previewUrl: '' },
    ]
    
    const highQualityVoices = voices
      .map(v => ({
        id: v.voice_id,
        name: v.name,
        category: v.category,
        labels: v.labels,
        language: inferLanguage(v.labels),
        source: 'elevenlabs',
        previewUrl: v.preview_url,
      }))
      .sort((a, b) => qualityScore(b) - qualityScore(a));
    
    return NextResponse.json({ 
      voices: [...telephonyVoices, ...highQualityVoices],
    });
  } catch (error: any) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ 
      error: error.message || 'Failed to get voices' 
    }, { status: 500 });
  }
}

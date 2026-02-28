import { NextResponse } from 'next/server';
import { getVoices } from '@/lib/elevenlabs';

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

export async function GET() {
  try {
    const voices = await getVoices();
    const twilioVoices = [
      { id: 'alice', name: 'Twilio Alice', category: 'twilio', labels: { gender: 'female', language: 'multi' }, language: 'multi', source: 'twilio', previewUrl: '' },
      { id: 'Polly.Joanna', name: 'Polly Joanna', category: 'twilio', labels: { gender: 'female', language: 'en-US' }, language: 'en-US', source: 'twilio', previewUrl: '' },
      { id: 'Polly.Salli', name: 'Polly Salli', category: 'twilio', labels: { gender: 'female', language: 'en-US' }, language: 'en-US', source: 'twilio', previewUrl: '' },
      { id: 'Polly.Matthew', name: 'Polly Matthew', category: 'twilio', labels: { gender: 'male', language: 'en-US' }, language: 'en-US', source: 'twilio', previewUrl: '' },
      { id: 'Polly.Joey', name: 'Polly Joey', category: 'twilio', labels: { gender: 'male', language: 'en-US' }, language: 'en-US', source: 'twilio', previewUrl: '' },
      { id: 'Polly.Amy', name: 'Polly Amy', category: 'twilio', labels: { gender: 'female', language: 'en-GB' }, language: 'en-GB', source: 'twilio', previewUrl: '' },
      { id: 'Polly.Brian', name: 'Polly Brian', category: 'twilio', labels: { gender: 'male', language: 'en-GB' }, language: 'en-GB', source: 'twilio', previewUrl: '' },
    ]
    
    return NextResponse.json({ 
      voices: [...twilioVoices, ...voices.map(v => ({
        id: v.voice_id,
        name: v.name,
        category: v.category,
        labels: v.labels,
        language: inferLanguage(v.labels),
        source: 'elevenlabs',
        previewUrl: v.preview_url,
      }))],
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to get voices' 
    }, { status: 500 });
  }
}

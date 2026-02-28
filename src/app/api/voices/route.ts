import { NextRequest, NextResponse } from 'next/server';
import { getVoices } from '@/lib/elevenlabs';

export async function GET() {
  try {
    const voices = await getVoices();
    const twilioVoices = [
      { id: 'alice', name: 'Twilio Alice', category: 'twilio', labels: { gender: 'female', language: 'multi' }, previewUrl: '' },
      { id: 'Polly.Joanna', name: 'Polly Joanna', category: 'twilio', labels: { gender: 'female', language: 'en-US' }, previewUrl: '' },
      { id: 'Polly.Salli', name: 'Polly Salli', category: 'twilio', labels: { gender: 'female', language: 'en-US' }, previewUrl: '' },
      { id: 'Polly.Matthew', name: 'Polly Matthew', category: 'twilio', labels: { gender: 'male', language: 'en-US' }, previewUrl: '' },
      { id: 'Polly.Joey', name: 'Polly Joey', category: 'twilio', labels: { gender: 'male', language: 'en-US' }, previewUrl: '' },
      { id: 'Polly.Amy', name: 'Polly Amy', category: 'twilio', labels: { gender: 'female', language: 'en-GB' }, previewUrl: '' },
      { id: 'Polly.Brian', name: 'Polly Brian', category: 'twilio', labels: { gender: 'male', language: 'en-GB' }, previewUrl: '' },
    ]
    
    return NextResponse.json({ 
      voices: [...twilioVoices, ...voices.map(v => ({
        id: v.voice_id,
        name: v.name,
        category: v.category,
        labels: v.labels,
        previewUrl: v.preview_url,
      }))],
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to get voices' 
    }, { status: 500 });
  }
}

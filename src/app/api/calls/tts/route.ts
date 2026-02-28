import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/elevenlabs';

function getParamsFromRequest(request: NextRequest) {
  const url = new URL(request.url);
  const script = (url.searchParams.get('script') || '').trim();
  const voiceId = (url.searchParams.get('voiceId') || '').trim();
  const language = (url.searchParams.get('language') || 'en-US').trim();
  return { script, voiceId, language };
}

async function synthesize(request: NextRequest) {
  try {
    const { script, voiceId, language } = getParamsFromRequest(request);

    if (!script) {
      return NextResponse.json({ error: 'script is required' }, { status: 400 });
    }
    if (!voiceId) {
      return NextResponse.json({ error: 'voiceId is required' }, { status: 400 });
    }
    if (script.length > 1800) {
      return NextResponse.json({ error: 'script too long for single TTS request' }, { status: 400 });
    }

    const audio = await generateSpeech(script, voiceId, { language });
    const payload = new Uint8Array(audio);

    return new NextResponse(payload, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=120',
      },
    });
  } catch (error) {
    console.error('ElevenLabs TTS route error:', error);
    return NextResponse.json({ error: 'Failed to synthesize speech' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return synthesize(request);
}

export async function POST(request: NextRequest) {
  return synthesize(request);
}

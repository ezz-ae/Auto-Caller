import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/elevenlabs';
import { getUserIdFromRequest } from '@/lib/request-user';
import { verifySignedTtsParams } from '@/lib/tts-auth';

function getParamsFromRequest(request: NextRequest) {
  const url = new URL(request.url);
  const script = (url.searchParams.get('script') || '').trim();
  const voiceId = (url.searchParams.get('voiceId') || '').trim();
  const language = (url.searchParams.get('language') || 'en-US').trim();
  const userId = (url.searchParams.get('userId') || '').trim();
  return { script, voiceId, language, userId };
}

async function synthesize(request: NextRequest) {
  try {
    const { script, voiceId, language, userId: userIdFromQuery } = getParamsFromRequest(request);
    const url = new URL(request.url);
    const sig = String(url.searchParams.get('sig') || '').trim();
    const exp = Number(url.searchParams.get('exp') || 0);
    const hasSignedParams = Boolean(sig && exp);

    const signedAuthorized = hasSignedParams && verifySignedTtsParams({
      script,
      voiceId,
      language,
      userId: userIdFromQuery,
      exp,
      sig,
    });

    const authUserId = getUserIdFromRequest(request);
    if (!signedAuthorized && !authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = signedAuthorized
      ? userIdFromQuery
      : authUserId || '';

    if (!script) {
      return NextResponse.json({ error: 'script is required' }, { status: 400 });
    }
    if (!voiceId) {
      return NextResponse.json({ error: 'voiceId is required' }, { status: 400 });
    }
    if (script.length > 1800) {
      return NextResponse.json({ error: 'script too long for single TTS request' }, { status: 400 });
    }

    const audio = await generateSpeech(script, voiceId, { language, userId });
    const payload = new Uint8Array(audio);

    return new NextResponse(payload, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, no-store',
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

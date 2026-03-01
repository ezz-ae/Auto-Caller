import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/elevenlabs';
import { generateSpeechCSM, resolveCsmContentType, type CsmAudioFormat } from '@/lib/csm';
import { getSettings } from '@/lib/store';
import { getUserIdFromRequest } from '@/lib/request-user';
import { verifySignedTtsParams } from '@/lib/tts-auth';

function getParamsFromRequest(request: NextRequest) {
  const url = new URL(request.url);
  const script = (url.searchParams.get('script') || '').trim();
  const voiceId = (url.searchParams.get('voiceId') || '').trim();
  const language = (url.searchParams.get('language') || 'en-US').trim();
  const userId = (url.searchParams.get('userId') || '').trim();
  const formatRaw = String(url.searchParams.get('format') || 'wav').trim().toLowerCase();
  const format: CsmAudioFormat =
    formatRaw === 'mp3' || formatRaw === 'ulaw_8khz' ? formatRaw : 'wav';
  const maxAudioMs = Number(url.searchParams.get('maxAudioMs') || 10000);
  const speaker = Number(url.searchParams.get('speaker') || '');
  return { script, voiceId, language, userId, format, maxAudioMs, speaker };
}

async function synthesize(request: NextRequest) {
  try {
    const { script, voiceId, language, userId: userIdFromQuery, format, maxAudioMs, speaker } = getParamsFromRequest(request);
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
    if (script.length > 1800) {
      return NextResponse.json({ error: 'script too long for single TTS request' }, { status: 400 });
    }

    const settings = await getSettings(userId);
    const provider = settings.ttsProvider === 'csm' ? 'csm' : 'elevenlabs';

    let audio: Buffer;
    let contentType = 'audio/mpeg';
    if (provider === 'csm') {
      if (!settings.csmEnabled) {
        return NextResponse.json(
          { error: 'CSM provider is selected but disabled in workspace settings' },
          { status: 400 }
        );
      }
      audio = await generateSpeechCSM(script, {
        userId,
        voiceId,
        speaker: Number.isFinite(speaker) ? speaker : undefined,
        maxAudioMs: Number.isFinite(maxAudioMs) ? maxAudioMs : 10000,
        format,
      });
      contentType = resolveCsmContentType(format);
    } else {
      if (!voiceId) {
        return NextResponse.json({ error: 'voiceId is required' }, { status: 400 });
      }
      audio = await generateSpeech(script, voiceId, { language, userId });
    }

    const payload = new Uint8Array(audio);

    return new NextResponse(payload, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('TTS route error:', error);
    const message = String((error as any)?.message || 'Failed to synthesize speech');
    const status =
      message.includes('GPU required') || message.includes('disabled in workspace settings') ? 503 :
      message.includes('CSM service') || message.includes('CSM request failed') ? 502 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: NextRequest) {
  return synthesize(request);
}

export async function POST(request: NextRequest) {
  return synthesize(request);
}

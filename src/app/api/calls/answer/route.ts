import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getSettings } from '@/lib/store';
import { generateCallTwiML, isTwilioNativeVoice } from '@/lib/twilio';

async function handleAnswer(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const scriptFromQuery = url.searchParams.get('script');
    const forwardFromQuery = url.searchParams.get('forward');
    const recordFromQuery = url.searchParams.get('record');
    const transcribeFromQuery = url.searchParams.get('transcribe');
    const languageFromQuery = url.searchParams.get('language');
    const voiceIdFromQuery = url.searchParams.get('voiceId');

    let callSid = '';
    let script = scriptFromQuery || '';
    let forward = forwardFromQuery || '';
    let record = recordFromQuery === 'true';
    let transcribe = transcribeFromQuery === 'true';
    let language = languageFromQuery || 'en-US';
    let voiceId = voiceIdFromQuery || 'alice';

    if (request.method === 'POST') {
      const formData = await request.formData();
      callSid = (formData.get('CallSid') as string) || callSid;
      script = script || (formData.get('script') as string) || '';
      forward = forward || (formData.get('forward') as string) || '';
      if (!recordFromQuery) {
        record = formData.get('record') === 'true';
      }
      if (!transcribeFromQuery) {
        transcribe = formData.get('transcribe') === 'true';
      }
      if (!languageFromQuery) {
        language = (formData.get('language') as string) || language;
      }
      if (!voiceIdFromQuery) {
        voiceId = (formData.get('voiceId') as string) || voiceId;
      }
    }
    
    const settings = await getSettings();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let ttsAudioUrl = '';
    const candidateScript = script || 'Hello, this is an automated call.';

    if (!isTwilioNativeVoice(voiceId)) {
      const ttsUrl = new URL(`${appUrl}/api/calls/tts`);
      ttsUrl.searchParams.set('script', candidateScript);
      ttsUrl.searchParams.set('voiceId', voiceId);
      ttsUrl.searchParams.set('language', language || 'en-US');
      ttsAudioUrl = ttsUrl.toString();
    }
    
    // Generate TwiML response
    const twiml = generateCallTwiML(
      candidateScript,
      forward || settings.forwardToNumber,
      callSid,
      {
        record: record || settings.recordCalls,
        transcribe: transcribe || settings.transcribeCalls,
        transcriptionCallback: `${appUrl}/api/calls/transcription`,
        webSocketUrl: settings.webSocketUrl,
        language,
        voiceId,
        ttsAudioUrl,
      }
    );
    
    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
    
  } catch (error) {
    console.error('Answer handler error:', error);
    
    // Return error TwiML
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    response.say('An error occurred. Please try again later.');
    
    return new NextResponse(response.toString(), {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}

// Twilio can hit this endpoint with either GET or POST depending on flow configuration.
export async function GET(request: NextRequest) {
  return handleAnswer(request);
}

export async function POST(request: NextRequest) {
  return handleAnswer(request);
}

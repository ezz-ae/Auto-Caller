import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getSettings } from '@/lib/store';
import { generateCallTwiML } from '@/lib/twilio';

async function handleAnswer(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const scriptFromQuery = url.searchParams.get('script');
    const forwardFromQuery = url.searchParams.get('forward');
    const recordFromQuery = url.searchParams.get('record');
    const transcribeFromQuery = url.searchParams.get('transcribe');

    let callSid = '';
    let script = scriptFromQuery || '';
    let forward = forwardFromQuery || '';
    let record = recordFromQuery === 'true';
    let transcribe = transcribeFromQuery === 'true';

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
    }
    
    const settings = getSettings();
    
    // Generate TwiML response
    const twiml = generateCallTwiML(
      script || 'Hello, this is an automated call.',
      forward || settings.forwardToNumber,
      callSid,
      {
        record: record || settings.recordCalls,
        transcribe: transcribe || settings.transcribeCalls,
        transcriptionCallback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calls/transcription`,
        webSocketUrl: settings.webSocketUrl,
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

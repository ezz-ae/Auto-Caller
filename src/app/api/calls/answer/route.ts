import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getSettings } from '@/lib/store';
import { generateCallTwiML } from '@/lib/twilio';

// Handle when a call is answered
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const script = formData.get('script') as string;
    const forward = formData.get('forward') as string;
    const record = formData.get('record') === 'true';
    const transcribe = formData.get('transcribe') === 'true';
    
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

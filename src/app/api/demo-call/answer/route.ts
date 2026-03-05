import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { attachDemoCallSid, getDemoSessionById } from '@/lib/demo-call-store';
import {
  appendDemoSpeech,
  buildDemoGreeting,
  getDemoLanguage,
  resolveDemoVoiceConfig,
} from '@/lib/demo-call';
import { resolvePublicAppUrl } from '@/lib/public-app-url';

function xmlResponse(xml: string) {
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

async function readParam(request: NextRequest, key: string): Promise<string> {
  const fromQuery = new URL(request.url).searchParams.get(key);
  if (fromQuery) return String(fromQuery).trim();

  if (request.method === 'POST') {
    const form = await request.formData();
    const value = form.get(key);
    if (value != null) return String(value).trim();
  }

  return '';
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  try {
    const sessionId = await readParam(request, 'sessionId');
    const callSid = await readParam(request, 'CallSid');

    if (!sessionId || !callSid) {
      response.say('We could not initialize this demo call. Please retry from the website.');
      response.hangup();
      return xmlResponse(response.toString());
    }

    const session = await getDemoSessionById(sessionId);
    if (!session) {
      response.say('Demo session not found. Please retry from the website.');
      response.hangup();
      return xmlResponse(response.toString());
    }

    await attachDemoCallSid(session.id, callSid);

    const appUrl = resolvePublicAppUrl(request);
    const language = getDemoLanguage();
    const { voiceId, ttsFormat, userId } = await resolveDemoVoiceConfig();

    response.pause({ length: 1 });
    appendDemoSpeech(response, buildDemoGreeting(session.leadName), {
      appUrl,
      voiceId,
      language,
      ttsFormat,
      userId,
    });

    const gather = response.gather({
      input: ['speech'],
      speechTimeout: 'auto',
      action: `/api/demo-call/respond?callSid=${encodeURIComponent(callSid)}&turn=1`,
      method: 'POST',
      language: language as any,
      actionOnEmptyResult: true,
    });

    appendDemoSpeech(gather, 'Go ahead, I am listening.', {
      appUrl,
      voiceId,
      language,
      ttsFormat,
      userId,
    });

    appendDemoSpeech(response, 'I could not hear your response clearly. We can try again later from the website.', {
      appUrl,
      voiceId,
      language,
      ttsFormat,
      userId,
    });
    response.hangup();

    return xmlResponse(response.toString());
  } catch (error) {
    console.error('demo-call/answer failed', error);
    response.say('Sorry, the demo is unavailable right now.');
    response.hangup();
    return xmlResponse(response.toString());
  }
}

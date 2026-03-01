import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import {
  appendDemoSessionTurn,
  getDemoSessionByCallSid,
  setDemoSessionStatus,
} from '@/lib/demo-call-store';
import {
  cleanSpokenText,
  generateDemoAgentReply,
  getDemoAgentName,
  getDemoLanguage,
  getDemoMaxTurns,
  getDemoVoice,
} from '@/lib/demo-call';

function xmlResponse(xml: string) {
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

async function parseRequest(request: NextRequest): Promise<{
  callSid: string;
  speechResult: string;
  turn: number;
}> {
  const url = new URL(request.url);
  const queryCallSid = String(url.searchParams.get('callSid') || '').trim();
  const queryTurn = Number(url.searchParams.get('turn') || 1);

  if (request.method !== 'POST') {
    return {
      callSid: queryCallSid,
      speechResult: '',
      turn: Number.isFinite(queryTurn) ? queryTurn : 1,
    };
  }

  const form = await request.formData();
  const callSid = String(form.get('CallSid') || queryCallSid || '').trim();
  const speechResult = String(form.get('SpeechResult') || '').trim();
  const turn = Number.isFinite(queryTurn) ? queryTurn : 1;

  return { callSid, speechResult, turn };
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
    const { callSid, speechResult, turn } = await parseRequest(request);

    if (!callSid) {
      response.say('Session not found. Please start the demo again from the website.');
      response.hangup();
      return xmlResponse(response.toString());
    }

    const session = await getDemoSessionByCallSid(callSid);
    if (!session) {
      response.say('This demo session has expired. Please start again from the website.');
      response.hangup();
      return xmlResponse(response.toString());
    }

    const normalizedSpeech = cleanSpokenText(speechResult, 280);
    if (normalizedSpeech) {
      await appendDemoSessionTurn(callSid, 'lead', normalizedSpeech);
    }

    const refreshed = await getDemoSessionByCallSid(callSid);
    const history = refreshed?.turns || session.turns;

    const fallbackReply = `Thanks for sharing that. ${getDemoAgentName()} can tailor this in your dashboard right after signup.`;
    const { reply, shouldEnd } = await generateDemoAgentReply({
      leadUtterance: normalizedSpeech,
      turn: Math.max(1, turn),
      leadName: session.leadName,
      history,
    }).catch(() => ({ reply: fallbackReply, shouldEnd: turn >= getDemoMaxTurns() }));

    await appendDemoSessionTurn(callSid, 'agent', reply);

    const language = getDemoLanguage();
    const voice = getDemoVoice();

    response.say({ voice: voice as any, language: language as any }, reply || fallbackReply);

    if (shouldEnd || turn >= getDemoMaxTurns()) {
      response.say(
        { voice: voice as any, language: language as any },
        'Thanks for trying the live demo. Open the dashboard now to launch your first real campaign.'
      );
      response.hangup();
      await setDemoSessionStatus(callSid, 'completed');
      return xmlResponse(response.toString());
    }

    const gather = response.gather({
      input: ['speech'],
      speechTimeout: 'auto',
      action: `/api/demo-call/respond?callSid=${encodeURIComponent(callSid)}&turn=${Math.max(1, turn + 1)}`,
      method: 'POST',
      language: language as any,
      actionOnEmptyResult: true,
    });

    gather.say(
      { voice: voice as any, language: language as any },
      'Tell me more so I can shape a practical calling plan for you.'
    );

    response.say(
      { voice: voice as any, language: language as any },
      'No worries. You can retry from the website any time.'
    );
    response.hangup();
    return xmlResponse(response.toString());
  } catch (error) {
    console.error('demo-call/respond failed', error);
    response.say('Sorry, the demo is unavailable right now.');
    response.hangup();
    return xmlResponse(response.toString());
  }
}

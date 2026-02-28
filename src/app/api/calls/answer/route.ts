import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getSettings } from '@/lib/store';
import { getCallerIdentity } from '@/lib/caller-identity-store';
import { generateConversationDecision, ConversationTurn } from '@/lib/conversation-agent';
import { generateCallTwiML, isTwilioNativeVoice } from '@/lib/twilio';

interface ConversationState {
  turn: number;
  noInputCount: number;
  brief: string;
  history: ConversationTurn[];
}

const MAX_TURNS = 6;

function clipText(input: string, max: number): string {
  const cleaned = String(input || '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function parseBoolean(input: string | null | undefined, fallback: boolean): boolean {
  if (input === 'true') return true;
  if (input === 'false') return false;
  return fallback;
}

function decodeState(raw: string | null): ConversationState | null {
  if (!raw) return null;

  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as Partial<ConversationState>;

    return {
      turn: Math.max(0, Number(parsed.turn || 0)),
      noInputCount: Math.max(0, Number(parsed.noInputCount || 0)),
      brief: clipText(String(parsed.brief || ''), 360),
      history: Array.isArray(parsed.history)
        ? parsed.history
            .slice(-4)
            .map((turn): ConversationTurn => ({
              role: turn.role === 'lead' ? 'lead' : 'agent',
              text: clipText(String(turn.text || ''), 140),
            }))
            .filter((turn: ConversationTurn) => turn.text.length > 0)
        : [],
    };
  } catch {
    return null;
  }
}

function encodeState(state: ConversationState): string {
  const sanitized: ConversationState = {
    turn: Math.max(0, state.turn),
    noInputCount: Math.max(0, state.noInputCount),
    brief: clipText(state.brief, 360),
    history: state.history
      .slice(-4)
      .map(turn => ({ role: turn.role, text: clipText(turn.text, 140) })),
  };

  return Buffer.from(JSON.stringify(sanitized), 'utf8').toString('base64url');
}

function resolveTwilioVoice(voiceId?: string): string {
  if (!voiceId) return 'alice';
  return isTwilioNativeVoice(voiceId) ? voiceId : 'alice';
}

function buildTtsAudioUrl(params: {
  appUrl: string;
  text: string;
  voiceId: string;
  language: string;
}): string {
  const url = new URL(`${params.appUrl}/api/calls/tts`);
  url.searchParams.set('script', clipText(params.text, 320));
  url.searchParams.set('voiceId', params.voiceId);
  url.searchParams.set('language', params.language || 'en-US');
  return url.toString();
}

function appendSpeech(
  target: any,
  text: string,
  options: {
    appUrl: string;
    voiceId: string;
    language: string;
  }
) {
  const spoken = clipText(text, 320);
  if (!spoken) return;

  if (!isTwilioNativeVoice(options.voiceId)) {
    target.play(buildTtsAudioUrl({
      appUrl: options.appUrl,
      text: spoken,
      voiceId: options.voiceId,
      language: options.language,
    }));
    return;
  }

  target.say(
    {
      voice: resolveTwilioVoice(options.voiceId) as any,
      language: (options.language || 'en-US') as any,
    },
    spoken
  );
}

function buildActionUrl(params: {
  appUrl: string;
  forward: string;
  language: string;
  voiceId: string;
  callerIdentityId: string;
  record: boolean;
  transcribe: boolean;
  state: ConversationState;
  mode: string;
}): string {
  const url = new URL(`${params.appUrl}/api/calls/answer`);
  url.searchParams.set('forward', params.forward);
  url.searchParams.set('language', params.language);
  url.searchParams.set('voiceId', params.voiceId);
  url.searchParams.set('record', String(params.record));
  url.searchParams.set('transcribe', String(params.transcribe));
  url.searchParams.set('mode', params.mode);

  if (params.callerIdentityId) {
    url.searchParams.set('callerIdentityId', params.callerIdentityId);
  }

  url.searchParams.set('ctx', encodeState(params.state));
  return url.toString();
}

function buildOpeningLine(params: {
  callerName: string;
  callerPosition: string;
  businessName: string;
  mentionAi: boolean;
  brief: string;
}) {
  const intro = params.mentionAi
    ? `Hi, this is ${params.callerName}, an AI assistant with ${params.businessName}.`
    : `Hi, this is ${params.callerName}, ${params.callerPosition} at ${params.businessName}.`;

  const briefLine = clipText(params.brief, 170);
  if (!briefLine) {
    return `${intro} I wanted to quickly check if now is a good time for a short conversation.`;
  }

  return `${intro} ${briefLine} Is this a good time for a quick discussion?`;
}

function buildConversationTwiml(params: {
  appUrl: string;
  forward: string;
  callSid: string;
  language: string;
  voiceId: string;
  callerIdentityId: string;
  record: boolean;
  transcribe: boolean;
  mode: string;
  state: ConversationState;
  spokenText: string;
}): string {
  const response = new twilio.twiml.VoiceResponse();
  const actionUrl = buildActionUrl({
    appUrl: params.appUrl,
    forward: params.forward,
    language: params.language,
    voiceId: params.voiceId,
    callerIdentityId: params.callerIdentityId,
    record: params.record,
    transcribe: params.transcribe,
    mode: params.mode,
    state: params.state,
  });

  const gather = response.gather({
    input: 'speech',
    language: params.language,
    speechTimeout: 'auto',
    timeout: 6,
    action: actionUrl,
    method: 'POST',
  } as any);

  appendSpeech(gather, params.spokenText, {
    appUrl: params.appUrl,
    voiceId: params.voiceId,
    language: params.language,
  });

  // If no speech is captured, loop back into the same route with current state.
  response.redirect({ method: 'POST' }, actionUrl);
  return response.toString();
}

function buildForwardTwiml(params: {
  appUrl: string;
  callSid: string;
  forward: string;
  language: string;
  voiceId: string;
  record: boolean;
  spokenText: string;
}): string {
  const response = new twilio.twiml.VoiceResponse();

  appendSpeech(response, params.spokenText, {
    appUrl: params.appUrl,
    voiceId: params.voiceId,
    language: params.language,
  });

  appendSpeech(response, 'Connecting you now to our team.', {
    appUrl: params.appUrl,
    voiceId: params.voiceId,
    language: params.language,
  });

  const actionBase = `${params.appUrl}/api/calls/handle-forward?callSid=${encodeURIComponent(params.callSid)}`;
  const dialOptions: Record<string, unknown> = {
    timeout: 30,
    action: params.record ? `${actionBase}&record=true` : actionBase,
    method: 'POST',
  };

  if (params.record) {
    dialOptions.record = 'record-from-ringing-dual';
  }

  response.dial(dialOptions as any, params.forward);
  return response.toString();
}

function buildEndTwiml(params: {
  appUrl: string;
  language: string;
  voiceId: string;
  spokenText: string;
}): string {
  const response = new twilio.twiml.VoiceResponse();
  appendSpeech(response, params.spokenText, {
    appUrl: params.appUrl,
    voiceId: params.voiceId,
    language: params.language,
  });
  response.hangup();
  return response.toString();
}

async function handleAnswer(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const formData = method === 'POST' ? await request.formData() : null;

    const pick = (name: string) => {
      const queryValue = url.searchParams.get(name);
      if (queryValue && queryValue.length > 0) return queryValue;
      const formValue = formData?.get(name);
      return typeof formValue === 'string' ? formValue : '';
    };

    const callSid = pick('CallSid') || pick('callSid') || '';
    const speechResult = clipText(pick('SpeechResult'), 260);
    const mode = pick('mode') || 'conversation';
    const callerIdentityId = pick('callerIdentityId');

    const settings = await getSettings();
    const callerIdentity = callerIdentityId ? await getCallerIdentity(callerIdentityId) : null;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const legacyScript = pick('script') || callerIdentity?.script || 'Hello, this is a follow-up call.';
    const forward = pick('forward') || settings.forwardToNumber;
    const language = pick('language') || callerIdentity?.language || 'en-US';
    const voiceId = pick('voiceId') || callerIdentity?.voiceId || 'alice';
    const record = parseBoolean(pick('record'), settings.recordCalls);
    const transcribe = parseBoolean(pick('transcribe'), settings.transcribeCalls);

    if (!forward) {
      const unavailable = buildEndTwiml({
        appUrl,
        language,
        voiceId,
        spokenText: 'Thanks for answering. Our team line is currently unavailable. We will call you back shortly.',
      });

      return new NextResponse(unavailable, {
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    // Optional fallback to original one-shot flow.
    const forceLegacy = mode === 'legacy' || process.env.AI_CONVERSATION_MODE === 'false';
    if (forceLegacy) {
      const twiml = generateCallTwiML(legacyScript, forward, callSid, {
        record,
        transcribe,
        transcriptionCallback: `${appUrl}/api/calls/transcription`,
        webSocketUrl: settings.webSocketUrl,
        language,
        voiceId,
        ttsAudioUrl: !isTwilioNativeVoice(voiceId)
          ? buildTtsAudioUrl({ appUrl, text: legacyScript, voiceId, language })
          : '',
      });

      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    const decodedState = decodeState(url.searchParams.get('ctx'));
    const conversationState: ConversationState = decodedState || {
      turn: 0,
      noInputCount: 0,
      brief: clipText(legacyScript, 360),
      history: [],
    };

    if (!conversationState.brief) {
      conversationState.brief = clipText(callerIdentity?.script || legacyScript, 360);
    }

    const callerName = callerIdentity?.name || pick('callerName') || 'Sara';
    const callerPosition = callerIdentity?.position || pick('callerPosition') || 'Sales Specialist';
    const businessName = settings.businessName || 'our team';

    if (!speechResult) {
      if (conversationState.turn === 0) {
        conversationState.turn = 1;
        conversationState.noInputCount = 0;

        const opening = buildOpeningLine({
          callerName,
          callerPosition,
          businessName,
          mentionAi: callerIdentity?.mentionAi ?? false,
          brief: conversationState.brief,
        });

        conversationState.history.push({ role: 'agent', text: opening });

        const twiml = buildConversationTwiml({
          appUrl,
          forward,
          callSid,
          language,
          voiceId,
          callerIdentityId,
          record,
          transcribe,
          mode: 'conversation',
          state: conversationState,
          spokenText: opening,
        });

        return new NextResponse(twiml, {
          headers: { 'Content-Type': 'application/xml' },
        });
      }

      conversationState.noInputCount += 1;

      if (conversationState.noInputCount >= 2) {
        const twiml = buildEndTwiml({
          appUrl,
          language,
          voiceId,
          spokenText: 'No worries, I will let you go. Thanks for your time and have a great day.',
        });

        return new NextResponse(twiml, {
          headers: { 'Content-Type': 'application/xml' },
        });
      }

      const reprompt = 'I can keep this very short. Would you like a quick summary, or should I call later?';
      conversationState.history.push({ role: 'agent', text: reprompt });

      const twiml = buildConversationTwiml({
        appUrl,
        forward,
        callSid,
        language,
        voiceId,
        callerIdentityId,
        record,
        transcribe,
        mode: 'conversation',
        state: conversationState,
        spokenText: reprompt,
      });

      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    conversationState.noInputCount = 0;
    conversationState.history.push({ role: 'lead', text: speechResult });

    const decision = await generateConversationDecision({
      leadUtterance: speechResult,
      campaignBrief: conversationState.brief,
      language,
      callerName,
      callerPosition,
      businessName,
      industry: callerIdentity?.industry || settings.industry || '',
      companyDetails: settings.companyDetails || '',
      mentionAi: callerIdentity?.mentionAi ?? false,
      sayThisRules: callerIdentity?.sayThisRules || settings.sayThisRules || '',
      avoidThisRules: callerIdentity?.avoidThisRules || settings.avoidThisRules || '',
      history: conversationState.history,
    });

    let action = decision.action;
    const reply = clipText(decision.reply, 280);

    // Keep calls concise. After enough turns, hand off if not closed yet.
    if (conversationState.turn >= MAX_TURNS && action === 'continue') {
      action = 'forward';
    }

    conversationState.turn += 1;
    conversationState.history.push({ role: 'agent', text: reply });

    if (action === 'forward') {
      const twiml = buildForwardTwiml({
        appUrl,
        callSid,
        forward,
        language,
        voiceId,
        record,
        spokenText: reply || 'Great, I can connect you now with our team.',
      });

      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    if (action === 'end') {
      const twiml = buildEndTwiml({
        appUrl,
        language,
        voiceId,
        spokenText: reply || 'Thank you for your time today. Have a great day.',
      });

      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    const twiml = buildConversationTwiml({
      appUrl,
      forward,
      callSid,
      language,
      voiceId,
      callerIdentityId,
      record,
      transcribe,
      mode: 'conversation',
      state: conversationState,
      spokenText: reply || 'Got it. What would you like to know first?',
    });

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('Answer handler error:', error);

    const response = new twilio.twiml.VoiceResponse();
    response.say('An error occurred. Please try again later.');

    return new NextResponse(response.toString(), {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}

export async function GET(request: NextRequest) {
  return handleAnswer(request);
}

export async function POST(request: NextRequest) {
  return handleAnswer(request);
}

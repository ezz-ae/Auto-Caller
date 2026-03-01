import twilio from 'twilio';
import { resolvePublicAppUrl } from '@/lib/public-app-url';
import { generateConversationDecision, type ConversationTurn } from '@/lib/conversation-agent';

function asBool(name: string, fallback = false): boolean {
  const raw = String(process.env[name] || '').trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

export function isDemoCallEnabled(): boolean {
  return asBool('DEMO_CALL_ENABLED', true);
}

export function getDemoTwilioConfig() {
  const accountSid = String(process.env.DEMO_TWILIO_ACCOUNT_SID || process.env.MANAGED_TWILIO_ACCOUNT_SID || '').trim();
  const authToken = String(process.env.DEMO_TWILIO_AUTH_TOKEN || process.env.MANAGED_TWILIO_AUTH_TOKEN || '').trim();
  const fromNumber = String(process.env.DEMO_TWILIO_FROM_NUMBER || process.env.MANAGED_TWILIO_PHONE_NUMBER || process.env.MANAGED_DEFAULT_NUMBER || '').trim();

  return {
    accountSid,
    authToken,
    fromNumber,
  };
}

export function getDemoLanguage(): string {
  return String(process.env.DEMO_CALL_LANGUAGE || 'en-US').trim() || 'en-US';
}

export function getDemoVoice(): string {
  return String(process.env.DEMO_CALL_TWILIO_VOICE || 'alice').trim() || 'alice';
}

export function getDemoAgentName(): string {
  return String(process.env.DEMO_CALL_AGENT_NAME || 'Sara').trim() || 'Sara';
}

export function getDemoBusinessName(): string {
  return String(process.env.DEMO_CALL_BUSINESS_NAME || 'Callware').trim() || 'Callware';
}

export function getDemoMaxTurns(): number {
  const raw = Number(process.env.DEMO_CALL_MAX_TURNS || 2);
  if (!Number.isFinite(raw)) return 2;
  return Math.max(1, Math.min(4, Math.floor(raw)));
}

export function normalizePhoneNumber(input: string): string {
  let value = String(input || '').trim();
  if (!value) return '';

  value = value.replace(/[\s().-]+/g, '');
  if (value.startsWith('00')) value = `+${value.slice(2)}`;
  if (value.startsWith('+')) {
    value = `+${value.slice(1).replace(/\D/g, '')}`;
  } else {
    value = value.replace(/\D/g, '');
  }

  const digits = value.replace(/\D/g, '').length;
  if (digits < 8 || digits > 15) return '';

  if (!value.startsWith('+')) {
    return `+${value}`;
  }

  return value;
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for') || headers.get('x-real-ip') || headers.get('cf-connecting-ip') || '';
  if (!forwarded) return 'unknown';
  const first = forwarded.split(',')[0]?.trim();
  return first || 'unknown';
}

export function cleanSpokenText(input: string, max = 220): string {
  const normalized = String(input || '')
    .replace(/\*\*/g, '')
    .replace(/[#`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

function getDemoBrief(): string {
  const custom = String(process.env.DEMO_CALL_BRIEF || '').trim();
  if (custom) return custom;
  const business = getDemoBusinessName();
  return [
    'Goal: demonstrate natural AI sales conversation and qualify the lead.',
    'Audience: website visitors evaluating AI calling platform.',
    `Offer: ${business} gives caller identities, campaign scheduling, lead tracking, and callback automation.`,
    'Qualification: team size, monthly lead volume, current follow-up bottleneck, desired launch timeline.',
    'CTA: invite them to start free and book onboarding in dashboard.',
  ].join('\n');
}

function toConversationHistory(turns: Array<{ role: 'agent' | 'lead'; text: string }>): ConversationTurn[] {
  return turns
    .filter(item => !!item.text)
    .map(item => ({
      role: item.role,
      text: String(item.text || '').trim(),
    }))
    .slice(-8);
}

export async function generateDemoAgentReply(params: {
  leadUtterance: string;
  turn: number;
  leadName?: string;
  history: Array<{ role: 'agent' | 'lead'; text: string }>;
}): Promise<{ reply: string; shouldEnd: boolean }> {
  const leadUtterance = cleanSpokenText(params.leadUtterance, 260);
  if (!leadUtterance) {
    return {
      reply: 'I did not catch that clearly. Could you repeat in one short sentence?',
      shouldEnd: false,
    };
  }

  const decision = await generateConversationDecision({
    leadUtterance,
    campaignBrief: getDemoBrief(),
    language: getDemoLanguage(),
    turn: Math.max(1, params.turn),
    callerName: getDemoAgentName(),
    callerPosition: 'AI calling specialist',
    businessName: getDemoBusinessName(),
    industry: 'SaaS',
    companyDetails: 'This is a short live demo call from our landing page.',
    mentionAi: true,
    sayThisRules: 'Be concise, human, and practical. Keep each response under 35 words.',
    avoidThisRules: 'Do not ask for sensitive personal or payment information.',
    history: toConversationHistory(params.history),
  });

  const maxTurns = getDemoMaxTurns();
  const shouldEnd = params.turn >= maxTurns || decision.action === 'end';
  return {
    reply: cleanSpokenText(decision.reply, 240),
    shouldEnd,
  };
}

export async function createDemoOutboundCall(params: {
  to: string;
  sessionId: string;
}) {
  const config = getDemoTwilioConfig();
  if (!config.accountSid || !config.authToken || !config.fromNumber) {
    throw new Error('Demo call is not configured. Set DEMO_TWILIO_* (or MANAGED_TWILIO_*) env vars.');
  }

  const client = twilio(config.accountSid, config.authToken);
  const appUrl = resolvePublicAppUrl();

  const answerUrl = new URL('/api/demo-call/answer', appUrl);
  answerUrl.searchParams.set('sessionId', params.sessionId);

  const statusUrl = new URL('/api/demo-call/status', appUrl);
  statusUrl.searchParams.set('sessionId', params.sessionId);

  const call = await client.calls.create({
    to: params.to,
    from: config.fromNumber,
    url: answerUrl.toString(),
    method: 'POST',
    statusCallback: statusUrl.toString(),
    statusCallbackMethod: 'POST',
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'busy', 'failed', 'no-answer'],
    timeout: 22,
  });

  return {
    sid: call.sid,
    status: call.status,
    fromNumber: config.fromNumber,
  };
}

export function buildDemoGreeting(leadName?: string): string {
  const agent = getDemoAgentName();
  const business = getDemoBusinessName();
  const normalizedLeadName = String(leadName || '').trim();
  const namePart = normalizedLeadName ? ` ${normalizedLeadName},` : '';
  return `Hi${namePart} this is ${agent}, an AI specialist from ${business}. This is your live demo call. In one sentence, what kind of outbound calls do you want to automate first?`;
}

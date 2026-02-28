import OpenAI from 'openai';

export type ConversationAction = 'continue' | 'forward' | 'end';

export interface ConversationTurn {
  role: 'agent' | 'lead';
  text: string;
}

export interface ConversationContext {
  leadUtterance: string;
  campaignBrief: string;
  language: string;
  callerName: string;
  callerPosition: string;
  businessName: string;
  industry: string;
  companyDetails: string;
  mentionAi: boolean;
  sayThisRules: string;
  avoidThisRules: string;
  history: ConversationTurn[];
}

export interface ConversationDecision {
  reply: string;
  action: ConversationAction;
  reason: string;
}

function clipText(input: string, max = 320): string {
  const cleaned = String(input || '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function normalizeAction(value: string): ConversationAction {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'forward') return 'forward';
  if (normalized === 'end') return 'end';
  return 'continue';
}

function extractJsonObject(raw: string): Record<string, any> {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response did not contain JSON');
    return JSON.parse(match[0]);
  }
}

function heuristicDecision(context: ConversationContext): ConversationDecision {
  const utterance = String(context.leadUtterance || '').toLowerCase();

  const endSignals = [
    'not interested',
    "don't call",
    'do not call',
    'stop calling',
    'remove me',
    'wrong number',
    'no thanks',
    'leave me alone',
  ];

  if (endSignals.some(signal => utterance.includes(signal))) {
    return {
      action: 'end',
      reason: 'Lead declined call',
      reply: 'Understood. Thank you for your time, and I will not keep you any longer. Have a great day.',
    };
  }

  const forwardSignals = [
    'interested',
    'tell me more',
    'price',
    'cost',
    'how much',
    'meeting',
    'schedule',
    'book',
    'human',
    'agent',
    'representative',
    'send details',
  ];

  if (forwardSignals.some(signal => utterance.includes(signal))) {
    return {
      action: 'forward',
      reason: 'Lead is warm and ready for human handoff',
      reply: 'Perfect, that sounds good. I can connect you now with our team so they can share details and next steps.',
    };
  }

  return {
    action: 'continue',
    reason: 'Continue discovery',
    reply: 'Thanks for sharing. In one sentence, what matters most to you so I can tailor this for you?',
  };
}

function getGoogleApiKey(): string {
  return (
    process.env.MANAGED_GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ''
  ).trim();
}

function getGoogleModel(): string {
  const model =
    process.env.AI_CALL_MODEL ||
    process.env.GOOGLE_AI_CALL_MODEL ||
    process.env.GOOGLE_AI_MODEL ||
    process.env.GEMINI_MODEL ||
    'gemini-1.5-flash';

  return String(model).replace(/^models\//i, '').trim();
}

function getOpenAIApiKey(): string {
  return (
    process.env.MANAGED_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ''
  ).trim();
}

function getOpenAIModel(): string {
  return (
    process.env.OPENAI_CALL_MODEL ||
    process.env.OPENAI_MODEL ||
    'gpt-4o-mini'
  ).trim();
}

function buildSystemPrompt(context: ConversationContext): string {
  return `You are a live outbound AI phone caller named ${context.callerName || 'Sara'}.

GOAL:
Hold a natural, intelligent conversation. Do NOT read a script verbatim.

STYLE:
- Sound human and warm.
- Speak like a real person on a phone call, not a bot.
- Use contractions naturally (I'm, you're, that's).
- Use short spoken sentences (usually 6-20 words).
- Use occasional natural backchannels when relevant (got it, sure, makes sense, absolutely).
- Use natural pauses with punctuation where needed.
- Ask only one focused follow-up question at a time.
- Answer questions directly.
- Never sound robotic or repetitive.
- Never read a long pitch monologue.
- Never use markdown, bullets, stage directions, or bracketed cues.

BUSINESS CONTEXT:
- Business: ${context.businessName || 'Our company'}
- Industry: ${context.industry || 'General'}
- Caller role: ${context.callerPosition || 'Specialist'}
- Mention AI in opening when required: ${context.mentionAi ? 'Yes' : 'No'}
- Must say rules: ${context.sayThisRules || 'None'}
- Avoid rules: ${context.avoidThisRules || 'None'}

DECISION RULES:
- action="forward" if lead is warm/interested, asks for details/pricing, or requests a human.
- action="end" if lead clearly declines, asks to stop, wrong number, or wants no future contact.
- action="continue" otherwise.

OUTPUT:
Return STRICT JSON only:
{
  "reply": "short spoken response",
  "action": "continue|forward|end",
  "reason": "very short reason"
}`;
}

function buildUserPrompt(context: ConversationContext): string {
  const history = context.history
    .slice(-6)
    .map(turn => `${turn.role === 'lead' ? 'Lead' : 'Agent'}: ${turn.text}`)
    .join('\n');

  return `Language for reply: ${context.language || 'en-US'}
Campaign brief (reference only, do not read literally):
${clipText(context.campaignBrief, 900)}

Company details:
${clipText(context.companyDetails, 500) || 'Not provided'}

Conversation so far:
${history || 'No previous turns'}

Latest lead message:
${clipText(context.leadUtterance, 500)}

Generate the next best response now.`;
}

function coerceDecision(raw: Record<string, any>, fallback: ConversationDecision): ConversationDecision {
  const reply = normalizeSpokenReply(String(raw.reply || ''));
  if (!reply) return fallback;

  return {
    reply,
    action: normalizeAction(String(raw.action || 'continue')),
    reason: clipText(String(raw.reason || 'AI response'), 120),
  };
}

function normalizeSpokenReply(input: string): string {
  const cleaned = clipText(String(input || ''), 320)
    .replace(/[*_`#>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  // Keep responses concise for real phone cadence.
  const words = cleaned.split(' ');
  if (words.length <= 34) return cleaned;
  return `${words.slice(0, 34).join(' ').trim()}...`;
}

async function requestGemini(context: ConversationContext): Promise<ConversationDecision> {
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    throw new Error('Google AI key missing');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(getGoogleModel())}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const fallback = heuristicDecision(context);
  const systemPrompt = buildSystemPrompt(context);
  const userPrompt = buildUserPrompt(context);

  const requestBodies = [
    {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.65,
        responseMimeType: 'application/json',
        maxOutputTokens: 400,
      },
    },
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 400,
      },
    },
  ];

  let lastError = 'Gemini request failed';

  for (const body of requestBodies) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      lastError = data?.error?.message || `Gemini request failed (${response.status})`;
      continue;
    }

    const text = (data?.candidates || [])
      .flatMap((candidate: any) => candidate?.content?.parts || [])
      .map((part: any) => String(part?.text || ''))
      .join('\n')
      .trim();

    if (!text) {
      lastError = 'Gemini returned empty response';
      continue;
    }

    const parsed = extractJsonObject(text);
    return coerceDecision(parsed, fallback);
  }

  throw new Error(lastError);
}

async function requestOpenAI(context: ConversationContext): Promise<ConversationDecision> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error('OpenAI key missing');
  }

  const client = new OpenAI({ apiKey });
  const fallback = heuristicDecision(context);

  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(context) },
    { role: 'user' as const, content: buildUserPrompt(context) },
  ];

  const attempts: Array<() => Promise<string>> = [
    async () => {
      const completion = await client.chat.completions.create({
        model: getOpenAIModel(),
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.65,
        max_tokens: 250,
      });
      return String(completion.choices[0]?.message?.content || '');
    },
    async () => {
      const completion = await client.chat.completions.create({
        model: getOpenAIModel(),
        messages,
        temperature: 0.65,
        max_tokens: 250,
      });
      return String(completion.choices[0]?.message?.content || '');
    },
  ];

  let lastError = 'OpenAI request failed';

  for (const attempt of attempts) {
    try {
      const raw = await attempt();
      if (!raw.trim()) {
        lastError = 'OpenAI returned empty response';
        continue;
      }

      const parsed = extractJsonObject(raw);
      return coerceDecision(parsed, fallback);
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'OpenAI request failed';
    }
  }

  throw new Error(lastError);
}

export async function generateConversationDecision(context: ConversationContext): Promise<ConversationDecision> {
  const fallback = heuristicDecision(context);

  try {
    return await requestGemini(context);
  } catch (geminiError) {
    try {
      return await requestOpenAI(context);
    } catch (openaiError) {
      console.warn('Conversation AI fallback engaged', {
        geminiError: geminiError instanceof Error ? geminiError.message : String(geminiError),
        openaiError: openaiError instanceof Error ? openaiError.message : String(openaiError),
      });
      return fallback;
    }
  }
}

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
  turn: number;
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

type LeadMood = 'positive' | 'skeptical' | 'neutral' | 'decline';

interface TargetBlueprint {
  goal: string;
  audience: string;
  offer: string;
  qualification: string[];
  cta: string;
  constraints: string;
}

const DECLINE_SIGNALS = [
  'not interested',
  "don't call",
  'do not call',
  'stop calling',
  'remove me',
  'wrong number',
  'no thanks',
  'leave me alone',
  'unsubscribe',
  'stop',
];

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

function getHumanizationLevel(): 'low' | 'medium' | 'high' {
  const raw = String(process.env.AI_CALL_HUMANIZATION_LEVEL || 'high').trim().toLowerCase();
  if (raw === 'low' || raw === 'medium' || raw === 'high') return raw;
  return 'high';
}

function getBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = String(process.env[name] || '').trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

function hasAny(text: string, patterns: string[]): boolean {
  return patterns.some(pattern => text.includes(pattern));
}

function hasExplicitDecline(input: string): boolean {
  const text = String(input || '').toLowerCase();
  return hasAny(text, DECLINE_SIGNALS);
}

function parseTargetBlueprint(raw: string): TargetBlueprint {
  const value = String(raw || '');
  const read = (field: string) => {
    const regex = new RegExp(`^\\s*${field}\\s*:\\s*(.+)$`, 'im');
    const match = value.match(regex);
    return (match?.[1] || '').trim();
  };

  const qualificationRaw =
    read('Qualification') ||
    read('Qualify') ||
    read('Qualification Signals');

  const qualification = qualificationRaw
    .split(/[,\n+]/)
    .map(item => item.trim())
    .filter(Boolean);

  return {
    goal: read('Goal'),
    audience: read('Audience'),
    offer: read('Offer'),
    qualification,
    cta: read('CTA'),
    constraints: read('Avoid Saying') || read('Constraints') || '',
  };
}

function formatTargetBlueprint(blueprint: TargetBlueprint): string {
  return [
    `Goal: ${blueprint.goal || 'not specified'}`,
    `Audience: ${blueprint.audience || 'not specified'}`,
    `Offer: ${blueprint.offer || 'not specified'}`,
    `Qualification: ${blueprint.qualification.length > 0 ? blueprint.qualification.join(', ') : 'not specified'}`,
    `CTA: ${blueprint.cta || 'not specified'}`,
    `Constraints: ${blueprint.constraints || 'none'}`,
  ].join('\n');
}

function detectLeadMood(utterance: string): LeadMood {
  const text = String(utterance || '').toLowerCase();
  if (!text) return 'neutral';

  if (hasAny(text, ['not interested', "don't call", 'do not call', 'stop calling', 'wrong number', 'no thanks'])) {
    return 'decline';
  }

  if (hasAny(text, ['great', 'awesome', 'yes', 'sure', 'sounds good', 'perfect', 'cool', 'love that', 'haha', 'lol'])) {
    return 'positive';
  }

  if (hasAny(text, ['not sure', 'maybe', 'concern', 'worried', 'expensive', 'too much', 'busy', 'later'])) {
    return 'skeptical';
  }

  return 'neutral';
}

function deriveSmartQuestion(context: ConversationContext): string {
  const blueprint = parseTargetBlueprint(context.campaignBrief);
  const corpus = `${context.campaignBrief}\n${context.history.map(h => h.text).join('\n')}\n${context.leadUtterance}`.toLowerCase();
  const industry = String(context.industry || '').toLowerCase();

  const hasBudget = hasAny(corpus, ['budget', 'price', 'cost', 'how much', '$', 'aed']);
  const hasTiming = hasAny(corpus, ['timeline', 'when', 'this month', 'next month', 'urgent', 'soon']);
  const hasNeed = hasAny(corpus, ['need', 'looking for', 'interested in', 'want', 'goal']);
  const hasLocation = hasAny(corpus, ['location', 'area', 'city', 'neighborhood', 'where']);
  const hasDecisionMaker = hasAny(corpus, ['my wife', 'my husband', 'my partner', 'team', 'boss', 'manager', 'decision']);

  for (const signal of blueprint.qualification) {
    const normalizedSignal = signal.toLowerCase();
    if (!normalizedSignal) continue;
    if (!corpus.includes(normalizedSignal)) {
      return `Quick one so I can tailor this well: how would you describe your ${signal.toLowerCase()}?`;
    }
  }

  if (industry.includes('real estate') || industry.includes('property')) {
    if (!hasNeed) return 'Just so I can tailor this, are you focused on living in it or investment returns?';
    if (!hasLocation) return 'What area are you most interested in right now?';
    if (!hasBudget) return 'What budget range would feel comfortable for you?';
    if (!hasTiming) return 'What timeline are you targeting to move forward?';
  }

  if (!hasNeed) return 'What outcome are you hoping to achieve from this?';
  if (!hasBudget) return 'Do you already have a budget range in mind?';
  if (!hasTiming) return 'What timeline works best for you?';
  if (!hasDecisionMaker) return 'Will you be deciding on this yourself or with someone else?';
  if (blueprint.cta) return `Would you like me to ${blueprint.cta.toLowerCase()} now?`;

  return 'Would it help if I connect you now for exact next steps?';
}

function startsWithHumanCue(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.startsWith('yeah') ||
    normalized.startsWith('yep') ||
    normalized.startsWith('aha') ||
    normalized.startsWith('ah,') ||
    normalized.startsWith('hmm') ||
    normalized.startsWith('hm,') ||
    normalized.startsWith('umm') ||
    normalized.startsWith('um,') ||
    normalized.startsWith('uh,') ||
    normalized.startsWith('ohh') ||
    normalized.startsWith('oh,') ||
    normalized.startsWith('ooh') ||
    normalized.startsWith('okay') ||
    normalized.startsWith('sooo') ||
    normalized.startsWith('so,') ||
    normalized.startsWith('got it') ||
    normalized.startsWith('makes sense') ||
    normalized.startsWith('i hear you') ||
    normalized.startsWith('totally') ||
    normalized.startsWith('haha') ||
    normalized.startsWith('nice,') ||
    normalized.startsWith('sure,') ||
    normalized.startsWith('right,')
  );
}

function chooseBySeed<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

// Thinking/processing sounds that precede a reply when the agent is "processing" what was said
const THINKING_SOUNDS = ['Hmm. ', 'Umm. ', 'Mm. ', 'Ohh. ', 'Ahh. '];

// Used at the start of a turn when the reply begins mid-thought
const FILLER_BRIDGES = [
  'So, ', 'Okay, ', 'Right, ', 'Yeah, ', 'I mean, ', 'Well, ',
];

function maybeAddThinkingSound(text: string, mood: LeadMood, seed: number, level: 'low' | 'medium' | 'high'): string {
  if (level === 'low') return text;
  // Only add thinking sound on skeptical/neutral moods and alternating turns
  if (mood === 'positive') return text;
  if (seed % 4 !== 1) return text;
  const sound = chooseBySeed(THINKING_SOUNDS, seed);
  return sound + text.charAt(0).toLowerCase() + text.slice(1);
}

function withBreathingPauses(text: string, level: 'low' | 'medium' | 'high', seed: number): string {
  if (level === 'low') return text;
  if (text.length < 24) return text;

  // Occasionally stretch a comma into a longer spoken pause
  if (seed % 3 === 0 && text.includes('. ')) {
    return text.replace('. ', '... ');
  }

  if (level === 'high' && seed % 4 === 0 && text.includes(', ')) {
    return text.replace(', ', '... ');
  }

  return text;
}

function maybeAddLaughCue(text: string, mood: LeadMood, seed: number): string {
  if (mood !== 'positive') return text;
  if (seed % 8 !== 0) return text;
  if (text.toLowerCase().includes('haha') || text.toLowerCase().includes('haa')) return text;
  return `Haha, ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

function injectHumanTexture(
  reply: string,
  action: ConversationAction,
  context: ConversationContext,
  mood: LeadMood
): string {
  const level = getHumanizationLevel();
  const expressive = getBooleanEnv('AI_CALL_EXPRESSIVE_MODE', true);
  if (!expressive) return reply;

  let text = String(reply || '').replace(/\s+/g, ' ').trim();
  if (!text) return text;

  const seed = context.turn + context.leadUtterance.length + context.history.length;

  if (!startsWithHumanCue(text) && action !== 'end') {
    const positiveCues = [
      'Yeah, ', 'Oh nice, ', 'Got it, ', 'That makes sense, ',
      'Okay cool, ', 'Totally, ', 'Aha, ', 'Oh great, ', 'Niice, ',
    ];
    const skepticalCues = [
      'Yeah, fair enough, ', 'No, I get that, ', 'Mm, understandable, ',
      'Ahh okay, ', 'Hmm, right, ', 'Yeah I hear you, ',
    ];
    const neutralCues = [
      'Yeah, ', 'Got it, ', 'Sure, ', 'Okay, ', 'Right, ',
      'Ah, ', 'Mm-hmm, ', 'Ohh, ', 'Uh-huh, ',
    ];

    const cue = mood === 'positive'
      ? chooseBySeed(positiveCues, seed)
      : mood === 'skeptical'
        ? chooseBySeed(skepticalCues, seed)
        : chooseBySeed(neutralCues, seed);

    text = `${cue}${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  }

  // Occasionally prepend a thinking sound before the full opener (medium/high only)
  if (level !== 'low' && !startsWithHumanCue(text)) {
    text = maybeAddThinkingSound(text, mood, seed, level);
  }

  // Occasionally swap the opener for a softer filler bridge ("So," "Okay," etc.)
  if (level === 'high' && seed % 6 === 2 && !startsWithHumanCue(text)) {
    const bridge = chooseBySeed(FILLER_BRIDGES, seed);
    text = bridge + text.charAt(0).toLowerCase() + text.slice(1);
  }

  text = withBreathingPauses(text, level, seed);

  if (getBooleanEnv('AI_CALL_ALLOW_LAUGH', true)) {
    text = maybeAddLaughCue(text, mood, seed);
  }

  if (action === 'continue' && !text.includes('?')) {
    const question = deriveSmartQuestion(context);
    if (question) {
      text = `${text} ${question}`;
    }
  }

  return text;
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

  if (hasExplicitDecline(utterance)) {
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

  const mood = detectLeadMood(context.leadUtterance);
  const smartQuestion = deriveSmartQuestion(context);

  return {
    action: 'continue',
    reason: 'Continue discovery',
    reply: injectHumanTexture(
      smartQuestion || 'Thanks for sharing. In one sentence, what matters most to you so I can tailor this for you?',
      'continue',
      context,
      mood
    ),
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
    'gemini-2.0-flash';

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
  return `You are ${context.callerName || 'Sara'}, a real person making a live outbound phone call on behalf of ${context.businessName || 'our company'}.

CORE RULE:
You are NOT an AI assistant - you are a human caller. Never acknowledge being AI unless specifically instructed to.
Hold a genuine, intelligent conversation. Do not recite a script. Think like a person, respond like a person.

VOICE & CADENCE:
- Every response must sound exactly like natural spoken English on a phone call.
- Keep sentences short: 5-18 words each. Two or three sentences max per turn.
- Vary how you start each reply. Never begin with "I" twice in a row.
- Use contractions always: I'm, you're, that's, we've, it's, don't, won't, can't.
- Warm openers to use naturally (pick based on what the lead said):
  "Got it," / "Yeah," / "Oh nice," / "That makes sense," / "Totally," / "Sure," / "Mm, okay," / "Ah, right,"
- End most "continue" turns with a single, focused question. Never two questions.
- Mirror the lead's energy: if they're casual, be casual; if they're formal, be formal.
- Breathe naturally: occasional "..." mid-sentence is fine for real conversational feel.
- Never pitch. Discover, listen, then guide.

WHAT NEVER TO DO:
- Never start with "I'd like to..." or "I wanted to reach out..."
- Never list features or benefits in bullet format.
- Never say "As an AI..." or mention language models.
- Never use corporate filler: "Absolutely!", "Certainly!", "Of course!", "Great question!".
- Never repeat the lead's exact words back to them.
- Never give a monologue over 2 sentences.
- Never use markdown, asterisks, brackets, or stage directions.

BUSINESS CONTEXT:
- Business: ${context.businessName || 'Our company'}
- Industry: ${context.industry || 'General'}
- Your role: ${context.callerPosition || 'Specialist'}
- Disclose AI if asked directly: ${context.mentionAi ? 'Yes - say you are an AI assistant' : 'No - respond as a human unless pressed'}
- Always say: ${context.sayThisRules || 'Nothing specific'}
- Never say: ${context.avoidThisRules || 'Nothing specific'}

DECISION RULES:
- action="forward" - lead is warm, curious, asks price/details, or wants a human.
- action="end" - lead clearly declines, says stop calling, wrong number.
- action="continue" - still in discovery or building rapport.
- If lead asks any unrelated or unexpected question, answer briefly in a human way and continue the conversation.
- Never end the call just because you do not know an answer. Acknowledge, pivot, and ask one focused follow-up.

OUTPUT FORMAT - strict JSON only, no prose outside it:
{
  "reply": "spoken reply here",
  "action": "continue|forward|end",
  "reason": "one short phrase",
  "nextQuestion": "single follow-up question if action=continue, else omit"
}`;
}

function buildUserPrompt(context: ConversationContext): string {
  const blueprint = parseTargetBlueprint(context.campaignBrief);
  const history = context.history
    .slice(-6)
    .map(turn => `${turn.role === 'lead' ? 'Lead' : 'Agent'}: ${turn.text}`)
    .join('\n');

  return `Language for reply: ${context.language || 'en-US'}
Target blueprint (reference only, do not read literally):
${formatTargetBlueprint(blueprint)}

Raw target notes:
${clipText(context.campaignBrief, 900)}

Company details:
${clipText(context.companyDetails, 500) || 'Not provided'}

Conversation so far:
${history || 'No previous turns'}

Latest lead message:
${clipText(context.leadUtterance, 500)}

Recommended discovery angle:
${deriveSmartQuestion(context)}

Generate the next best response now.`;
}

function coerceDecision(raw: Record<string, any>, fallback: ConversationDecision, context: ConversationContext): ConversationDecision {
  const mood = detectLeadMood(context.leadUtterance);
  const requestedAction = normalizeAction(String(raw.action || 'continue'));
  const shouldBlockEnd = requestedAction === 'end' && !hasExplicitDecline(context.leadUtterance);
  const action: ConversationAction = shouldBlockEnd ? 'continue' : requestedAction;
  const nextQuestion = String(raw.nextQuestion || '').trim();
  const rawReply = String(raw.reply || '');
  const closingTone = /(goodbye|have a great day|thanks for your time|i will not keep you)/i.test(rawReply);
  const safeReply = shouldBlockEnd && closingTone ? fallback.reply : rawReply;
  const mergedReply = action === 'continue' && nextQuestion && !safeReply.includes('?')
    ? `${safeReply} ${nextQuestion}`
    : safeReply;
  const reply = normalizeSpokenReply(injectHumanTexture(mergedReply, action, context, mood));
  if (!reply) {
    if (shouldBlockEnd) {
      return {
        reply: fallback.reply,
        action: 'continue',
        reason: 'Kept conversation open on non-decline utterance',
      };
    }
    return fallback;
  }

  return {
    reply,
    action,
    reason: clipText(String(raw.reason || 'AI response'), 120),
  };
}

function normalizeSpokenReply(input: string): string {
  const cleaned = clipText(String(input || ''), 320)
    .replace(/[*_`#>\[\]{}()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  // Keep responses concise for phone cadence but allow natural warmth.
  const words = cleaned.split(' ');
  if (words.length <= 55) return cleaned;
  return `${words.slice(0, 55).join(' ').trim()}...`;
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
        temperature: 0.78,
        responseMimeType: 'application/json',
        maxOutputTokens: 350,
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
        temperature: 0.78,
        maxOutputTokens: 350,
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
    return coerceDecision(parsed, fallback, context);
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
        temperature: 0.78,
        max_tokens: 350,
      });
      return String(completion.choices[0]?.message?.content || '');
    },
    async () => {
      const completion = await client.chat.completions.create({
        model: getOpenAIModel(),
        messages,
        temperature: 0.78,
        max_tokens: 350,
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
      return coerceDecision(parsed, fallback, context);
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

import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function safeClip(value: unknown, max = 240): string {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function buildDeterministicScriptSuggestion(input: {
  prompt: string;
  context: {
    businessName?: string;
    industry?: string;
    companyDetails?: string;
    targetProfile?: string;
    audience?: string;
    objective?: string;
    tone?: string;
    language?: string;
    callerName?: string;
    callerPosition?: string;
    mentionAi?: boolean;
    sayThisRules?: string;
    avoidThisRules?: string;
  };
}) {
  const businessName = safeClip(input.context.businessName || 'your company', 80);
  const audience = safeClip(input.context.audience || 'old leads', 80);
  const objective = safeClip(input.context.objective || 'book a follow-up call', 120);
  const offer = safeClip(input.context.targetProfile || input.context.companyDetails || input.prompt || 'a practical business update', 160);
  const callerName = safeClip(input.context.callerName || 'Sara', 60);
  const callerPosition = safeClip(input.context.callerPosition || 'reactivation specialist', 80);
  const disclosure = input.context.mentionAi
    ? `This is an automated call on behalf of ${businessName}. `
    : '';

  const targetBrief = [
    `${disclosure}Hi, this is ${callerName}, ${callerPosition} at ${businessName}.`,
    `I'm reaching out to ${audience} about ${offer}.`,
    `Goal: ${objective}.`,
    input.context.sayThisRules ? `Must say: ${safeClip(input.context.sayThisRules, 180)}.` : '',
    input.context.avoidThisRules ? `Avoid saying: ${safeClip(input.context.avoidThisRules, 180)}.` : '',
  ].filter(Boolean).join(' ');

  return {
    success: true,
    reply: 'I prepared a launch-ready target blueprint with qualification and CTA flow.',
    targetBrief,
    targetProfile: {
      goal: objective,
      audience,
      offer,
      qualification: [
        'Does the lead still need this service now?',
        'Is budget and decision timeline known?',
        'Can the lead commit to a next step today?',
      ],
      cta: objective,
      constraints: [
        input.context.mentionAi ? 'Keep automated-call disclosure in opening.' : 'Use direct business introduction.',
        input.context.avoidThisRules ? safeClip(input.context.avoidThisRules, 140) : 'Do not over-explain technical details.',
      ],
    },
    script: targetBrief,
    objections: [
      'If busy: acknowledge and ask for a better callback time today.',
      'If uncertain: restate one concrete benefit and ask one qualifying question.',
      'If no interest: confirm and offer opt-out respectfully.',
    ],
    discoveryQuestions: [
      'What outcome are you trying to achieve right now?',
      'When do you want to start?',
      'Who else is involved in the decision?',
      'What stopped follow-up from working before?',
    ],
    conversationMoves: buildFallbackConversationMoves({
      objective,
      audience,
      offer,
    }),
    profileSummary: `${callerName} (${callerPosition}) focused on ${objective}.`,
    source: 'deterministic-fallback',
  };
}

function buildFallbackConversationMoves(profile: {
  objective?: string;
  audience?: string;
  offer?: string;
}): string[] {
  const objective = String(profile.objective || 'book a follow-up call').trim();
  const audience = String(profile.audience || 'lead').trim();
  const offer = String(profile.offer || 'your offer').trim();

  return [
    `If the ${audience} says "I'm busy", acknowledge and ask for a better callback window in the same day.`,
    `If the lead asks "what is this about?", answer in one line: ${offer}, then ask one qualifying question.`,
    `When intent is warm, confirm value quickly and move to CTA: ${objective}.`,
  ];
}

function normalizeGeminiModel(rawModel: string): string {
  const trimmed = String(rawModel || '').trim();
  if (!trimmed) return 'gemini-1.5-flash';
  return trimmed.replace(/^models\//i, '');
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

async function generateJsonWithGemini(payload: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}) {
  const normalizedModel = normalizeGeminiModel(payload.model);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:generateContent?key=${encodeURIComponent(payload.apiKey)}`;

  const requestBodies = [
    {
      systemInstruction: {
        parts: [{ text: payload.systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: payload.userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        maxOutputTokens: 2048,
      },
    },
    // Fallback for accounts/models that reject responseMimeType or systemInstruction.
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${payload.systemPrompt}\n\n${payload.userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    },
  ];

  let lastError = '';
  for (const body of requestBodies) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      lastError = data?.error?.message || `Google AI request failed: ${response.status}`;
      continue;
    }

    const text = (data?.candidates || [])
      .flatMap((candidate: any) => candidate?.content?.parts || [])
      .map((part: any) => part?.text || '')
      .join('\n')
      .trim();

    if (!text) {
      lastError = 'Google AI returned an empty response';
      continue;
    }

    return extractJsonObject(text);
  }

  throw new Error(lastError || 'Google AI request failed');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = (body.messages || []) as ChatMessage[];
    const prompt = (body.prompt || '') as string;
    const context = (body.context || {}) as {
      businessName?: string;
      industry?: string;
      companyDetails?: string;
      targetProfile?: string;
      audience?: string;
      objective?: string;
      tone?: string;
      language?: string;
      callerName?: string;
      callerPosition?: string;
      mentionAi?: boolean;
      sayThisRules?: string;
      avoidThisRules?: string;
    };

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = (
      process.env.MANAGED_GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      ''
    ).trim();
    const model =
      normalizeGeminiModel(process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || '') ||
      process.env.GEMINI_MODEL ||
      'gemini-1.5-flash';

    if (!apiKey) {
      return NextResponse.json(buildDeterministicScriptSuggestion({ prompt, context }));
    }

    const history = messages
      .slice(-8)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are an expert outbound call strategist.
Generate a target-driven conversation blueprint for live AI phone calls.
Do NOT produce a rigid script reader flow.
You must personalize the target using caller identity and company profile.
If mentionAi is true, disclose AI clearly in the opening line.
Respect "must say" and "avoid saying" rules strictly.
Always return valid JSON with:
- reply: brief assistant response
- targetBrief: concise target blueprint text
- targetProfile: object with keys goal, audience, offer, qualification (array), cta, constraints
- objections: array of 3 objection handling lines
- discoveryQuestions: array of 4 smart discovery questions
- conversationMoves: array of 3 adaptive conversation moves (if lead says X -> do Y)
- profileSummary: one short line about the caller identity you used`;

    const userPrompt = `Context:
- Business: ${context.businessName || 'Not provided'}
- Industry: ${context.industry || 'Not provided'}
- Company details: ${context.companyDetails || 'Not provided'}
- Existing target profile (if any): ${context.targetProfile || 'Not provided'}
- Audience: ${context.audience || 'General leads'}
- Objective: ${context.objective || 'Book a follow-up call'}
- Tone: ${context.tone || 'Professional and friendly'}
- Language: ${context.language || 'en-US'}
- Caller name: ${context.callerName || 'Not provided'}
- Caller position: ${context.callerPosition || 'Not provided'}
- Mention AI explicitly: ${context.mentionAi ? 'Yes' : 'No'}
- Must say: ${context.sayThisRules || 'None'}
- Avoid saying: ${context.avoidThisRules || 'None'}

Conversation history:
${history || 'No previous history'}

User request:
${prompt}`;

    try {
      const parsed = await generateJsonWithGemini({
        apiKey,
        model,
        systemPrompt,
        userPrompt,
      });

      return NextResponse.json({
        success: true,
        reply: parsed.reply || 'I drafted a target blueprint for you.',
        targetBrief: parsed.targetBrief || parsed.script || '',
        targetProfile: parsed.targetProfile || null,
        script: parsed.targetBrief || parsed.script || '',
        objections: Array.isArray(parsed.objections) ? parsed.objections : [],
        discoveryQuestions: Array.isArray(parsed.discoveryQuestions) ? parsed.discoveryQuestions : [],
        conversationMoves: Array.isArray(parsed.conversationMoves) && parsed.conversationMoves.length > 0
          ? parsed.conversationMoves.map((item: unknown) => String(item)).filter(Boolean).slice(0, 5)
          : buildFallbackConversationMoves({
              objective: context.objective,
              audience: context.audience,
              offer: context.targetProfile,
            }),
        profileSummary: parsed.profileSummary || '',
        source: 'gemini',
      });
    } catch (providerError) {
      console.error('Script assistant provider fallback:', providerError);
      return NextResponse.json(buildDeterministicScriptSuggestion({ prompt, context }));
    }
  } catch (error) {
    console.error('Target assistant error:', error);
    return NextResponse.json(buildDeterministicScriptSuggestion({
      prompt: 'Generate a resilient outbound target blueprint',
      context: {},
    }));
  }
}

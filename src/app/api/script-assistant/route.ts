import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
      return NextResponse.json({ error: 'Google AI API key is not configured on server' }, { status: 400 });
    }

    const history = messages
      .slice(-8)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are an expert outbound call strategist.
Generate natural conversation briefs for live AI phone calls (not rigid script reading).
You must personalize the brief using caller identity and company profile.
If mentionAi is true, disclose AI clearly in the opening line.
Respect "must say" and "avoid saying" rules strictly.
Always return valid JSON with:
- reply: brief assistant response
- script: conversation brief with opening, discovery prompts, and objection responses
- objections: array of 3 objection handling lines
- profileSummary: one short line about the caller identity you used`;

    const userPrompt = `Context:
- Business: ${context.businessName || 'Not provided'}
- Industry: ${context.industry || 'Not provided'}
- Company details: ${context.companyDetails || 'Not provided'}
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

    const parsed = await generateJsonWithGemini({
      apiKey,
      model,
      systemPrompt,
      userPrompt,
    });

    return NextResponse.json({
      success: true,
      reply: parsed.reply || 'I drafted a script for you.',
      script: parsed.script || '',
      objections: Array.isArray(parsed.objections) ? parsed.objections : [],
      profileSummary: parsed.profileSummary || '',
    });
  } catch (error) {
    console.error('Script assistant error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate script suggestion',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

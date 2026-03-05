import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function clip(input: unknown, max = 1200): string {
  const value = String(input || '').replace(/\s+/g, ' ').trim();
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
}

function isGreeting(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.length <= 12 && /^(hi|hey|hello|yo|salam|مرحبا)$/i.test(normalized)) return true;
  return /^(hi|hey|hello)\b[!.?]*$/i.test(normalized);
}

function fallbackReply(prompt: string): string {
  if (isGreeting(prompt)) {
    return 'Hi. Happy to help. What sales result do you want first: more demos, faster lead follow-up, or reactivating old opportunities?';
  }
  return 'Good direction. Share your industry, lead source, and average monthly lead volume, and I will suggest a clear first campaign setup.';
}

function normalizeGeminiModel(rawModel: string): string {
  const trimmed = String(rawModel || '').trim();
  if (!trimmed) return 'gemini-1.5-flash';
  return trimmed.replace(/^models\//i, '');
}

async function generateWithGemini(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${normalizeGeminiModel(params.model)}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: params.systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: params.userPrompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `Google AI request failed: ${response.status}`;
    throw new Error(message);
  }

  const text = (data?.candidates || [])
    .flatMap((candidate: any) => candidate?.content?.parts || [])
    .map((part: any) => String(part?.text || ''))
    .join('\n')
    .trim();

  if (!text) throw new Error('Google AI returned empty response');
  return clip(text, 900);
}

async function generateWithOpenAI(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const client = new OpenAI({ apiKey: params.apiKey });
  const completion = await client.chat.completions.create({
    model: params.model,
    temperature: 0.6,
    max_tokens: 300,
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userPrompt },
    ],
  });
  const text = String(completion.choices?.[0]?.message?.content || '').trim();
  if (!text) throw new Error('OpenAI returned empty response');
  return clip(text, 900);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = clip(body?.prompt || '', 500);
    const messages = Array.isArray(body?.messages) ? (body.messages as ChatMessage[]) : [];

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const googleApiKey = (
      process.env.MANAGED_GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      ''
    ).trim();

    const openaiApiKey = (
      process.env.MANAGED_OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      ''
    ).trim();

    const model = normalizeGeminiModel(process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5-flash');
    const history = messages
      .slice(-10)
      .map(message => `${message.role === 'user' ? 'User' : 'Assistant'}: ${clip(message.content, 240)}`)
      .join('\n');

    const systemPrompt = [
      'You are Maya, a sales strategy assistant for Callware.',
      'Audience is sales teams, not call centers.',
      'Use natural, human conversation.',
      'Do not push account creation when user just greets.',
      'First ask clarifying questions when context is missing.',
      'Keep replies concise (max 80 words).',
      'No bullet points unless user asks for a plan.',
    ].join(' ');

    const userPrompt = [
      `Conversation so far:\n${history || 'No prior messages.'}`,
      `\nLatest user message:\n${prompt}`,
      '\nGoal: Help the user map practical outbound sales follow-up workflows.',
    ].join('\n');

    if (googleApiKey) {
      try {
        const reply = await generateWithGemini({
          apiKey: googleApiKey,
          model,
          systemPrompt,
          userPrompt,
        });
        return NextResponse.json({ success: true, reply, source: 'gemini' });
      } catch (error) {
        console.error('marketing-assistant gemini fallback:', error);
      }
    }

    if (openaiApiKey) {
      const openaiModel = String(process.env.OPENAI_MARKETING_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
      const reply = await generateWithOpenAI({
        apiKey: openaiApiKey,
        model: openaiModel,
        systemPrompt,
        userPrompt,
      });
      return NextResponse.json({ success: true, reply, source: 'openai' });
    }

    return NextResponse.json({ success: true, reply: fallbackReply(prompt), source: 'fallback' });
  } catch (error) {
    console.error('marketing-assistant failed', error);
    return NextResponse.json({ success: true, reply: 'I can help with that. Tell me your industry and main sales goal, and I will map the next step.' });
  }
}

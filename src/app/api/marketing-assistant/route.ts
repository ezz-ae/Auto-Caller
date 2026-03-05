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
    return 'Hi, great to meet you. What are you in the mood to talk about?';
  }
  return 'I can help with that. Share a bit more context and I will give you a concrete answer.';
}

function buildContextualFallback(prompt: string, messages: ChatMessage[]): string {
  const text = prompt.trim().toLowerCase();
  const lastAssistant = [...messages].reverse().find(message => message.role === 'assistant')?.content || '';

  if (isGreeting(prompt)) {
    return 'Hi. Great to meet you. What sales outcome are you trying to improve first?';
  }

  if (/^(why|how|what do you mean)\b/.test(text)) {
    return 'Fair question. Give me a little more context and I will explain clearly.';
  }

  if (text.includes('food') || text.includes('dubai')) {
    return 'Absolutely. For food in Dubai, tell me your budget and vibe, and I will suggest great options.';
  }

  if (lastAssistant && lastAssistant.toLowerCase().includes('industry') && text.length < 30) {
    return 'Got it. Add one more detail so I can give you a better answer.';
  }

  return fallbackReply(prompt);
}

function normalizeGeminiModel(rawModel: string): string {
  const trimmed = String(rawModel || '').trim();
  if (!trimmed) return 'gemini-2.0-flash';
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

function getGeminiModelCandidates(preferred?: string): string[] {
  const candidates = [
    normalizeGeminiModel(preferred || ''),
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash-latest',
  ].filter(Boolean);

  return Array.from(new Set(candidates));
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
  let safePrompt = '';
  let safeMessages: ChatMessage[] = [];
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = clip(body?.prompt || '', 500);
    const messages = Array.isArray(body?.messages) ? (body.messages as ChatMessage[]) : [];
    safePrompt = prompt;
    safeMessages = messages;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const googleApiKey = (
      process.env.MANAGED_GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      ''
    ).trim();

    const openaiApiKey = (
      process.env.MANAGED_OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      ''
    ).trim();

    const model = normalizeGeminiModel(process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash');
    const history = messages
      .slice(-10)
      .map(message => `${message.role === 'user' ? 'User' : 'Assistant'}: ${clip(message.content, 240)}`)
      .join('\n');

    const systemPrompt = [
      'You are Maya, a sales strategy assistant for Callware.',
      'Speak like a warm, practical human, not a scripted bot.',
      'You can discuss general topics too; answer the user directly even if it is not about sales.',
      'If the topic is sales, give concrete and useful guidance.',
      'Do not push account creation on greetings.',
      'Ask one clarifying question only when needed.',
      'Keep replies concise (max 90 words), conversational, and varied.',
      'No bullet points unless user asks for a plan or list.',
    ].join(' ');

    const userPrompt = [
      `Conversation so far:\n${history || 'No prior messages.'}`,
      `\nLatest user message:\n${prompt}`,
      '\nGoal: Hold a natural conversation and be genuinely helpful on any topic, with stronger guidance when sales context is provided.',
    ].join('\n');

    if (googleApiKey) {
      let geminiLastError: unknown = null;
      const modelCandidates = getGeminiModelCandidates(model);
      for (const candidate of modelCandidates) {
        try {
          const reply = await generateWithGemini({
            apiKey: googleApiKey,
            model: candidate,
            systemPrompt,
            userPrompt,
          });
          return NextResponse.json({ success: true, reply, source: 'gemini' });
        } catch (error) {
          geminiLastError = error;
        }
      }
      console.error('marketing-assistant gemini fallback:', geminiLastError);
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

    return NextResponse.json({
      success: true,
      reply: buildContextualFallback(prompt, messages),
      source: 'fallback',
    });
  } catch (error) {
    console.error('marketing-assistant failed', error);
    const fallback = buildContextualFallback(safePrompt || 'hi', safeMessages);
    return NextResponse.json({ success: true, reply: fallback, source: 'fallback' });
  }
}

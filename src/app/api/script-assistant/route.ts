import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSettings } from '@/lib/store';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = (body.messages || []) as ChatMessage[];
    const prompt = (body.prompt || '') as string;
    const context = (body.context || {}) as {
      businessName?: string;
      audience?: string;
      objective?: string;
      tone?: string;
    };

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const settings = getSettings();
    const apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key is not configured on server' }, { status: 400 });
    }

    const client = new OpenAI({ apiKey });

    const history = messages
      .slice(-8)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are an expert outbound call strategist.
Generate short, high-converting sales call scripts.
Always return valid JSON with:
- reply: brief assistant response
- script: full call script ready to use
- objections: array of 3 objection handling lines`;

    const userPrompt = `Context:
- Business: ${context.businessName || 'Not provided'}
- Audience: ${context.audience || 'General leads'}
- Objective: ${context.objective || 'Book a follow-up call'}
- Tone: ${context.tone || 'Professional and friendly'}

Conversation history:
${history || 'No previous history'}

User request:
${prompt}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      reply: parsed.reply || 'I drafted a script for you.',
      script: parsed.script || '',
      objections: Array.isArray(parsed.objections) ? parsed.objections : [],
    });
  } catch (error) {
    console.error('Script assistant error:', error);
    return NextResponse.json(
      { error: 'Failed to generate script suggestion' },
      { status: 500 }
    );
  }
}

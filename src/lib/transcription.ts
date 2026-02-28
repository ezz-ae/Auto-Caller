import OpenAI from 'openai';
import { getSettings } from './store';
import { Transcript, TranscriptSegment } from './types';

let openaiClient: OpenAI | null = null;
let openaiClientKey = '';

function getGoogleApiKey(): string {
  return (
    process.env.MANAGED_GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ''
  );
}

function getGoogleModel(): string {
  return process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
}

async function getOpenAIApiKey(userId = 'default'): Promise<string> {
  const settings = await getSettings(userId);
  return settings.openaiApiKey || process.env.OPENAI_API_KEY || process.env.MANAGED_OPENAI_API_KEY || '';
}

async function getOpenAIClient(userId = 'default'): Promise<OpenAI> {
  const apiKey = await getOpenAIApiKey(userId);
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  if (openaiClient && openaiClientKey === apiKey) {
    return openaiClient;
  }

  openaiClientKey = apiKey;
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

function parseJsonResponse(raw: string): Record<string, any> {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response did not include valid JSON');
    return JSON.parse(match[0]);
  }
}

async function generateGeminiJson(payload: {
  prompt: string;
  temperature?: number;
  audioBuffer?: Buffer;
  model?: string;
}): Promise<Record<string, any>> {
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  const model = payload.model || getGoogleModel();
  const parts: Array<Record<string, any>> = [{ text: payload.prompt }];

  if (payload.audioBuffer) {
    parts.push({
      inline_data: {
        mime_type: 'audio/mpeg',
        data: payload.audioBuffer.toString('base64'),
      },
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        generationConfig: {
          temperature: payload.temperature ?? 0.2,
          responseMimeType: 'application/json',
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Google AI request failed (${response.status})`);
  }

  const text = (data?.candidates || [])
    .flatMap((candidate: any) => candidate?.content?.parts || [])
    .map((part: any) => part?.text || '')
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Google AI returned empty response');
  }

  return parseJsonResponse(text);
}

export function resetClient() {
  openaiClient = null;
  openaiClientKey = '';
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  options: {
    language?: string;
    prompt?: string;
    userId?: string;
  } = {}
): Promise<{
  text: string;
  segments: TranscriptSegment[];
  duration: number;
}> {
  const googleApiKey = getGoogleApiKey();
  if (googleApiKey) {
    try {
      const result = await generateGeminiJson({
        audioBuffer,
        temperature: 0.1,
        prompt: `Transcribe this phone call audio.
Return strict JSON with this exact schema:
{
  "text": "full transcript text",
  "segments": [{"id": 0, "text": "segment text", "start": 0, "end": 0}],
  "duration": 0
}
Rules:
- Keep transcript verbatim and clean.
- Use language ${options.language || 'auto-detect'}.
- If timestamps are unknown, return an empty segments array.
- Do not include markdown.`,
      });

      const text = String(result.text || '').trim();
      if (!text) {
        throw new Error('Google AI transcription returned empty text');
      }

      const segments: TranscriptSegment[] = Array.isArray(result.segments)
        ? result.segments
            .map((seg: any, index: number) => ({
              id: Number.isFinite(Number(seg?.id)) ? Number(seg.id) : index,
              text: String(seg?.text || '').trim(),
              start: Number.isFinite(Number(seg?.start)) ? Number(seg.start) : 0,
              end: Number.isFinite(Number(seg?.end)) ? Number(seg.end) : 0,
              confidence: Number.isFinite(Number(seg?.confidence)) ? Number(seg.confidence) : undefined,
            }))
            .filter((seg: TranscriptSegment) => seg.text.length > 0)
        : [];

      const duration = Number.isFinite(Number(result.duration)) ? Number(result.duration) : 0;

      return {
        text,
        segments,
        duration,
      };
    } catch (error) {
      const openAIApiKey = await getOpenAIApiKey(options.userId || 'default');
      if (!openAIApiKey) {
        throw error;
      }
      console.warn('Google transcription failed, falling back to OpenAI:', error);
    }
  }

  const client = await getOpenAIClient(options.userId || 'default');
  const file = new File([new Uint8Array(audioBuffer)], 'recording.mp3', { type: 'audio/mpeg' });
  const response = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: options.language || 'en',
    prompt: options.prompt || 'This is a phone call recording between a sales agent and a potential customer.',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  const segments: TranscriptSegment[] = (response as any).segments?.map((seg: any, index: number) => ({
    id: index,
    text: seg.text,
    start: seg.start,
    end: seg.end,
    confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : undefined,
  })) || [];

  return {
    text: response.text,
    segments,
    duration: (response as any).duration || 0,
  };
}

export async function analyzeTranscript(
  transcript: string,
  context?: {
    script?: string;
    phoneNumber?: string;
    campaignName?: string;
    userId?: string;
  }
): Promise<{
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  actionItems: string[];
  outcome: string;
  followUp: string;
}> {
  const googleApiKey = getGoogleApiKey();
  if (googleApiKey) {
    try {
      const result = await generateGeminiJson({
        temperature: 0.2,
        prompt: `Analyze this sales call transcript and return strict JSON:
{
  "summary": "1-2 sentence summary",
  "sentiment": "positive|neutral|negative",
  "keywords": ["keyword1", "keyword2"],
  "actionItems": ["action 1", "action 2"],
  "outcome": "brief outcome",
  "followUp": "recommended next step"
}
Transcript:
${transcript}

Context:
- Campaign: ${context?.campaignName || 'Unknown'}
- Phone: ${context?.phoneNumber || 'Unknown'}
- Script used: ${context?.script || 'Not provided'}`,
      });

      const sentiment = ['positive', 'neutral', 'negative'].includes(String(result.sentiment))
        ? String(result.sentiment)
        : 'neutral';

      return {
        summary: String(result.summary || 'Unable to generate summary'),
        sentiment: sentiment as 'positive' | 'neutral' | 'negative',
        keywords: Array.isArray(result.keywords) ? result.keywords.map((k: any) => String(k)) : [],
        actionItems: Array.isArray(result.actionItems) ? result.actionItems.map((k: any) => String(k)) : [],
        outcome: String(result.outcome || 'Unknown outcome'),
        followUp: String(result.followUp || 'No follow-up needed'),
      };
    } catch (error) {
      const openAIApiKey = await getOpenAIApiKey(context?.userId || 'default');
      if (!openAIApiKey) {
        throw error;
      }
      console.warn('Google analysis failed, falling back to OpenAI:', error);
    }
  }

  const client = await getOpenAIClient(context?.userId || 'default');
  const systemPrompt = `You are an expert sales call analyst. Analyze phone call transcripts and extract insights.
Always respond with valid JSON containing these fields:
- summary: A 1-2 sentence summary of the call
- sentiment: One of "positive", "neutral", or "negative"
- keywords: Array of 3-5 key topics mentioned
- actionItems: Array of follow-up actions needed (if any)
- outcome: Brief description of call outcome
- followUp: Recommended next step`;

  const userPrompt = `Analyze this call transcript${context?.campaignName ? ` from ${context.campaignName}` : ''}:

${transcript}

${context?.script ? `The agent's script was: ${context.script}` : ''}

Provide analysis as JSON.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  return {
    summary: result.summary || 'Unable to generate summary',
    sentiment: result.sentiment || 'neutral',
    keywords: result.keywords || [],
    actionItems: result.actionItems || [],
    outcome: result.outcome || 'Unknown outcome',
    followUp: result.followUp || 'No follow-up needed',
  };
}

export async function processRecording(
  audioBuffer: Buffer,
  context?: {
    script?: string;
    phoneNumber?: string;
    campaignName?: string;
    userId?: string;
  }
): Promise<Transcript> {
  const { text, segments } = await transcribeAudio(audioBuffer, { userId: context?.userId });
  const analysis = await analyzeTranscript(text, context);

  return {
    id: crypto.randomUUID(),
    recordingId: '',
    text,
    confidence: segments.length > 0
      ? segments.reduce((acc, s) => acc + (s.confidence || 0.8), 0) / segments.length
      : 0.8,
    segments,
    summary: analysis.summary,
    sentiment: analysis.sentiment,
    keywords: analysis.keywords,
    actionItems: analysis.actionItems,
    createdAt: new Date(),
  };
}

export async function quickTranscribe(audioBuffer: Buffer): Promise<string> {
  const { text } = await transcribeAudio(audioBuffer, { language: 'en' });
  return text;
}

export async function detectVoicemail(audioBuffer: Buffer): Promise<{
  isVoicemail: boolean;
  confidence: number;
  reason: string;
}> {
  const text = (await quickTranscribe(audioBuffer)).toLowerCase();

  const voicemailIndicators = [
    'leave a message',
    'after the tone',
    'after the beep',
    'not available',
    'leave your name',
    'please leave',
    'voicemail',
    'mailbox',
    'recording',
    'at the sound',
    'at the tone',
  ];

  const humanIndicators = [
    'hello',
    'hi',
    'hey',
    'speaking',
    'this is',
    'how can i help',
    'how are you',
    'good morning',
    'good afternoon',
  ];

  let voicemailScore = 0;
  let humanScore = 0;

  for (const indicator of voicemailIndicators) {
    if (text.includes(indicator)) voicemailScore++;
  }

  for (const indicator of humanIndicators) {
    if (text.includes(indicator)) humanScore++;
  }

  const isVoicemail = voicemailScore > humanScore;
  const confidence = isVoicemail
    ? Math.min(voicemailScore / (humanIndicators.length * 0.3), 1)
    : Math.min(humanScore / (humanIndicators.length * 0.3), 1);

  return {
    isVoicemail,
    confidence: Math.max(confidence, 0.5),
    reason: isVoicemail
      ? 'Detected voicemail greeting patterns'
      : 'Detected human conversation patterns',
  };
}

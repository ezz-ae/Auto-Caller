// Auto Caller Pro - Transcription Service (OpenAI Whisper)

import OpenAI from 'openai';
import { getSettings } from './store';
import { Transcript, TranscriptSegment } from './types';

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (openaiClient) return openaiClient;
  
  const settings = getSettings();
  
  if (!settings.openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  openaiClient = new OpenAI({
    apiKey: settings.openaiApiKey,
  });
  
  return openaiClient;
}

export function resetClient() {
  openaiClient = null;
}

/**
 * Transcribe audio using OpenAI Whisper
 * High-quality transcription with timestamps
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  options: {
    language?: string;
    prompt?: string;
  } = {}
): Promise<{
  text: string;
  segments: TranscriptSegment[];
  duration: number;
}> {
  const client = getClient();
  
  // Create a File object from buffer
  const file = new File([audioBuffer], 'recording.mp3', { type: 'audio/mpeg' });
  
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

/**
 * Analyze transcript with GPT-4 for insights
 */
export async function analyzeTranscript(
  transcript: string,
  context?: {
    script?: string;
    phoneNumber?: string;
    campaignName?: string;
  }
): Promise<{
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  actionItems: string[];
  outcome: string;
  followUp: string;
}> {
  const client = getClient();
  
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
    model: 'gpt-4o',
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

/**
 * Generate a full transcript with analysis
 */
export async function processRecording(
  audioBuffer: Buffer,
  context?: {
    script?: string;
    phoneNumber?: string;
    campaignName?: string;
  }
): Promise<Transcript> {
  // Transcribe
  const { text, segments, duration } = await transcribeAudio(audioBuffer);
  
  // Analyze
  const analysis = await analyzeTranscript(text, context);
  
  return {
    id: crypto.randomUUID(),
    recordingId: '',
    text,
    confidence: segments.reduce((acc, s) => acc + (s.confidence || 0.8), 0) / segments.length,
    segments,
    summary: analysis.summary,
    sentiment: analysis.sentiment,
    keywords: analysis.keywords,
    actionItems: analysis.actionItems,
    createdAt: new Date(),
  };
}

/**
 * Quick transcription without analysis (faster)
 */
export async function quickTranscribe(audioBuffer: Buffer): Promise<string> {
  const client = getClient();
  
  const file = new File([audioBuffer], 'recording.mp3', { type: 'audio/mpeg' });
  
  const response = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
  });
  
  return response.text;
}

/**
 * Detect if the call was answered by a human or voicemail
 */
export async function detectVoicemail(audioBuffer: Buffer): Promise<{
  isVoicemail: boolean;
  confidence: number;
  reason: string;
}> {
  const client = getClient();
  
  const file = new File([audioBuffer], 'recording.mp3', { type: 'audio/mpeg' });
  
  // Quick transcription
  const response = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
  });
  
  const text = response.text.toLowerCase();
  
  // Analyze for voicemail indicators
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

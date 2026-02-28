// Auto Caller Pro - Types (Enhanced with Recording & Transcription)

export interface CallConfig {
  id: string;
  userId: string;
  phoneNumber: string;
  twilioPhone: string;
  credits: number;
  createdAt: Date;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'stopped';
  voiceId: string;
  language?: string;
  callerIdentityId?: string;
  callerIdentityName?: string;
  callerPosition?: string;
  script: string;
  numbers: string[];
  currentIndex: number;
  results: CallResult[];
  createdAt: Date;
  completedAt?: Date;
  recordCalls?: boolean;
  transcribeCalls?: boolean;
}

export interface CallResult {
  id: string;
  campaignId: string;
  phoneNumber: string;
  status: 'pending' | 'calling' | 'connected' | 'forwarded' | 'no-answer' | 'failed' | 'voicemail';
  duration?: number;
  callSid?: string;
  error?: string;
  timestamp: Date;
}

export interface Recording {
  id: string;
  callSid: string;
  campaignId: string;
  phoneNumber: string;
  recordingSid: string;
  recordingUrl: string;
  duration: number;
  status: 'processing' | 'completed' | 'failed';
  transcript?: Transcript;
  createdAt: Date;
}

export interface Transcript {
  id: string;
  recordingId: string;
  text: string;
  confidence: number;
  segments?: TranscriptSegment[];
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  keywords?: string[];
  actionItems?: string[];
  createdAt: Date;
}

export interface TranscriptSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  speaker?: string;
  confidence?: number;
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: {
    accent?: string;
    gender?: string;
    description?: string;
  };
  preview_url?: string;
}

export interface UserSettings {
  elevenLabsApiKey?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  forwardToNumber?: string;
  recordCalls?: boolean;
  transcribeCalls?: boolean;
  openaiApiKey?: string;
  managedMode?: boolean;
  assignedPhoneNumber?: string;
  businessName?: string;
  industry?: string;
  companyDetails?: string;
  sayThisRules?: string;
  avoidThisRules?: string;
}

export interface CallerIdentity {
  id: string;
  name: string;
  position: string;
  language: string;
  voiceId: string;
  industry?: string;
  mentionAi: boolean;
  script: string;
  sayThisRules?: string;
  avoidThisRules?: string;
  totalCalls: number;
  connectedCalls: number;
  failedCalls: number;
  noAnswerCalls: number;
  campaignsLaunched: number;
  creditsUsed: number;
  lastCalledAt?: Date;
  createdAt: Date;
}

export interface CallStatus {
  campaignId: string;
  currentNumber: string;
  currentIndex: number;
  total: number;
  connected: number;
  forwarded: number;
  noAnswer: number;
  failed: number;
  status: 'idle' | 'calling' | 'completed' | 'paused';
}

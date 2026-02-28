import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { Campaign, CallResult, Recording, Transcript } from '@/lib/types';

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/auto-caller-data' : path.join(process.cwd(), 'data'));
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const CAMPAIGNS_DIR = path.join(DATA_DIR, 'campaigns');
const CREDITS_FILE = path.join(DATA_DIR, 'credits.json');
const RECORDINGS_DIR = path.join(DATA_DIR, 'recordings');
const TRANSCRIPTS_DIR = path.join(DATA_DIR, 'transcripts');

const STORE_DRIVER = (process.env.STORE_DRIVER || '').toLowerCase();
const usePostgresStore =
  STORE_DRIVER === 'postgres' ||
  (STORE_DRIVER !== 'filesystem' && (process.env.DATABASE_URL || '').startsWith('postgres'));

interface StoredSettings {
  elevenLabsApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  forwardToNumber: string;
  recordCalls: boolean;
  transcribeCalls: boolean;
  openaiApiKey: string;
  webSocketUrl: string;
  managedMode: boolean;
  assignedPhoneNumber: string;
  businessName: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CAMPAIGNS_DIR)) {
    fs.mkdirSync(CAMPAIGNS_DIR, { recursive: true });
  }
  if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  }
  if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
  }
}

function defaultSettings(): StoredSettings {
  const managedMode = process.env.MANAGED_MODE === 'true';

  return {
    elevenLabsApiKey: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    forwardToNumber: '',
    recordCalls: true,
    transcribeCalls: true,
    openaiApiKey: '',
    webSocketUrl: '',
    managedMode,
    assignedPhoneNumber: '',
    businessName: '',
  };
}

function withManagedOverrides(settings: StoredSettings): StoredSettings {
  if (!settings.managedMode) {
    return settings;
  }

  const managedSid = process.env.MANAGED_TWILIO_ACCOUNT_SID || '';
  const managedToken = process.env.MANAGED_TWILIO_AUTH_TOKEN || '';
  const managedOpenAI = process.env.MANAGED_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
  const managedElevenLabs = process.env.MANAGED_ELEVENLABS_API_KEY || '';
  const managedCallerId =
    settings.assignedPhoneNumber ||
    process.env.MANAGED_DEFAULT_NUMBER ||
    process.env.MANAGED_TWILIO_PHONE_NUMBER ||
    settings.twilioPhoneNumber;

  return {
    ...settings,
    twilioAccountSid: managedSid || settings.twilioAccountSid,
    twilioAuthToken: managedToken || settings.twilioAuthToken,
    openaiApiKey: managedOpenAI || settings.openaiApiKey,
    elevenLabsApiKey: managedElevenLabs || settings.elevenLabsApiKey,
    twilioPhoneNumber: managedCallerId,
  };
}

function toDate(value: string | Date | undefined | null): Date | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
}

function serializeCallResult(result: CallResult) {
  return {
    ...result,
    timestamp: toDate(result.timestamp)?.toISOString() || new Date().toISOString(),
  };
}

function deserializeCallResult(result: any): CallResult {
  return {
    ...(result as Omit<CallResult, 'timestamp'>),
    timestamp: new Date(result?.timestamp || new Date().toISOString()),
  };
}

function serializeTranscript(transcript: Transcript) {
  return {
    ...transcript,
    createdAt: toDate(transcript.createdAt)?.toISOString() || new Date().toISOString(),
  };
}

function deserializeTranscript(transcript: any): Transcript {
  return {
    ...(transcript as Omit<Transcript, 'createdAt'>),
    createdAt: new Date(transcript?.createdAt || new Date().toISOString()),
  };
}

function deserializeCampaign(row: {
  id: string;
  userId: string;
  name: string;
  status: string;
  voiceId: string;
  script: string;
  numbers: any;
  currentIndex: number;
  results: any;
  recordCalls: boolean | null;
  transcribeCalls: boolean | null;
  createdAt: Date;
  completedAt: Date | null;
}): Campaign {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    status: row.status as Campaign['status'],
    voiceId: row.voiceId,
    script: row.script,
    numbers: Array.isArray(row.numbers) ? (row.numbers as string[]) : [],
    currentIndex: row.currentIndex,
    results: Array.isArray(row.results) ? row.results.map(deserializeCallResult) : [],
    recordCalls: row.recordCalls ?? undefined,
    transcribeCalls: row.transcribeCalls ?? undefined,
    createdAt: row.createdAt,
    completedAt: row.completedAt || undefined,
  };
}

function deserializeRecording(row: {
  id: string;
  callSid: string;
  campaignId: string;
  phoneNumber: string;
  recordingSid: string;
  recordingUrl: string;
  duration: number;
  status: string;
  transcript: any;
  createdAt: Date;
}): Recording {
  return {
    id: row.id,
    callSid: row.callSid,
    campaignId: row.campaignId,
    phoneNumber: row.phoneNumber,
    recordingSid: row.recordingSid,
    recordingUrl: row.recordingUrl,
    duration: row.duration,
    status: row.status as Recording['status'],
    transcript: row.transcript ? deserializeTranscript(row.transcript) : undefined,
    createdAt: row.createdAt,
  };
}

function deserializeSettings(row: {
  elevenLabsApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  forwardToNumber: string;
  recordCalls: boolean;
  transcribeCalls: boolean;
  openaiApiKey: string;
  webSocketUrl: string;
  managedMode: boolean;
  assignedPhoneNumber: string;
  businessName: string;
}): StoredSettings {
  return {
    elevenLabsApiKey: row.elevenLabsApiKey,
    twilioAccountSid: row.twilioAccountSid,
    twilioAuthToken: row.twilioAuthToken,
    twilioPhoneNumber: row.twilioPhoneNumber,
    forwardToNumber: row.forwardToNumber,
    recordCalls: row.recordCalls,
    transcribeCalls: row.transcribeCalls,
    openaiApiKey: row.openaiApiKey,
    webSocketUrl: row.webSocketUrl,
    managedMode: row.managedMode,
    assignedPhoneNumber: row.assignedPhoneNumber,
    businessName: row.businessName,
  };
}

function fsGetSettings(): StoredSettings {
  ensureDataDir();
  const defaults = defaultSettings();

  if (!fs.existsSync(SETTINGS_FILE)) {
    return withManagedOverrides(defaults);
  }

  const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
  return withManagedOverrides({ ...defaults, ...JSON.parse(data) });
}

function fsSaveSettings(settings: Partial<StoredSettings>): void {
  ensureDataDir();
  const current = fsGetSettings();
  const updated = { ...current, ...settings };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2));
}

function fsAssignManagedNumber(): string {
  const settings = fsGetSettings();

  if (settings.assignedPhoneNumber) {
    return settings.assignedPhoneNumber;
  }

  const pool = (process.env.MANAGED_NUMBER_POOL || '')
    .split(',')
    .map(n => n.trim())
    .filter(Boolean);

  const fallbackNumber = process.env.MANAGED_DEFAULT_NUMBER || process.env.MANAGED_TWILIO_PHONE_NUMBER || '+12025550111';
  const assignedPhoneNumber = pool[0] || fallbackNumber;

  fsSaveSettings({
    assignedPhoneNumber,
    twilioPhoneNumber: assignedPhoneNumber,
  });

  return assignedPhoneNumber;
}

function fsGetCredits(): number {
  ensureDataDir();

  if (!fs.existsSync(CREDITS_FILE)) {
    fs.writeFileSync(CREDITS_FILE, JSON.stringify({ credits: 100 }));
    return 100;
  }

  const data = fs.readFileSync(CREDITS_FILE, 'utf-8');
  return JSON.parse(data).credits;
}

function fsUpdateCredits(delta: number): number {
  ensureDataDir();
  const current = fsGetCredits();
  const updated = Math.max(0, current + delta);
  fs.writeFileSync(CREDITS_FILE, JSON.stringify({ credits: updated }));
  return updated;
}

function fsSetCredits(credits: number): void {
  ensureDataDir();
  fs.writeFileSync(CREDITS_FILE, JSON.stringify({ credits }));
}

function fsSaveCampaign(campaign: Campaign): void {
  ensureDataDir();
  const filePath = path.join(CAMPAIGNS_DIR, `${campaign.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(campaign, null, 2));
}

function fsGetCampaign(id: string): Campaign | null {
  ensureDataDir();
  const filePath = path.join(CAMPAIGNS_DIR, `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function fsGetAllCampaigns(): Campaign[] {
  ensureDataDir();
  const files = fs.readdirSync(CAMPAIGNS_DIR).filter(f => f.endsWith('.json'));

  return files
    .map(file => {
      const data = fs.readFileSync(path.join(CAMPAIGNS_DIR, file), 'utf-8');
      return JSON.parse(data);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function fsUpdateCampaignResult(campaignId: string, result: CallResult): void {
  const campaign = fsGetCampaign(campaignId);
  if (!campaign) return;

  const existingIndex = campaign.results.findIndex(r => r.id === result.id);
  if (existingIndex >= 0) {
    campaign.results[existingIndex] = result;
  } else {
    campaign.results.push(result);
  }

  fsSaveCampaign(campaign);
}

function fsFindCampaignResultByCallSid(callSid: string): {
  campaign: Campaign;
  result: CallResult;
  resultIndex: number;
} | null {
  const campaigns = fsGetAllCampaigns();

  for (const campaign of campaigns) {
    const resultIndex = campaign.results.findIndex(r => r.callSid === callSid);
    if (resultIndex >= 0) {
      return {
        campaign,
        result: campaign.results[resultIndex],
        resultIndex,
      };
    }
  }

  return null;
}

function fsUpdateCampaignResultByCallSid(
  callSid: string,
  patch: Partial<CallResult>
): { updated: boolean; campaignId?: string; resultId?: string } {
  const match = fsFindCampaignResultByCallSid(callSid);

  if (!match) {
    return { updated: false };
  }

  const updatedResult: CallResult = {
    ...match.result,
    ...patch,
  };

  match.campaign.results[match.resultIndex] = updatedResult;
  fsSaveCampaign(match.campaign);

  return {
    updated: true,
    campaignId: match.campaign.id,
    resultId: updatedResult.id,
  };
}

function fsDeleteCampaign(id: string): void {
  ensureDataDir();
  const filePath = path.join(CAMPAIGNS_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function fsSaveRecording(recording: Recording): void {
  ensureDataDir();
  const filePath = path.join(RECORDINGS_DIR, `${recording.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(recording, null, 2));
}

function fsGetRecording(id: string): Recording | null {
  ensureDataDir();
  const filePath = path.join(RECORDINGS_DIR, `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function fsGetRecordingByCallSid(callSid: string): Recording | null {
  ensureDataDir();
  const files = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const data = fs.readFileSync(path.join(RECORDINGS_DIR, file), 'utf-8');
    const recording: Recording = JSON.parse(data);
    if (recording.callSid === callSid) {
      return recording;
    }
  }

  return null;
}

function fsGetAllRecordings(): Recording[] {
  ensureDataDir();
  const files = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.json'));

  return files
    .map(file => {
      const data = fs.readFileSync(path.join(RECORDINGS_DIR, file), 'utf-8');
      return JSON.parse(data);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function fsGetRecordingsByCampaign(campaignId: string): Recording[] {
  return fsGetAllRecordings().filter(r => r.campaignId === campaignId);
}

function fsUpdateRecordingTranscript(recordingId: string, transcript: Transcript): void {
  const recording = fsGetRecording(recordingId);
  if (!recording) return;

  recording.transcript = transcript;
  recording.status = 'completed';
  fsSaveRecording(recording);
}

function fsDeleteRecording(id: string): void {
  ensureDataDir();
  const filePath = path.join(RECORDINGS_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function fsSaveTranscript(transcript: Transcript): void {
  ensureDataDir();
  const filePath = path.join(TRANSCRIPTS_DIR, `${transcript.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(transcript, null, 2));
}

function fsGetTranscript(id: string): Transcript | null {
  ensureDataDir();
  const filePath = path.join(TRANSCRIPTS_DIR, `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function fsGetAllTranscripts(): Transcript[] {
  ensureDataDir();
  const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'));

  return files
    .map(file => {
      const data = fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf-8');
      return JSON.parse(data);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function dbGetSettings(): Promise<StoredSettings> {
  const defaults = defaultSettings();

  const row = await prisma.appSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      ...defaults,
    },
    update: {},
  });

  return withManagedOverrides({
    ...defaults,
    ...deserializeSettings(row),
  });
}

async function dbSaveSettings(settings: Partial<StoredSettings>): Promise<void> {
  const current = await dbGetSettings();
  const updated = { ...current, ...settings };

  await prisma.appSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      ...updated,
    },
    update: {
      elevenLabsApiKey: updated.elevenLabsApiKey,
      twilioAccountSid: updated.twilioAccountSid,
      twilioAuthToken: updated.twilioAuthToken,
      twilioPhoneNumber: updated.twilioPhoneNumber,
      forwardToNumber: updated.forwardToNumber,
      recordCalls: updated.recordCalls,
      transcribeCalls: updated.transcribeCalls,
      openaiApiKey: updated.openaiApiKey,
      webSocketUrl: updated.webSocketUrl,
      managedMode: updated.managedMode,
      assignedPhoneNumber: updated.assignedPhoneNumber,
      businessName: updated.businessName,
    },
  });
}

async function dbAssignManagedNumber(): Promise<string> {
  const settings = await dbGetSettings();

  if (settings.assignedPhoneNumber) {
    return settings.assignedPhoneNumber;
  }

  const pool = (process.env.MANAGED_NUMBER_POOL || '')
    .split(',')
    .map(n => n.trim())
    .filter(Boolean);

  const fallbackNumber = process.env.MANAGED_DEFAULT_NUMBER || process.env.MANAGED_TWILIO_PHONE_NUMBER || '+12025550111';
  const assignedPhoneNumber = pool[0] || fallbackNumber;

  await dbSaveSettings({
    assignedPhoneNumber,
    twilioPhoneNumber: assignedPhoneNumber,
  });

  return assignedPhoneNumber;
}

async function dbGetCredits(): Promise<number> {
  const row = await prisma.creditBalance.upsert({
    where: { id: 'default' },
    create: { id: 'default', credits: 100 },
    update: {},
  });

  return row.credits;
}

async function dbUpdateCredits(delta: number): Promise<number> {
  const current = await dbGetCredits();
  const updated = Math.max(0, current + delta);

  await prisma.creditBalance.upsert({
    where: { id: 'default' },
    create: { id: 'default', credits: updated },
    update: { credits: updated },
  });

  return updated;
}

async function dbSetCredits(credits: number): Promise<void> {
  await prisma.creditBalance.upsert({
    where: { id: 'default' },
    create: { id: 'default', credits },
    update: { credits },
  });
}

async function dbSaveCampaign(campaign: Campaign): Promise<void> {
  await prisma.campaignRecord.upsert({
    where: { id: campaign.id },
    create: {
      id: campaign.id,
      userId: campaign.userId,
      name: campaign.name,
      status: campaign.status,
      voiceId: campaign.voiceId,
      script: campaign.script,
      numbers: campaign.numbers,
      currentIndex: campaign.currentIndex,
      results: campaign.results.map(serializeCallResult),
      recordCalls: campaign.recordCalls,
      transcribeCalls: campaign.transcribeCalls,
      createdAt: toDate(campaign.createdAt) || new Date(),
      completedAt: toDate(campaign.completedAt) || null,
    },
    update: {
      userId: campaign.userId,
      name: campaign.name,
      status: campaign.status,
      voiceId: campaign.voiceId,
      script: campaign.script,
      numbers: campaign.numbers,
      currentIndex: campaign.currentIndex,
      results: campaign.results.map(serializeCallResult),
      recordCalls: campaign.recordCalls,
      transcribeCalls: campaign.transcribeCalls,
      createdAt: toDate(campaign.createdAt) || new Date(),
      completedAt: toDate(campaign.completedAt) || null,
    },
  });
}

async function dbGetCampaign(id: string): Promise<Campaign | null> {
  const row = await prisma.campaignRecord.findUnique({ where: { id } });
  if (!row) return null;
  return deserializeCampaign(row);
}

async function dbGetAllCampaigns(): Promise<Campaign[]> {
  const rows = await prisma.campaignRecord.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(deserializeCampaign);
}

async function dbUpdateCampaignResult(campaignId: string, result: CallResult): Promise<void> {
  const campaign = await dbGetCampaign(campaignId);
  if (!campaign) return;

  const existingIndex = campaign.results.findIndex(r => r.id === result.id);
  if (existingIndex >= 0) {
    campaign.results[existingIndex] = result;
  } else {
    campaign.results.push(result);
  }

  await dbSaveCampaign(campaign);
}

async function dbFindCampaignResultByCallSid(callSid: string): Promise<{
  campaign: Campaign;
  result: CallResult;
  resultIndex: number;
} | null> {
  const campaigns = await dbGetAllCampaigns();

  for (const campaign of campaigns) {
    const resultIndex = campaign.results.findIndex(r => r.callSid === callSid);
    if (resultIndex >= 0) {
      return {
        campaign,
        result: campaign.results[resultIndex],
        resultIndex,
      };
    }
  }

  return null;
}

async function dbUpdateCampaignResultByCallSid(
  callSid: string,
  patch: Partial<CallResult>
): Promise<{ updated: boolean; campaignId?: string; resultId?: string }> {
  const match = await dbFindCampaignResultByCallSid(callSid);

  if (!match) {
    return { updated: false };
  }

  const updatedResult: CallResult = {
    ...match.result,
    ...patch,
  };

  match.campaign.results[match.resultIndex] = updatedResult;
  await dbSaveCampaign(match.campaign);

  return {
    updated: true,
    campaignId: match.campaign.id,
    resultId: updatedResult.id,
  };
}

async function dbDeleteCampaign(id: string): Promise<void> {
  await prisma.campaignRecord.deleteMany({ where: { id } });
}

async function dbSaveRecording(recording: Recording): Promise<void> {
  await prisma.recordingRecord.upsert({
    where: { id: recording.id },
    create: {
      id: recording.id,
      callSid: recording.callSid,
      campaignId: recording.campaignId,
      phoneNumber: recording.phoneNumber,
      recordingSid: recording.recordingSid,
      recordingUrl: recording.recordingUrl,
      duration: recording.duration,
      status: recording.status,
      transcript: recording.transcript
        ? (serializeTranscript(recording.transcript) as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      createdAt: toDate(recording.createdAt) || new Date(),
    },
    update: {
      callSid: recording.callSid,
      campaignId: recording.campaignId,
      phoneNumber: recording.phoneNumber,
      recordingSid: recording.recordingSid,
      recordingUrl: recording.recordingUrl,
      duration: recording.duration,
      status: recording.status,
      transcript: recording.transcript
        ? (serializeTranscript(recording.transcript) as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      createdAt: toDate(recording.createdAt) || new Date(),
    },
  });
}

async function dbGetRecording(id: string): Promise<Recording | null> {
  const row = await prisma.recordingRecord.findUnique({ where: { id } });
  if (!row) return null;
  return deserializeRecording(row);
}

async function dbGetRecordingByCallSid(callSid: string): Promise<Recording | null> {
  const row = await prisma.recordingRecord.findUnique({ where: { callSid } });
  if (!row) return null;
  return deserializeRecording(row);
}

async function dbGetAllRecordings(): Promise<Recording[]> {
  const rows = await prisma.recordingRecord.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(deserializeRecording);
}

async function dbGetRecordingsByCampaign(campaignId: string): Promise<Recording[]> {
  const rows = await prisma.recordingRecord.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(deserializeRecording);
}

async function dbUpdateRecordingTranscript(recordingId: string, transcript: Transcript): Promise<void> {
  const recording = await dbGetRecording(recordingId);
  if (!recording) return;

  recording.transcript = transcript;
  recording.status = 'completed';
  await dbSaveRecording(recording);
  await dbSaveTranscript(transcript);
}

async function dbDeleteRecording(id: string): Promise<void> {
  await prisma.recordingRecord.deleteMany({ where: { id } });
}

async function dbSaveTranscript(transcript: Transcript): Promise<void> {
  await prisma.transcriptRecord.upsert({
    where: { id: transcript.id },
    create: {
      id: transcript.id,
      recordingId: transcript.recordingId,
      text: transcript.text,
      confidence: transcript.confidence,
      segments: (transcript.segments || []) as unknown as Prisma.InputJsonValue,
      summary: transcript.summary,
      sentiment: transcript.sentiment,
      keywords: (transcript.keywords || []) as unknown as Prisma.InputJsonValue,
      actionItems: (transcript.actionItems || []) as unknown as Prisma.InputJsonValue,
      createdAt: toDate(transcript.createdAt) || new Date(),
    },
    update: {
      recordingId: transcript.recordingId,
      text: transcript.text,
      confidence: transcript.confidence,
      segments: (transcript.segments || []) as unknown as Prisma.InputJsonValue,
      summary: transcript.summary,
      sentiment: transcript.sentiment,
      keywords: (transcript.keywords || []) as unknown as Prisma.InputJsonValue,
      actionItems: (transcript.actionItems || []) as unknown as Prisma.InputJsonValue,
      createdAt: toDate(transcript.createdAt) || new Date(),
    },
  });
}

async function dbGetTranscript(id: string): Promise<Transcript | null> {
  const row = await prisma.transcriptRecord.findUnique({ where: { id } });
  if (!row) return null;
  return {
    id: row.id,
    recordingId: row.recordingId,
    text: row.text,
    confidence: row.confidence,
    segments: Array.isArray(row.segments) ? (row.segments as unknown as Transcript['segments']) : [],
    summary: row.summary || undefined,
    sentiment: (row.sentiment as Transcript['sentiment']) || undefined,
    keywords: Array.isArray(row.keywords) ? (row.keywords as string[]) : [],
    actionItems: Array.isArray(row.actionItems) ? (row.actionItems as string[]) : [],
    createdAt: row.createdAt,
  };
}

async function dbGetAllTranscripts(): Promise<Transcript[]> {
  const rows = await prisma.transcriptRecord.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(row => ({
    id: row.id,
    recordingId: row.recordingId,
    text: row.text,
    confidence: row.confidence,
    segments: Array.isArray(row.segments) ? (row.segments as unknown as Transcript['segments']) : [],
    summary: row.summary || undefined,
    sentiment: (row.sentiment as Transcript['sentiment']) || undefined,
    keywords: Array.isArray(row.keywords) ? (row.keywords as string[]) : [],
    actionItems: Array.isArray(row.actionItems) ? (row.actionItems as string[]) : [],
    createdAt: row.createdAt,
  }));
}

export async function getSettings(): Promise<StoredSettings> {
  return usePostgresStore ? dbGetSettings() : fsGetSettings();
}

export async function saveSettings(settings: Partial<StoredSettings>): Promise<void> {
  if (usePostgresStore) {
    await dbSaveSettings(settings);
    return;
  }

  fsSaveSettings(settings);
}

export async function assignManagedNumber(): Promise<string> {
  return usePostgresStore ? dbAssignManagedNumber() : fsAssignManagedNumber();
}

export async function getCredits(): Promise<number> {
  return usePostgresStore ? dbGetCredits() : fsGetCredits();
}

export async function updateCredits(delta: number): Promise<number> {
  return usePostgresStore ? dbUpdateCredits(delta) : fsUpdateCredits(delta);
}

export async function setCredits(credits: number): Promise<void> {
  if (usePostgresStore) {
    await dbSetCredits(credits);
    return;
  }

  fsSetCredits(credits);
}

export async function saveCampaign(campaign: Campaign): Promise<void> {
  if (usePostgresStore) {
    await dbSaveCampaign(campaign);
    return;
  }

  fsSaveCampaign(campaign);
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  return usePostgresStore ? dbGetCampaign(id) : fsGetCampaign(id);
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  return usePostgresStore ? dbGetAllCampaigns() : fsGetAllCampaigns();
}

export async function updateCampaignResult(campaignId: string, result: CallResult): Promise<void> {
  if (usePostgresStore) {
    await dbUpdateCampaignResult(campaignId, result);
    return;
  }

  fsUpdateCampaignResult(campaignId, result);
}

export async function findCampaignResultByCallSid(callSid: string): Promise<{
  campaign: Campaign;
  result: CallResult;
  resultIndex: number;
} | null> {
  return usePostgresStore ? dbFindCampaignResultByCallSid(callSid) : fsFindCampaignResultByCallSid(callSid);
}

export async function updateCampaignResultByCallSid(
  callSid: string,
  patch: Partial<CallResult>
): Promise<{ updated: boolean; campaignId?: string; resultId?: string }> {
  return usePostgresStore
    ? dbUpdateCampaignResultByCallSid(callSid, patch)
    : fsUpdateCampaignResultByCallSid(callSid, patch);
}

export async function deleteCampaign(id: string): Promise<void> {
  if (usePostgresStore) {
    await dbDeleteCampaign(id);
    return;
  }

  fsDeleteCampaign(id);
}

export async function saveRecording(recording: Recording): Promise<void> {
  if (usePostgresStore) {
    await dbSaveRecording(recording);
    return;
  }

  fsSaveRecording(recording);
}

export async function getRecording(id: string): Promise<Recording | null> {
  return usePostgresStore ? dbGetRecording(id) : fsGetRecording(id);
}

export async function getRecordingByCallSid(callSid: string): Promise<Recording | null> {
  return usePostgresStore ? dbGetRecordingByCallSid(callSid) : fsGetRecordingByCallSid(callSid);
}

export async function getAllRecordings(): Promise<Recording[]> {
  return usePostgresStore ? dbGetAllRecordings() : fsGetAllRecordings();
}

export async function getRecordingsByCampaign(campaignId: string): Promise<Recording[]> {
  return usePostgresStore ? dbGetRecordingsByCampaign(campaignId) : fsGetRecordingsByCampaign(campaignId);
}

export async function updateRecordingTranscript(recordingId: string, transcript: Transcript): Promise<void> {
  if (usePostgresStore) {
    await dbUpdateRecordingTranscript(recordingId, transcript);
    return;
  }

  fsUpdateRecordingTranscript(recordingId, transcript);
}

export async function deleteRecording(id: string): Promise<void> {
  if (usePostgresStore) {
    await dbDeleteRecording(id);
    return;
  }

  fsDeleteRecording(id);
}

export async function saveTranscript(transcript: Transcript): Promise<void> {
  if (usePostgresStore) {
    await dbSaveTranscript(transcript);
    return;
  }

  fsSaveTranscript(transcript);
}

export async function getTranscript(id: string): Promise<Transcript | null> {
  return usePostgresStore ? dbGetTranscript(id) : fsGetTranscript(id);
}

export async function getAllTranscripts(): Promise<Transcript[]> {
  return usePostgresStore ? dbGetAllTranscripts() : fsGetAllTranscripts();
}

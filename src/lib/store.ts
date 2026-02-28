import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { tryProvisionManagedNumber } from './managed-number';
import { Campaign, CallResult, Recording, Transcript } from '@/lib/types';

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/auto-caller-data' : path.join(process.cwd(), 'data'));
const CAMPAIGNS_DIR = path.join(DATA_DIR, 'campaigns');
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
  industry: string;
  companyDetails: string;
  sayThisRules: string;
  avoidThisRules: string;
}

function normalizeUserId(userId?: string): string {
  return String(userId || '').trim() || 'default';
}

function getSettingsFile(userId: string): string {
  return path.join(DATA_DIR, `settings.${normalizeUserId(userId)}.json`);
}

function getCreditsFile(userId: string): string {
  return path.join(DATA_DIR, `credits.${normalizeUserId(userId)}.json`);
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
    industry: '',
    companyDetails: '',
    sayThisRules: '',
    avoidThisRules: '',
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
    followUpAt: toDate(result.followUpAt)?.toISOString() || undefined,
  };
}

function deserializeCallResult(result: any): CallResult {
  return {
    ...(result as Omit<CallResult, 'timestamp'>),
    timestamp: new Date(result?.timestamp || new Date().toISOString()),
    followUpAt: toDate(result?.followUpAt),
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
  language: string | null;
  callerIdentityId: string | null;
  callerIdentityName: string | null;
  callerPosition: string | null;
  script: string;
  numbers: any;
  currentIndex: number;
  results: any;
  recordCalls: boolean | null;
  transcribeCalls: boolean | null;
  createdAt: Date;
  scheduledAt: Date | null;
  completedAt: Date | null;
}): Campaign {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    status: row.status as Campaign['status'],
    voiceId: row.voiceId,
    language: row.language || undefined,
    callerIdentityId: row.callerIdentityId || undefined,
    callerIdentityName: row.callerIdentityName || undefined,
    callerPosition: row.callerPosition || undefined,
    script: row.script,
    numbers: Array.isArray(row.numbers) ? (row.numbers as string[]) : [],
    currentIndex: row.currentIndex,
    results: Array.isArray(row.results) ? row.results.map(deserializeCallResult) : [],
    recordCalls: row.recordCalls ?? undefined,
    transcribeCalls: row.transcribeCalls ?? undefined,
    createdAt: row.createdAt,
    scheduledAt: row.scheduledAt || undefined,
    completedAt: row.completedAt || undefined,
  };
}

function deserializeRecording(row: {
  id: string;
  userId: string;
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
    userId: row.userId,
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
  industry: string;
  companyDetails: string;
  sayThisRules: string;
  avoidThisRules: string;
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
    industry: row.industry,
    companyDetails: row.companyDetails,
    sayThisRules: row.sayThisRules,
    avoidThisRules: row.avoidThisRules,
  };
}

function fsGetSettings(userId = 'default'): StoredSettings {
  ensureDataDir();
  const defaults = defaultSettings();
  const settingsFile = getSettingsFile(userId);

  if (!fs.existsSync(settingsFile)) {
    return withManagedOverrides(defaults);
  }

  const data = fs.readFileSync(settingsFile, 'utf-8');
  return withManagedOverrides({ ...defaults, ...JSON.parse(data) });
}

function fsSaveSettings(settings: Partial<StoredSettings>, userId = 'default'): void {
  ensureDataDir();
  const current = fsGetSettings(userId);
  const updated = { ...current, ...settings };
  fs.writeFileSync(getSettingsFile(userId), JSON.stringify(updated, null, 2));
}

async function fsAssignManagedNumber(userId = 'default'): Promise<string> {
  const settings = fsGetSettings(userId);

  if (settings.assignedPhoneNumber) {
    return settings.assignedPhoneNumber;
  }

  const fallbackAssign = () => {
    const pool = (process.env.MANAGED_NUMBER_POOL || '')
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);

    const fallbackNumber = process.env.MANAGED_DEFAULT_NUMBER || process.env.MANAGED_TWILIO_PHONE_NUMBER || '+12025550111';
    const assignedPhoneNumber = pool[0] || fallbackNumber;

    fsSaveSettings({
      assignedPhoneNumber,
      twilioPhoneNumber: assignedPhoneNumber,
    }, userId);

    return assignedPhoneNumber;
  };

  const provisionedNumber = await tryProvisionManagedNumber();
  if (provisionedNumber) {
    fsSaveSettings({
      assignedPhoneNumber: provisionedNumber,
      twilioPhoneNumber: provisionedNumber,
    }, userId);
    return provisionedNumber;
  }

  return fallbackAssign();
}

async function dbAssignManagedNumber(userId = 'default'): Promise<string> {
  const settings = await dbGetSettings(userId);

  if (settings.assignedPhoneNumber) {
    return settings.assignedPhoneNumber;
  }

  const provisionedNumber = await tryProvisionManagedNumber();
  if (provisionedNumber) {
    await dbSaveSettings({
      assignedPhoneNumber: provisionedNumber,
      twilioPhoneNumber: provisionedNumber,
    }, userId);
    return provisionedNumber;
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
  }, userId);

  return assignedPhoneNumber;
}

function fsGetCredits(userId = 'default'): number {
  ensureDataDir();
  const creditsFile = getCreditsFile(userId);

  if (!fs.existsSync(creditsFile)) {
    fs.writeFileSync(creditsFile, JSON.stringify({ credits: 100 }));
    return 100;
  }

  const data = fs.readFileSync(creditsFile, 'utf-8');
  return JSON.parse(data).credits;
}

function fsUpdateCredits(delta: number, userId = 'default'): number {
  ensureDataDir();
  const current = fsGetCredits(userId);
  const updated = Math.max(0, current + delta);
  fs.writeFileSync(getCreditsFile(userId), JSON.stringify({ credits: updated }));
  return updated;
}

function fsSetCredits(credits: number, userId = 'default'): void {
  ensureDataDir();
  fs.writeFileSync(getCreditsFile(userId), JSON.stringify({ credits }));
}

function fsSaveCampaign(campaign: Campaign): void {
  ensureDataDir();
  const filePath = path.join(CAMPAIGNS_DIR, `${campaign.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(campaign, null, 2));
}

function fsGetCampaign(id: string, userId?: string): Campaign | null {
  ensureDataDir();
  const filePath = path.join(CAMPAIGNS_DIR, `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  const campaign = JSON.parse(data) as Campaign;
  if (userId && normalizeUserId(campaign.userId) !== normalizeUserId(userId)) {
    return null;
  }
  return campaign;
}

function fsGetAllCampaigns(userId?: string): Campaign[] {
  ensureDataDir();
  const files = fs.readdirSync(CAMPAIGNS_DIR).filter(f => f.endsWith('.json'));

  return files
    .map(file => {
      const data = fs.readFileSync(path.join(CAMPAIGNS_DIR, file), 'utf-8');
      return JSON.parse(data) as Campaign;
    })
    .filter(campaign => !userId || normalizeUserId(campaign.userId) === normalizeUserId(userId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function fsUpdateCampaignResult(campaignId: string, result: CallResult, userId?: string): void {
  const campaign = fsGetCampaign(campaignId, userId);
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

function fsDeleteCampaign(id: string, userId?: string): void {
  const campaign = fsGetCampaign(id, userId);
  if (!campaign) return;

  ensureDataDir();
  const filePath = path.join(CAMPAIGNS_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function fsSaveRecording(recording: Recording): void {
  ensureDataDir();
  const filePath = path.join(RECORDINGS_DIR, `${recording.id}.json`);
  const withUser = {
    ...recording,
    userId: normalizeUserId(recording.userId),
  };
  fs.writeFileSync(filePath, JSON.stringify(withUser, null, 2));
}

function fsGetRecording(id: string, userId?: string): Recording | null {
  ensureDataDir();
  const filePath = path.join(RECORDINGS_DIR, `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  const recording = JSON.parse(data) as Recording;
  const recordingUserId = normalizeUserId(recording.userId);
  if (userId && recordingUserId !== normalizeUserId(userId)) return null;
  return { ...recording, userId: recordingUserId };
}

function fsGetRecordingByCallSid(callSid: string, userId?: string): Recording | null {
  ensureDataDir();
  const files = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const data = fs.readFileSync(path.join(RECORDINGS_DIR, file), 'utf-8');
    const recording: Recording = JSON.parse(data);
    const recordingUserId = normalizeUserId(recording.userId);
    if (recording.callSid === callSid) {
      if (userId && recordingUserId !== normalizeUserId(userId)) continue;
      return { ...recording, userId: recordingUserId };
    }
  }

  return null;
}

function fsGetAllRecordings(userId?: string): Recording[] {
  ensureDataDir();
  const files = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.json'));

  return files
    .map(file => {
      const data = fs.readFileSync(path.join(RECORDINGS_DIR, file), 'utf-8');
      const recording = JSON.parse(data) as Recording;
      return {
        ...recording,
        userId: normalizeUserId(recording.userId),
      };
    })
    .filter(recording => !userId || normalizeUserId(recording.userId) === normalizeUserId(userId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function fsGetRecordingsByCampaign(campaignId: string, userId?: string): Recording[] {
  return fsGetAllRecordings(userId).filter(r => r.campaignId === campaignId);
}

function fsUpdateRecordingTranscript(recordingId: string, transcript: Transcript, userId?: string): void {
  const recording = fsGetRecording(recordingId, userId);
  if (!recording) return;

  recording.transcript = { ...transcript, userId: normalizeUserId(recording.userId) };
  recording.status = 'completed';
  fsSaveRecording(recording);
}

function fsDeleteRecording(id: string, userId?: string): void {
  const recording = fsGetRecording(id, userId);
  if (!recording) return;

  ensureDataDir();
  const filePath = path.join(RECORDINGS_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function fsSaveTranscript(transcript: Transcript): void {
  ensureDataDir();
  const filePath = path.join(TRANSCRIPTS_DIR, `${transcript.id}.json`);
  const withUser = {
    ...transcript,
    userId: normalizeUserId(transcript.userId),
  };
  fs.writeFileSync(filePath, JSON.stringify(withUser, null, 2));
}

function fsGetTranscript(id: string, userId?: string): Transcript | null {
  ensureDataDir();
  const filePath = path.join(TRANSCRIPTS_DIR, `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  const transcript = JSON.parse(data) as Transcript;
  const transcriptUserId = normalizeUserId(transcript.userId);
  if (userId && transcriptUserId !== normalizeUserId(userId)) return null;
  return { ...transcript, userId: transcriptUserId };
}

function fsGetAllTranscripts(userId?: string): Transcript[] {
  ensureDataDir();
  const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'));

  return files
    .map(file => {
      const data = fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf-8');
      const transcript = JSON.parse(data) as Transcript;
      return {
        ...transcript,
        userId: normalizeUserId(transcript.userId),
      };
    })
    .filter(transcript => !userId || normalizeUserId(transcript.userId) === normalizeUserId(userId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function dbGetSettings(userId = 'default'): Promise<StoredSettings> {
  const defaults = defaultSettings();
  const scopedUserId = normalizeUserId(userId);

  const row = await prisma.appSettings.upsert({
    where: { id: scopedUserId },
    create: {
      id: scopedUserId,
      ...defaults,
    },
    update: {},
  });

  return withManagedOverrides({
    ...defaults,
    ...deserializeSettings(row),
  });
}

async function dbSaveSettings(settings: Partial<StoredSettings>, userId = 'default'): Promise<void> {
  const scopedUserId = normalizeUserId(userId);
  const current = await dbGetSettings(scopedUserId);
  const updated = { ...current, ...settings };

  await prisma.appSettings.upsert({
    where: { id: scopedUserId },
    create: {
      id: scopedUserId,
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
      industry: updated.industry,
      companyDetails: updated.companyDetails,
      sayThisRules: updated.sayThisRules,
      avoidThisRules: updated.avoidThisRules,
    },
  });
}

async function dbGetCredits(userId = 'default'): Promise<number> {
  const scopedUserId = normalizeUserId(userId);
  const row = await prisma.creditBalance.upsert({
    where: { id: scopedUserId },
    create: { id: scopedUserId, credits: 100 },
    update: {},
  });

  return row.credits;
}

async function dbUpdateCredits(delta: number, userId = 'default'): Promise<number> {
  const scopedUserId = normalizeUserId(userId);
  const current = await dbGetCredits(scopedUserId);
  const updated = Math.max(0, current + delta);

  await prisma.creditBalance.upsert({
    where: { id: scopedUserId },
    create: { id: scopedUserId, credits: updated },
    update: { credits: updated },
  });

  return updated;
}

async function dbSetCredits(credits: number, userId = 'default'): Promise<void> {
  const scopedUserId = normalizeUserId(userId);
  await prisma.creditBalance.upsert({
    where: { id: scopedUserId },
    create: { id: scopedUserId, credits },
    update: { credits },
  });
}

async function dbSaveCampaign(campaign: Campaign): Promise<void> {
  const scopedUserId = normalizeUserId(campaign.userId);
  await prisma.campaignRecord.upsert({
    where: { id: campaign.id },
    create: {
      id: campaign.id,
      userId: scopedUserId,
      name: campaign.name,
      status: campaign.status,
      voiceId: campaign.voiceId,
      language: campaign.language || null,
      callerIdentityId: campaign.callerIdentityId || null,
      callerIdentityName: campaign.callerIdentityName || null,
      callerPosition: campaign.callerPosition || null,
      script: campaign.script,
      numbers: campaign.numbers,
      currentIndex: campaign.currentIndex,
      results: campaign.results.map(serializeCallResult),
      recordCalls: campaign.recordCalls,
      transcribeCalls: campaign.transcribeCalls,
      createdAt: toDate(campaign.createdAt) || new Date(),
      scheduledAt: toDate(campaign.scheduledAt) || null,
      completedAt: toDate(campaign.completedAt) || null,
    },
    update: {
      userId: scopedUserId,
      name: campaign.name,
      status: campaign.status,
      voiceId: campaign.voiceId,
      language: campaign.language || null,
      callerIdentityId: campaign.callerIdentityId || null,
      callerIdentityName: campaign.callerIdentityName || null,
      callerPosition: campaign.callerPosition || null,
      script: campaign.script,
      numbers: campaign.numbers,
      currentIndex: campaign.currentIndex,
      results: campaign.results.map(serializeCallResult),
      recordCalls: campaign.recordCalls,
      transcribeCalls: campaign.transcribeCalls,
      createdAt: toDate(campaign.createdAt) || new Date(),
      scheduledAt: toDate(campaign.scheduledAt) || null,
      completedAt: toDate(campaign.completedAt) || null,
    },
  });
}

async function dbGetCampaign(id: string, userId?: string): Promise<Campaign | null> {
  const row = await prisma.campaignRecord.findUnique({ where: { id } });
  if (!row) return null;
  if (userId && normalizeUserId(row.userId) !== normalizeUserId(userId)) return null;
  return deserializeCampaign(row);
}

async function dbGetAllCampaigns(userId?: string): Promise<Campaign[]> {
  const rows = await prisma.campaignRecord.findMany({
    where: userId ? { userId: normalizeUserId(userId) } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(deserializeCampaign);
}

async function dbUpdateCampaignResult(campaignId: string, result: CallResult, userId?: string): Promise<void> {
  const campaign = await dbGetCampaign(campaignId, userId);
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

async function dbDeleteCampaign(id: string, userId?: string): Promise<void> {
  await prisma.campaignRecord.deleteMany({
    where: {
      id,
      ...(userId ? { userId: normalizeUserId(userId) } : {}),
    },
  });
}

async function dbSaveRecording(recording: Recording): Promise<void> {
  const scopedUserId = normalizeUserId(recording.userId);
  await prisma.recordingRecord.upsert({
    where: { id: recording.id },
    create: {
      id: recording.id,
      userId: scopedUserId,
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
      userId: scopedUserId,
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

async function dbGetRecording(id: string, userId?: string): Promise<Recording | null> {
  const row = await prisma.recordingRecord.findUnique({ where: { id } });
  if (!row) return null;
  if (userId && normalizeUserId(row.userId) !== normalizeUserId(userId)) return null;
  return deserializeRecording(row);
}

async function dbGetRecordingByCallSid(callSid: string, userId?: string): Promise<Recording | null> {
  const row = await prisma.recordingRecord.findUnique({ where: { callSid } });
  if (!row) return null;
  if (userId && normalizeUserId(row.userId) !== normalizeUserId(userId)) return null;
  return deserializeRecording(row);
}

async function dbGetAllRecordings(userId?: string): Promise<Recording[]> {
  const rows = await prisma.recordingRecord.findMany({
    where: userId ? { userId: normalizeUserId(userId) } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(deserializeRecording);
}

async function dbGetRecordingsByCampaign(campaignId: string, userId?: string): Promise<Recording[]> {
  const rows = await prisma.recordingRecord.findMany({
    where: {
      campaignId,
      ...(userId ? { userId: normalizeUserId(userId) } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(deserializeRecording);
}

async function dbUpdateRecordingTranscript(recordingId: string, transcript: Transcript, userId?: string): Promise<void> {
  const recording = await dbGetRecording(recordingId, userId);
  if (!recording) return;

  recording.transcript = { ...transcript, userId: recording.userId };
  recording.status = 'completed';
  await dbSaveRecording(recording);
  await dbSaveTranscript({ ...transcript, userId: recording.userId });
}

async function dbDeleteRecording(id: string, userId?: string): Promise<void> {
  await prisma.recordingRecord.deleteMany({
    where: {
      id,
      ...(userId ? { userId: normalizeUserId(userId) } : {}),
    },
  });
}

async function dbSaveTranscript(transcript: Transcript): Promise<void> {
  const scopedUserId = normalizeUserId(transcript.userId);
  await prisma.transcriptRecord.upsert({
    where: { id: transcript.id },
    create: {
      id: transcript.id,
      userId: scopedUserId,
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
      userId: scopedUserId,
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

async function dbGetTranscript(id: string, userId?: string): Promise<Transcript | null> {
  const row = await prisma.transcriptRecord.findUnique({ where: { id } });
  if (!row) return null;
  if (userId && normalizeUserId(row.userId) !== normalizeUserId(userId)) return null;
  return {
    id: row.id,
    userId: row.userId,
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

async function dbGetAllTranscripts(userId?: string): Promise<Transcript[]> {
  const rows = await prisma.transcriptRecord.findMany({
    where: userId ? { userId: normalizeUserId(userId) } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(row => ({
    id: row.id,
    userId: row.userId,
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

export async function getSettings(userId = 'default'): Promise<StoredSettings> {
  return usePostgresStore ? dbGetSettings(userId) : fsGetSettings(userId);
}

export async function saveSettings(settings: Partial<StoredSettings>, userId = 'default'): Promise<void> {
  if (usePostgresStore) {
    await dbSaveSettings(settings, userId);
    return;
  }

  fsSaveSettings(settings, userId);
}

export async function assignManagedNumber(userId = 'default'): Promise<string> {
  return usePostgresStore ? dbAssignManagedNumber(userId) : await fsAssignManagedNumber(userId);
}

export async function getCredits(userId = 'default'): Promise<number> {
  return usePostgresStore ? dbGetCredits(userId) : fsGetCredits(userId);
}

export async function updateCredits(delta: number, userId = 'default'): Promise<number> {
  return usePostgresStore ? dbUpdateCredits(delta, userId) : fsUpdateCredits(delta, userId);
}

export async function setCredits(credits: number, userId = 'default'): Promise<void> {
  if (usePostgresStore) {
    await dbSetCredits(credits, userId);
    return;
  }

  fsSetCredits(credits, userId);
}

export async function saveCampaign(campaign: Campaign): Promise<void> {
  if (usePostgresStore) {
    await dbSaveCampaign(campaign);
    return;
  }

  fsSaveCampaign(campaign);
}

export async function getCampaign(id: string, userId?: string): Promise<Campaign | null> {
  return usePostgresStore ? dbGetCampaign(id, userId) : fsGetCampaign(id, userId);
}

export async function getAllCampaigns(userId?: string): Promise<Campaign[]> {
  return usePostgresStore ? dbGetAllCampaigns(userId) : fsGetAllCampaigns(userId);
}

export async function updateCampaignResult(campaignId: string, result: CallResult, userId?: string): Promise<void> {
  if (usePostgresStore) {
    await dbUpdateCampaignResult(campaignId, result, userId);
    return;
  }

  fsUpdateCampaignResult(campaignId, result, userId);
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

export async function deleteCampaign(id: string, userId?: string): Promise<void> {
  if (usePostgresStore) {
    await dbDeleteCampaign(id, userId);
    return;
  }

  fsDeleteCampaign(id, userId);
}

export async function saveRecording(recording: Recording): Promise<void> {
  if (usePostgresStore) {
    await dbSaveRecording(recording);
    return;
  }

  fsSaveRecording(recording);
}

export async function getRecording(id: string, userId?: string): Promise<Recording | null> {
  return usePostgresStore ? dbGetRecording(id, userId) : fsGetRecording(id, userId);
}

export async function getRecordingByCallSid(callSid: string, userId?: string): Promise<Recording | null> {
  return usePostgresStore ? dbGetRecordingByCallSid(callSid, userId) : fsGetRecordingByCallSid(callSid, userId);
}

export async function getAllRecordings(userId?: string): Promise<Recording[]> {
  return usePostgresStore ? dbGetAllRecordings(userId) : fsGetAllRecordings(userId);
}

export async function getRecordingsByCampaign(campaignId: string, userId?: string): Promise<Recording[]> {
  return usePostgresStore ? dbGetRecordingsByCampaign(campaignId, userId) : fsGetRecordingsByCampaign(campaignId, userId);
}

export async function updateRecordingTranscript(recordingId: string, transcript: Transcript, userId?: string): Promise<void> {
  if (usePostgresStore) {
    await dbUpdateRecordingTranscript(recordingId, transcript, userId);
    return;
  }

  fsUpdateRecordingTranscript(recordingId, transcript, userId);
}

export async function deleteRecording(id: string, userId?: string): Promise<void> {
  if (usePostgresStore) {
    await dbDeleteRecording(id, userId);
    return;
  }

  fsDeleteRecording(id, userId);
}

export async function saveTranscript(transcript: Transcript): Promise<void> {
  if (usePostgresStore) {
    await dbSaveTranscript(transcript);
    return;
  }

  fsSaveTranscript(transcript);
}

export async function getTranscript(id: string, userId?: string): Promise<Transcript | null> {
  return usePostgresStore ? dbGetTranscript(id, userId) : fsGetTranscript(id, userId);
}

export async function getAllTranscripts(userId?: string): Promise<Transcript[]> {
  return usePostgresStore ? dbGetAllTranscripts(userId) : fsGetAllTranscripts(userId);
}

// Auto Caller Pro - Settings Store (Enhanced with Recording Support)

import fs from 'fs';
import path from 'path';
import { Campaign, CallResult, Recording, Transcript } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const CAMPAIGNS_DIR = path.join(DATA_DIR, 'campaigns');
const CREDITS_FILE = path.join(DATA_DIR, 'credits.json');
const RECORDINGS_DIR = path.join(DATA_DIR, 'recordings');
const TRANSCRIPTS_DIR = path.join(DATA_DIR, 'transcripts');

// Ensure directories exist
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

// Settings
export function getSettings(): {
  elevenLabsApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  forwardToNumber: string;
  recordCalls: boolean;
  transcribeCalls: boolean;
  openaiApiKey: string;
  webSocketUrl: string;
} {
  ensureDataDir();
  
  if (!fs.existsSync(SETTINGS_FILE)) {
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
    };
  }
  
  const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
  return JSON.parse(data);
}

export function saveSettings(settings: Partial<{
  elevenLabsApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  forwardToNumber: string;
  recordCalls: boolean;
  transcribeCalls: boolean;
  openaiApiKey: string;
  webSocketUrl: string;
}>): void {
  ensureDataDir();
  
  const current = getSettings();
  const updated = { ...current, ...settings };
  
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2));
}

// Credits
export function getCredits(): number {
  ensureDataDir();
  
  if (!fs.existsSync(CREDITS_FILE)) {
    fs.writeFileSync(CREDITS_FILE, JSON.stringify({ credits: 100 }));
    return 100;
  }
  
  const data = fs.readFileSync(CREDITS_FILE, 'utf-8');
  return JSON.parse(data).credits;
}

export function updateCredits(delta: number): number {
  ensureDataDir();
  
  const current = getCredits();
  const updated = Math.max(0, current + delta);
  
  fs.writeFileSync(CREDITS_FILE, JSON.stringify({ credits: updated }));
  return updated;
}

export function setCredits(credits: number): void {
  ensureDataDir();
  fs.writeFileSync(CREDITS_FILE, JSON.stringify({ credits }));
}

// Campaigns
export function saveCampaign(campaign: Campaign): void {
  ensureDataDir();
  
  const filePath = path.join(CAMPAIGNS_DIR, `${campaign.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(campaign, null, 2));
}

export function getCampaign(id: string): Campaign | null {
  ensureDataDir();
  
  const filePath = path.join(CAMPAIGNS_DIR, `${id}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

export function getAllCampaigns(): Campaign[] {
  ensureDataDir();
  
  const files = fs.readdirSync(CAMPAIGNS_DIR).filter(f => f.endsWith('.json'));
  
  return files.map(file => {
    const data = fs.readFileSync(path.join(CAMPAIGNS_DIR, file), 'utf-8');
    return JSON.parse(data);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateCampaignResult(campaignId: string, result: CallResult): void {
  const campaign = getCampaign(campaignId);
  if (!campaign) return;
  
  const existingIndex = campaign.results.findIndex(r => r.id === result.id);
  if (existingIndex >= 0) {
    campaign.results[existingIndex] = result;
  } else {
    campaign.results.push(result);
  }
  
  saveCampaign(campaign);
}

export function findCampaignResultByCallSid(callSid: string): {
  campaign: Campaign;
  result: CallResult;
  resultIndex: number;
} | null {
  const campaigns = getAllCampaigns();

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

export function updateCampaignResultByCallSid(
  callSid: string,
  patch: Partial<CallResult>
): { updated: boolean; campaignId?: string; resultId?: string } {
  const match = findCampaignResultByCallSid(callSid);

  if (!match) {
    return { updated: false };
  }

  const updatedResult: CallResult = {
    ...match.result,
    ...patch,
  };

  match.campaign.results[match.resultIndex] = updatedResult;
  saveCampaign(match.campaign);

  return {
    updated: true,
    campaignId: match.campaign.id,
    resultId: updatedResult.id,
  };
}

export function deleteCampaign(id: string): void {
  ensureDataDir();
  
  const filePath = path.join(CAMPAIGNS_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// Recordings
export function saveRecording(recording: Recording): void {
  ensureDataDir();
  
  const filePath = path.join(RECORDINGS_DIR, `${recording.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(recording, null, 2));
}

export function getRecording(id: string): Recording | null {
  ensureDataDir();
  
  const filePath = path.join(RECORDINGS_DIR, `${id}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

export function getRecordingByCallSid(callSid: string): Recording | null {
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

export function getAllRecordings(): Recording[] {
  ensureDataDir();
  
  const files = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.json'));
  
  return files.map(file => {
    const data = fs.readFileSync(path.join(RECORDINGS_DIR, file), 'utf-8');
    return JSON.parse(data);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getRecordingsByCampaign(campaignId: string): Recording[] {
  ensureDataDir();
  
  const files = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.json'));
  
  return files.map(file => {
    const data = fs.readFileSync(path.join(RECORDINGS_DIR, file), 'utf-8');
    return JSON.parse(data);
  }).filter(r => r.campaignId === campaignId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateRecordingTranscript(recordingId: string, transcript: Transcript): void {
  const recording = getRecording(recordingId);
  if (!recording) return;
  
  recording.transcript = transcript;
  recording.status = 'completed';
  saveRecording(recording);
}

export function deleteRecording(id: string): void {
  ensureDataDir();
  
  const filePath = path.join(RECORDINGS_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// Transcripts
export function saveTranscript(transcript: Transcript): void {
  ensureDataDir();
  
  const filePath = path.join(TRANSCRIPTS_DIR, `${transcript.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(transcript, null, 2));
}

export function getTranscript(id: string): Transcript | null {
  ensureDataDir();
  
  const filePath = path.join(TRANSCRIPTS_DIR, `${id}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

export function getAllTranscripts(): Transcript[] {
  ensureDataDir();
  
  const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'));
  
  return files.map(file => {
    const data = fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf-8');
    return JSON.parse(data);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

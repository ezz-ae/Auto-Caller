#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const STORE_DRIVER = (process.env.STORE_DRIVER || '').toLowerCase();
const USE_POSTGRES =
  STORE_DRIVER === 'postgres' ||
  (STORE_DRIVER !== 'filesystem' && (process.env.DATABASE_URL || '').startsWith('postgres'));

const now = new Date();

async function seedPostgres() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const campaignId = randomUUID();
  const recordingId = randomUUID();
  const transcriptId = randomUUID();

  await prisma.appSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      businessName: 'Demo Realty',
      forwardToNumber: '+12025550199',
      managedMode: process.env.MANAGED_MODE === 'true',
      recordCalls: true,
      transcribeCalls: true,
    },
    update: {
      businessName: 'Demo Realty',
      forwardToNumber: '+12025550199',
      recordCalls: true,
      transcribeCalls: true,
    },
  });

  await prisma.creditBalance.upsert({
    where: { id: 'default' },
    create: { id: 'default', credits: 1200 },
    update: { credits: 1200 },
  });

  await prisma.teamMember.upsert({
    where: { email: 'owner@demo-realty.ai' },
    create: {
      id: randomUUID(),
      name: 'Platform Owner',
      email: 'owner@demo-realty.ai',
      role: 'Owner',
      active: true,
    },
    update: {
      name: 'Platform Owner',
      role: 'Owner',
      active: true,
    },
  });

  await prisma.campaignRecord.upsert({
    where: { id: campaignId },
    create: {
      id: campaignId,
      userId: 'default',
      name: 'Demo Launch Campaign',
      status: 'completed',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      script: 'Hi, this is Demo Realty. Are you still looking for a 2-bedroom apartment this month?',
      numbers: ['+12025550111', '+12025550112', '+12025550113'],
      currentIndex: 3,
      results: [
        { id: randomUUID(), campaignId, phoneNumber: '+12025550111', status: 'connected', timestamp: now.toISOString() },
        { id: randomUUID(), campaignId, phoneNumber: '+12025550112', status: 'no-answer', timestamp: now.toISOString() },
        { id: randomUUID(), campaignId, phoneNumber: '+12025550113', status: 'connected', timestamp: now.toISOString() },
      ],
      createdAt: now,
      completedAt: now,
      recordCalls: true,
      transcribeCalls: true,
    },
    update: {},
  });

  const transcript = {
    id: transcriptId,
    recordingId,
    text: 'Prospect asked for details and requested a follow-up this week.',
    confidence: 0.93,
    summary: 'Interested lead requested more details and follow-up.',
    sentiment: 'positive',
    keywords: ['2-bedroom', 'budget', 'follow-up'],
    actionItems: ['Send brochure', 'Schedule callback'],
    createdAt: now.toISOString(),
  };

  await prisma.recordingRecord.upsert({
    where: { id: recordingId },
    create: {
      id: recordingId,
      callSid: `CA${randomUUID().replace(/-/g, '').slice(0, 30)}`,
      campaignId,
      phoneNumber: '+12025550111',
      recordingSid: `RE${randomUUID().replace(/-/g, '').slice(0, 30)}`,
      recordingUrl: 'https://example.com/demo-recording.mp3',
      duration: 56,
      status: 'completed',
      transcript,
      createdAt: now,
    },
    update: {},
  });

  await prisma.transcriptRecord.upsert({
    where: { id: transcriptId },
    create: {
      id: transcriptId,
      recordingId,
      text: transcript.text,
      confidence: transcript.confidence,
      summary: transcript.summary,
      sentiment: transcript.sentiment,
      keywords: transcript.keywords,
      actionItems: transcript.actionItems,
      createdAt: now,
    },
    update: {},
  });

  await prisma.$disconnect();
  console.log('Seed complete (postgres).');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function seedFilesystem() {
  const root = process.cwd();
  const dataDir = path.join(root, 'data');
  const campaignsDir = path.join(dataDir, 'campaigns');
  const recordingsDir = path.join(dataDir, 'recordings');
  const transcriptsDir = path.join(dataDir, 'transcripts');

  ensureDir(dataDir);
  ensureDir(campaignsDir);
  ensureDir(recordingsDir);
  ensureDir(transcriptsDir);

  const campaignId = randomUUID();
  const recordingId = randomUUID();
  const transcriptId = randomUUID();

  fs.writeFileSync(path.join(dataDir, 'settings.json'), JSON.stringify({
    businessName: 'Demo Realty',
    forwardToNumber: '+12025550199',
    recordCalls: true,
    transcribeCalls: true,
    managedMode: process.env.MANAGED_MODE === 'true',
  }, null, 2));

  fs.writeFileSync(path.join(dataDir, 'credits.json'), JSON.stringify({ credits: 1200 }, null, 2));

  fs.writeFileSync(path.join(dataDir, 'team-members.json'), JSON.stringify([
    {
      id: randomUUID(),
      name: 'Platform Owner',
      email: 'owner@demo-realty.ai',
      role: 'Owner',
      active: true,
      createdAt: now.toISOString(),
    }
  ], null, 2));

  fs.writeFileSync(path.join(campaignsDir, `${campaignId}.json`), JSON.stringify({
    id: campaignId,
    userId: 'default',
    name: 'Demo Launch Campaign',
    status: 'completed',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    script: 'Hi, this is Demo Realty. Are you still looking for a 2-bedroom apartment this month?',
    numbers: ['+12025550111', '+12025550112', '+12025550113'],
    currentIndex: 3,
    results: [
      { id: randomUUID(), campaignId, phoneNumber: '+12025550111', status: 'connected', timestamp: now.toISOString() },
      { id: randomUUID(), campaignId, phoneNumber: '+12025550112', status: 'no-answer', timestamp: now.toISOString() },
      { id: randomUUID(), campaignId, phoneNumber: '+12025550113', status: 'connected', timestamp: now.toISOString() },
    ],
    createdAt: now.toISOString(),
    completedAt: now.toISOString(),
    recordCalls: true,
    transcribeCalls: true,
  }, null, 2));

  const transcript = {
    id: transcriptId,
    recordingId,
    text: 'Prospect asked for details and requested a follow-up this week.',
    confidence: 0.93,
    summary: 'Interested lead requested more details and follow-up.',
    sentiment: 'positive',
    keywords: ['2-bedroom', 'budget', 'follow-up'],
    actionItems: ['Send brochure', 'Schedule callback'],
    createdAt: now.toISOString(),
  };

  fs.writeFileSync(path.join(recordingsDir, `${recordingId}.json`), JSON.stringify({
    id: recordingId,
    callSid: `CA${randomUUID().replace(/-/g, '').slice(0, 30)}`,
    campaignId,
    phoneNumber: '+12025550111',
    recordingSid: `RE${randomUUID().replace(/-/g, '').slice(0, 30)}`,
    recordingUrl: 'https://example.com/demo-recording.mp3',
    duration: 56,
    status: 'completed',
    transcript,
    createdAt: now.toISOString(),
  }, null, 2));

  fs.writeFileSync(path.join(transcriptsDir, `${transcriptId}.json`), JSON.stringify(transcript, null, 2));
  console.log('Seed complete (filesystem).');
}

if (USE_POSTGRES) {
  seedPostgres().catch(error => {
    console.error(error);
    process.exit(1);
  });
} else {
  seedFilesystem();
}

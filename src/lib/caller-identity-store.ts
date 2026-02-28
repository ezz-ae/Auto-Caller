import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from './prisma';

export interface CallerIdentity {
  id: string;
  name: string;
  position: string;
  gender: string;
  language: string;
  voiceId: string;
  industry: string;
  mentionAi: boolean;
  script: string;
  sayThisRules: string;
  avoidThisRules: string;
  totalCalls: number;
  connectedCalls: number;
  failedCalls: number;
  noAnswerCalls: number;
  campaignsLaunched: number;
  creditsUsed: number;
  lastCalledAt?: Date;
  createdAt: Date;
}

export interface CallerIdentityKpiDelta {
  totalCalls?: number;
  connectedCalls?: number;
  failedCalls?: number;
  noAnswerCalls?: number;
  campaignsLaunched?: number;
  creditsUsed?: number;
  lastCalledAt?: Date;
}

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/auto-caller-data' : path.join(process.cwd(), 'data'));
const CALLER_IDENTITIES_FILE = path.join(DATA_DIR, 'caller-identities.json');

const STORE_DRIVER = (process.env.STORE_DRIVER || '').toLowerCase();
const usePostgresStore =
  STORE_DRIVER === 'postgres' ||
  (STORE_DRIVER !== 'filesystem' && (process.env.DATABASE_URL || '').startsWith('postgres'));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function toDate(value: string | Date | undefined | null): Date | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
}

function normalizeIdentity(
  input: Partial<CallerIdentity> & { name: string; position: string; language: string; voiceId: string; script: string },
  existing?: CallerIdentity
): CallerIdentity {
  const now = new Date();

  return {
    id: existing?.id || input.id || uuidv4(),
    name: input.name.trim(),
    position: input.position.trim(),
    gender: (input.gender || existing?.gender || 'any').trim().toLowerCase(),
    language: input.language.trim() || 'en-US',
    voiceId: input.voiceId.trim() || '21m00Tcm4TlvDq8ikWAM',
    industry: (input.industry || '').trim(),
    mentionAi: Boolean(input.mentionAi),
    script: input.script.trim(),
    sayThisRules: (input.sayThisRules || '').trim(),
    avoidThisRules: (input.avoidThisRules || '').trim(),
    totalCalls: input.totalCalls ?? existing?.totalCalls ?? 0,
    connectedCalls: input.connectedCalls ?? existing?.connectedCalls ?? 0,
    failedCalls: input.failedCalls ?? existing?.failedCalls ?? 0,
    noAnswerCalls: input.noAnswerCalls ?? existing?.noAnswerCalls ?? 0,
    campaignsLaunched: input.campaignsLaunched ?? existing?.campaignsLaunched ?? 0,
    creditsUsed: input.creditsUsed ?? existing?.creditsUsed ?? 0,
    lastCalledAt: toDate(input.lastCalledAt) || existing?.lastCalledAt,
    createdAt: existing?.createdAt || toDate(input.createdAt) || now,
  };
}

function fsReadAll(): CallerIdentity[] {
  ensureDataDir();

  if (!fs.existsSync(CALLER_IDENTITIES_FILE)) {
    fs.writeFileSync(CALLER_IDENTITIES_FILE, '[]');
    return [];
  }

  const raw = fs.readFileSync(CALLER_IDENTITIES_FILE, 'utf-8');
  const data = JSON.parse(raw) as Array<Omit<CallerIdentity, 'createdAt' | 'lastCalledAt'> & { createdAt: string; lastCalledAt?: string }>;

  return data
    .map(item => ({
      ...item,
      gender: (item as any).gender || 'any',
      createdAt: new Date(item.createdAt),
      lastCalledAt: item.lastCalledAt ? new Date(item.lastCalledAt) : undefined,
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function fsWriteAll(identities: CallerIdentity[]) {
  ensureDataDir();
  fs.writeFileSync(CALLER_IDENTITIES_FILE, JSON.stringify(identities, null, 2));
}

export async function listCallerIdentities(): Promise<CallerIdentity[]> {
  if (usePostgresStore) {
    const rows = await prisma.callerIdentity.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      position: row.position,
      gender: row.gender,
      language: row.language,
      voiceId: row.voiceId,
      industry: row.industry,
      mentionAi: row.mentionAi,
      script: row.script,
      sayThisRules: row.sayThisRules,
      avoidThisRules: row.avoidThisRules,
      totalCalls: row.totalCalls,
      connectedCalls: row.connectedCalls,
      failedCalls: row.failedCalls,
      noAnswerCalls: row.noAnswerCalls,
      campaignsLaunched: row.campaignsLaunched,
      creditsUsed: row.creditsUsed,
      lastCalledAt: row.lastCalledAt || undefined,
      createdAt: row.createdAt,
    }));
  }

  return fsReadAll();
}

export async function getCallerIdentity(id: string): Promise<CallerIdentity | null> {
  if (usePostgresStore) {
    const row = await prisma.callerIdentity.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      position: row.position,
      gender: row.gender,
      language: row.language,
      voiceId: row.voiceId,
      industry: row.industry,
      mentionAi: row.mentionAi,
      script: row.script,
      sayThisRules: row.sayThisRules,
      avoidThisRules: row.avoidThisRules,
      totalCalls: row.totalCalls,
      connectedCalls: row.connectedCalls,
      failedCalls: row.failedCalls,
      noAnswerCalls: row.noAnswerCalls,
      campaignsLaunched: row.campaignsLaunched,
      creditsUsed: row.creditsUsed,
      lastCalledAt: row.lastCalledAt || undefined,
      createdAt: row.createdAt,
    };
  }

  const all = fsReadAll();
  return all.find(item => item.id === id) || null;
}

export async function saveCallerIdentity(
  input: Partial<CallerIdentity> & { name: string; position: string; language: string; voiceId: string; script: string }
): Promise<CallerIdentity> {
  if (usePostgresStore) {
    const existing = input.id ? await prisma.callerIdentity.findUnique({ where: { id: input.id } }) : null;
    const normalized = normalizeIdentity(input, existing ? {
      id: existing.id,
      name: existing.name,
      position: existing.position,
      gender: existing.gender,
      language: existing.language,
      voiceId: existing.voiceId,
      industry: existing.industry,
      mentionAi: existing.mentionAi,
      script: existing.script,
      sayThisRules: existing.sayThisRules,
      avoidThisRules: existing.avoidThisRules,
      totalCalls: existing.totalCalls,
      connectedCalls: existing.connectedCalls,
      failedCalls: existing.failedCalls,
      noAnswerCalls: existing.noAnswerCalls,
      campaignsLaunched: existing.campaignsLaunched,
      creditsUsed: existing.creditsUsed,
      lastCalledAt: existing.lastCalledAt || undefined,
      createdAt: existing.createdAt,
    } : undefined);

    const row = await prisma.callerIdentity.upsert({
      where: { id: normalized.id },
      create: {
        id: normalized.id,
        name: normalized.name,
        position: normalized.position,
        gender: normalized.gender,
        language: normalized.language,
        voiceId: normalized.voiceId,
        industry: normalized.industry,
        mentionAi: normalized.mentionAi,
        script: normalized.script,
        sayThisRules: normalized.sayThisRules,
        avoidThisRules: normalized.avoidThisRules,
        totalCalls: normalized.totalCalls,
        connectedCalls: normalized.connectedCalls,
        failedCalls: normalized.failedCalls,
        noAnswerCalls: normalized.noAnswerCalls,
        campaignsLaunched: normalized.campaignsLaunched,
        creditsUsed: normalized.creditsUsed,
        lastCalledAt: normalized.lastCalledAt || null,
      },
      update: {
        name: normalized.name,
        position: normalized.position,
        gender: normalized.gender,
        language: normalized.language,
        voiceId: normalized.voiceId,
        industry: normalized.industry,
        mentionAi: normalized.mentionAi,
        script: normalized.script,
        sayThisRules: normalized.sayThisRules,
        avoidThisRules: normalized.avoidThisRules,
        totalCalls: normalized.totalCalls,
        connectedCalls: normalized.connectedCalls,
        failedCalls: normalized.failedCalls,
        noAnswerCalls: normalized.noAnswerCalls,
        campaignsLaunched: normalized.campaignsLaunched,
        creditsUsed: normalized.creditsUsed,
        lastCalledAt: normalized.lastCalledAt || null,
      },
    });

    return {
      id: row.id,
      name: row.name,
      position: row.position,
      gender: row.gender,
      language: row.language,
      voiceId: row.voiceId,
      industry: row.industry,
      mentionAi: row.mentionAi,
      script: row.script,
      sayThisRules: row.sayThisRules,
      avoidThisRules: row.avoidThisRules,
      totalCalls: row.totalCalls,
      connectedCalls: row.connectedCalls,
      failedCalls: row.failedCalls,
      noAnswerCalls: row.noAnswerCalls,
      campaignsLaunched: row.campaignsLaunched,
      creditsUsed: row.creditsUsed,
      lastCalledAt: row.lastCalledAt || undefined,
      createdAt: row.createdAt,
    };
  }

  const all = fsReadAll();
  const existingIndex = input.id ? all.findIndex(item => item.id === input.id) : -1;
  const normalized = normalizeIdentity(input, existingIndex >= 0 ? all[existingIndex] : undefined);

  if (existingIndex >= 0) {
    all[existingIndex] = normalized;
  } else {
    all.push(normalized);
  }

  fsWriteAll(all);
  return normalized;
}

export async function deleteCallerIdentity(id: string): Promise<void> {
  if (usePostgresStore) {
    await prisma.callerIdentity.deleteMany({ where: { id } });
    return;
  }

  const all = fsReadAll().filter(item => item.id !== id);
  fsWriteAll(all);
}

export async function applyCallerIdentityKpiDelta(id: string, delta: CallerIdentityKpiDelta): Promise<CallerIdentity | null> {
  if (!id) return null;

  if (usePostgresStore) {
    const existing = await prisma.callerIdentity.findUnique({ where: { id } });
    if (!existing) return null;

    const row = await prisma.callerIdentity.update({
      where: { id },
      data: {
        totalCalls: Math.max(0, existing.totalCalls + (delta.totalCalls || 0)),
        connectedCalls: Math.max(0, existing.connectedCalls + (delta.connectedCalls || 0)),
        failedCalls: Math.max(0, existing.failedCalls + (delta.failedCalls || 0)),
        noAnswerCalls: Math.max(0, existing.noAnswerCalls + (delta.noAnswerCalls || 0)),
        campaignsLaunched: Math.max(0, existing.campaignsLaunched + (delta.campaignsLaunched || 0)),
        creditsUsed: Math.max(0, existing.creditsUsed + (delta.creditsUsed || 0)),
        lastCalledAt: delta.lastCalledAt || existing.lastCalledAt,
      },
    });

    return {
      id: row.id,
      name: row.name,
      position: row.position,
      gender: row.gender,
      language: row.language,
      voiceId: row.voiceId,
      industry: row.industry,
      mentionAi: row.mentionAi,
      script: row.script,
      sayThisRules: row.sayThisRules,
      avoidThisRules: row.avoidThisRules,
      totalCalls: row.totalCalls,
      connectedCalls: row.connectedCalls,
      failedCalls: row.failedCalls,
      noAnswerCalls: row.noAnswerCalls,
      campaignsLaunched: row.campaignsLaunched,
      creditsUsed: row.creditsUsed,
      lastCalledAt: row.lastCalledAt || undefined,
      createdAt: row.createdAt,
    };
  }

  const all = fsReadAll();
  const index = all.findIndex(item => item.id === id);
  if (index < 0) return null;

  const current = all[index];
  const updated: CallerIdentity = {
    ...current,
    totalCalls: Math.max(0, current.totalCalls + (delta.totalCalls || 0)),
    connectedCalls: Math.max(0, current.connectedCalls + (delta.connectedCalls || 0)),
    failedCalls: Math.max(0, current.failedCalls + (delta.failedCalls || 0)),
    noAnswerCalls: Math.max(0, current.noAnswerCalls + (delta.noAnswerCalls || 0)),
    campaignsLaunched: Math.max(0, current.campaignsLaunched + (delta.campaignsLaunched || 0)),
    creditsUsed: Math.max(0, current.creditsUsed + (delta.creditsUsed || 0)),
    lastCalledAt: delta.lastCalledAt || current.lastCalledAt,
  };

  all[index] = updated;
  fsWriteAll(all);
  return updated;
}

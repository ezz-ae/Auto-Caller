import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from './prisma';
import { tryProvisionManagedNumber } from './managed-number';

export interface CallerIdentity {
  id: string;
  userId: string;
  name: string;
  position: string;
  gender: string;
  language: string;
  voiceId: string;
  dedicatedNumber?: string;
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

function normalizeUserId(userId?: string): string {
  return String(userId || '').trim() || 'default';
}

function getCallerIdentitiesFile(userId: string): string {
  return path.join(DATA_DIR, `caller-identities.${normalizeUserId(userId)}.json`);
}

function normalizeIdentity(
  input: Partial<CallerIdentity> & { name: string; position: string; language: string; voiceId: string; script: string },
  existing?: CallerIdentity,
  userId = 'default'
): CallerIdentity {
  const now = new Date();

  return {
    id: existing?.id || input.id || uuidv4(),
    userId: normalizeUserId(input.userId || existing?.userId || userId),
    name: input.name.trim(),
    position: input.position.trim(),
    gender: (input.gender || existing?.gender || 'any').trim().toLowerCase(),
    language: input.language.trim() || 'en-US',
    voiceId: input.voiceId.trim() || '21m00Tcm4TlvDq8ikWAM',
    dedicatedNumber: (input.dedicatedNumber || existing?.dedicatedNumber || '').trim() || undefined,
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

function fsReadAll(userId = 'default'): CallerIdentity[] {
  ensureDataDir();
  const filePath = getCallerIdentitiesFile(userId);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]');
    return [];
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw) as Array<Omit<CallerIdentity, 'createdAt' | 'lastCalledAt'> & { createdAt: string; lastCalledAt?: string }>;

  return data
    .map(item => ({
      ...item,
      userId: normalizeUserId((item as any).userId),
      gender: (item as any).gender || 'any',
      dedicatedNumber: (item as any).dedicatedNumber || undefined,
      createdAt: new Date(item.createdAt),
      lastCalledAt: item.lastCalledAt ? new Date(item.lastCalledAt) : undefined,
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function fsWriteAll(identities: CallerIdentity[], userId = 'default') {
  ensureDataDir();
  fs.writeFileSync(getCallerIdentitiesFile(userId), JSON.stringify(identities, null, 2));
}

export async function listCallerIdentities(userId = 'default'): Promise<CallerIdentity[]> {
  const scopedUserId = normalizeUserId(userId);
  if (usePostgresStore) {
    const rows = await prisma.callerIdentity.findMany({
      where: { userId: scopedUserId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(row => ({
      id: row.id,
      userId: row.userId,
      name: row.name,
      position: row.position,
      gender: row.gender,
      language: row.language,
      voiceId: row.voiceId,
      dedicatedNumber: row.dedicatedNumber || undefined,
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

  return fsReadAll(scopedUserId);
}

export async function getCallerIdentity(id: string, userId?: string): Promise<CallerIdentity | null> {
  const scopedUserId = normalizeUserId(userId);
  if (usePostgresStore) {
    const row = await prisma.callerIdentity.findUnique({ where: { id } });
    if (!row) return null;
    if (userId && normalizeUserId(row.userId) !== scopedUserId) return null;
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      position: row.position,
      gender: row.gender,
      language: row.language,
      voiceId: row.voiceId,
      dedicatedNumber: row.dedicatedNumber || undefined,
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

  const all = fsReadAll(scopedUserId);
  return all.find(item => item.id === id) || null;
}

export async function saveCallerIdentity(
  input: Partial<CallerIdentity> & { name: string; position: string; language: string; voiceId: string; script: string },
  userId = 'default'
): Promise<CallerIdentity> {
  const scopedUserId = normalizeUserId(userId);
  if (usePostgresStore) {
    const existing = input.id ? await prisma.callerIdentity.findUnique({ where: { id: input.id } }) : null;
    if (existing && normalizeUserId(existing.userId) !== scopedUserId) {
      throw new Error('Caller identity does not belong to this user');
    }
    const normalized = normalizeIdentity(input, existing ? {
      id: existing.id,
      userId: existing.userId,
      name: existing.name,
      position: existing.position,
      gender: existing.gender,
      language: existing.language,
      voiceId: existing.voiceId,
      dedicatedNumber: existing.dedicatedNumber || undefined,
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
    } : undefined, scopedUserId);

    const row = await prisma.callerIdentity.upsert({
      where: { id: normalized.id },
      create: {
        id: normalized.id,
        userId: scopedUserId,
        name: normalized.name,
        position: normalized.position,
        gender: normalized.gender,
        language: normalized.language,
        voiceId: normalized.voiceId,
        dedicatedNumber: normalized.dedicatedNumber || null,
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
        userId: scopedUserId,
        name: normalized.name,
        position: normalized.position,
        gender: normalized.gender,
        language: normalized.language,
        voiceId: normalized.voiceId,
        dedicatedNumber: normalized.dedicatedNumber || null,
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
      userId: row.userId,
      name: row.name,
      position: row.position,
      gender: row.gender,
      language: row.language,
      voiceId: row.voiceId,
      dedicatedNumber: row.dedicatedNumber || undefined,
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

  const all = fsReadAll(scopedUserId);
  const existingIndex = input.id ? all.findIndex(item => item.id === input.id) : -1;
  const normalized = normalizeIdentity(input, existingIndex >= 0 ? all[existingIndex] : undefined, scopedUserId);

  if (existingIndex >= 0) {
    all[existingIndex] = normalized;
  } else {
    all.push(normalized);
  }

  fsWriteAll(all, scopedUserId);
  return normalized;
}

export async function deleteCallerIdentity(id: string, userId = 'default'): Promise<void> {
  const scopedUserId = normalizeUserId(userId);
  if (usePostgresStore) {
    await prisma.callerIdentity.deleteMany({ where: { id, userId: scopedUserId } });
    return;
  }

  const all = fsReadAll(scopedUserId).filter(item => item.id !== id);
  fsWriteAll(all, scopedUserId);
}

export async function applyCallerIdentityKpiDelta(id: string, delta: CallerIdentityKpiDelta, userId?: string): Promise<CallerIdentity | null> {
  if (!id) return null;
  const scopedUserId = normalizeUserId(userId);

  if (usePostgresStore) {
    const existing = await prisma.callerIdentity.findUnique({ where: { id } });
    if (!existing) return null;
    if (userId && normalizeUserId(existing.userId) !== scopedUserId) return null;

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
      userId: row.userId,
      name: row.name,
      position: row.position,
      gender: row.gender,
      language: row.language,
      voiceId: row.voiceId,
      dedicatedNumber: row.dedicatedNumber || undefined,
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

  const all = fsReadAll(scopedUserId);
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
  fsWriteAll(all, scopedUserId);
  return updated;
}

function buildFallbackManagedNumbers(): string[] {
  const pool = (process.env.MANAGED_NUMBER_POOL || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  const defaults = [
    (process.env.MANAGED_DEFAULT_NUMBER || '').trim(),
    (process.env.MANAGED_TWILIO_PHONE_NUMBER || '').trim(),
  ].filter(Boolean);

  return [...pool, ...defaults];
}

async function listUsedDedicatedNumbers(excludeIdentityId?: string): Promise<Set<string>> {
  if (usePostgresStore) {
    const rows = await prisma.callerIdentity.findMany({
      where: {
        dedicatedNumber: { not: null },
        ...(excludeIdentityId ? { id: { not: excludeIdentityId } } : {}),
      },
      select: { dedicatedNumber: true },
    });

    return new Set(rows.map(row => String(row.dedicatedNumber || '').trim()).filter(Boolean));
  }

  return new Set(
    fs
      .readdirSync(DATA_DIR)
      .filter(file => file.startsWith('caller-identities.') && file.endsWith('.json'))
      .flatMap(file => {
        const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
        const list = JSON.parse(raw) as CallerIdentity[];
        return list;
      })
      .filter(identity => identity.id !== excludeIdentityId)
      .map(identity => String(identity.dedicatedNumber || '').trim())
      .filter(Boolean)
  );
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === 'P2002';
}

export async function assignDedicatedNumberToCallerIdentity(identityId: string, userId = 'default'): Promise<CallerIdentity | null> {
  if (!identityId) return null;
  const scopedUserId = normalizeUserId(userId);

  const identity = await getCallerIdentity(identityId, scopedUserId);
  if (!identity) return null;
  if (identity.dedicatedNumber) return identity;

  const saveDedicatedNumber = async (candidate: string): Promise<CallerIdentity | null> => {
    const normalized = candidate.trim();
    if (!normalized) return null;

    const usedNumbers = await listUsedDedicatedNumbers(identity.id);
    if (usedNumbers.has(normalized)) {
      return null;
    }

    return await saveCallerIdentity({
      ...identity,
      dedicatedNumber: normalized,
    }, scopedUserId);
  };

  const provisionedNumber = await tryProvisionManagedNumber();
  if (provisionedNumber) {
    try {
      const assigned = await saveDedicatedNumber(provisionedNumber);
      if (assigned) return assigned;
    } catch (error) {
      if (!isPrismaUniqueConstraintError(error)) {
        throw error;
      }
    }
  }

  const fallbackNumbers = buildFallbackManagedNumbers();
  for (const candidate of fallbackNumbers) {
    try {
      const assigned = await saveDedicatedNumber(candidate);
      if (assigned) return assigned;
    } catch (error) {
      if (!isPrismaUniqueConstraintError(error)) {
        throw error;
      }
    }
  }

  throw new Error(
    'No available managed number. Add more numbers to MANAGED_NUMBER_POOL or enable MANAGED_AUTO_PROVISION_NUMBER.'
  );
}

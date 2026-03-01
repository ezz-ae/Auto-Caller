import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/auto-caller-data' : path.join(process.cwd(), 'data'));
const STORE_DRIVER = (process.env.STORE_DRIVER || '').toLowerCase();
const usePostgresStore =
  STORE_DRIVER === 'postgres' ||
  (STORE_DRIVER !== 'filesystem' && (process.env.DATABASE_URL || '').startsWith('postgres'));

const SUPPRESSION_FILE_PREFIX = 'suppression.';

let pgReadyPromise: Promise<void> | null = null;

export interface SuppressionEntry {
  id: string;
  userId: string;
  phoneNumber: string;
  reason: string;
  source: string;
  createdAt: string;
  expiresAt?: string;
}

function normalizeUserId(userId?: string): string {
  return String(userId || '').trim() || 'default';
}

function normalizePhoneNumber(input: string): string {
  let value = String(input || '').trim();
  if (!value) return '';
  value = value.replace(/[\s().-]+/g, '');
  if (value.startsWith('00')) value = `+${value.slice(2)}`;
  if (value.startsWith('+')) {
    value = `+${value.slice(1).replace(/\D/g, '')}`;
  } else {
    value = value.replace(/\D/g, '');
  }
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  return value.startsWith('+') ? value : `+${value}`;
}

function getSuppressionFile(userId: string): string {
  return path.join(DATA_DIR, `${SUPPRESSION_FILE_PREFIX}${normalizeUserId(userId)}.json`);
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function fsReadSuppression(userId = 'default'): SuppressionEntry[] {
  ensureDataDir();
  const file = getSuppressionFile(userId);
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SuppressionEntry[];
  } catch {
    return [];
  }
}

function fsWriteSuppression(entries: SuppressionEntry[], userId = 'default') {
  ensureDataDir();
  const file = getSuppressionFile(userId);
  fs.writeFileSync(file, JSON.stringify(entries, null, 2));
}

async function ensurePgTables() {
  if (!usePostgresStore) return;
  if (pgReadyPromise) {
    await pgReadyPromise;
    return;
  }

  pgReadyPromise = (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS compliance_suppression (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        reason TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT 'system',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS compliance_suppression_user_phone_idx
      ON compliance_suppression (user_id, phone_number);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS compliance_suppression_user_created_idx
      ON compliance_suppression (user_id, created_at DESC);
    `);
  })();

  await pgReadyPromise;
}

export async function addSuppressionNumber(input: {
  userId?: string;
  phoneNumber: string;
  reason?: string;
  source?: string;
  expiresAt?: Date;
}): Promise<SuppressionEntry | null> {
  const userId = normalizeUserId(input.userId);
  const phoneNumber = normalizePhoneNumber(input.phoneNumber);
  if (!phoneNumber) return null;

  const entry: SuppressionEntry = {
    id: randomUUID(),
    userId,
    phoneNumber,
    reason: String(input.reason || 'Suppressed by compliance policy').trim(),
    source: String(input.source || 'system').trim(),
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt ? input.expiresAt.toISOString() : undefined,
  };

  if (usePostgresStore) {
    await ensurePgTables();
    await prisma.$executeRaw`
      INSERT INTO compliance_suppression (id, user_id, phone_number, reason, source, created_at, expires_at)
      VALUES (${entry.id}, ${entry.userId}, ${entry.phoneNumber}, ${entry.reason}, ${entry.source}, NOW(), ${entry.expiresAt ? new Date(entry.expiresAt) : null})
      ON CONFLICT (user_id, phone_number)
      DO UPDATE SET
        reason = EXCLUDED.reason,
        source = EXCLUDED.source,
        created_at = NOW(),
        expires_at = EXCLUDED.expires_at
    `;
    return getSuppressionForNumber(userId, phoneNumber);
  }

  const all = fsReadSuppression(userId);
  const idx = all.findIndex(item => item.phoneNumber === phoneNumber);
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      reason: entry.reason,
      source: entry.source,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
    };
  } else {
    all.unshift(entry);
  }
  fsWriteSuppression(all.slice(0, 5000), userId);
  return all[idx >= 0 ? idx : 0] || entry;
}

export async function getSuppressionForNumber(userIdInput: string, phoneInput: string): Promise<SuppressionEntry | null> {
  const userId = normalizeUserId(userIdInput);
  const phoneNumber = normalizePhoneNumber(phoneInput);
  if (!phoneNumber) return null;

  if (usePostgresStore) {
    await ensurePgTables();
    const rows = await prisma.$queryRaw<Array<{
      id: string;
      user_id: string;
      phone_number: string;
      reason: string;
      source: string;
      created_at: Date;
      expires_at: Date | null;
    }>>`
      SELECT id, user_id, phone_number, reason, source, created_at, expires_at
      FROM compliance_suppression
      WHERE user_id = ${userId}
        AND phone_number = ${phoneNumber}
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      phoneNumber: row.phone_number,
      reason: row.reason || '',
      source: row.source || 'system',
      createdAt: row.created_at.toISOString(),
      expiresAt: row.expires_at ? row.expires_at.toISOString() : undefined,
    };
  }

  const found = fsReadSuppression(userId).find(item => {
    if (item.phoneNumber !== phoneNumber) return false;
    if (!item.expiresAt) return true;
    return new Date(item.expiresAt).getTime() > Date.now();
  });
  return found || null;
}

export async function isSuppressedNumber(userId: string, phoneNumber: string): Promise<boolean> {
  const entry = await getSuppressionForNumber(userId, phoneNumber);
  return !!entry;
}

export async function listSuppressionNumbers(userIdInput: string, limit = 200): Promise<SuppressionEntry[]> {
  const userId = normalizeUserId(userIdInput);
  const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 200));

  if (usePostgresStore) {
    await ensurePgTables();
    const rows = await prisma.$queryRaw<Array<{
      id: string;
      user_id: string;
      phone_number: string;
      reason: string;
      source: string;
      created_at: Date;
      expires_at: Date | null;
    }>>`
      SELECT id, user_id, phone_number, reason, source, created_at, expires_at
      FROM compliance_suppression
      WHERE user_id = ${userId}
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `;
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      phoneNumber: row.phone_number,
      reason: row.reason || '',
      source: row.source || 'system',
      createdAt: row.created_at.toISOString(),
      expiresAt: row.expires_at ? row.expires_at.toISOString() : undefined,
    }));
  }

  return fsReadSuppression(userId)
    .filter(item => !item.expiresAt || new Date(item.expiresAt).getTime() > Date.now())
    .slice(0, safeLimit);
}

export async function removeSuppressionNumber(userIdInput: string, phoneInput: string): Promise<boolean> {
  const userId = normalizeUserId(userIdInput);
  const phoneNumber = normalizePhoneNumber(phoneInput);
  if (!phoneNumber) return false;

  if (usePostgresStore) {
    await ensurePgTables();
    const result = await prisma.$executeRaw`
      DELETE FROM compliance_suppression
      WHERE user_id = ${userId} AND phone_number = ${phoneNumber}
    `;
    return Number(result) > 0;
  }

  const all = fsReadSuppression(userId);
  const next = all.filter(item => item.phoneNumber !== phoneNumber);
  const changed = next.length !== all.length;
  if (changed) {
    fsWriteSuppression(next, userId);
  }
  return changed;
}

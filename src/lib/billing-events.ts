import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/auto-caller-data' : path.join(process.cwd(), 'data'));

const STORE_DRIVER = (process.env.STORE_DRIVER || '').toLowerCase();
const usePostgresStore =
  STORE_DRIVER === 'postgres' ||
  (STORE_DRIVER !== 'filesystem' && (process.env.DATABASE_URL || '').startsWith('postgres'));

export interface BillingEventRecord {
  id: string;
  userId: string;
  kind: string;
  amount: number;
  status: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

function normalizeUserId(userId?: string): string {
  return String(userId || '').trim() || 'default';
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getBillingEventsFile(userId: string): string {
  return path.join(DATA_DIR, `billing-events.${normalizeUserId(userId)}.json`);
}

function fsReadAll(userId = 'default'): BillingEventRecord[] {
  ensureDataDir();
  const filePath = getBillingEventsFile(userId);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]');
    return [];
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as Array<Omit<BillingEventRecord, 'createdAt'> & { createdAt: string }>;
  return parsed
    .map(item => ({
      ...item,
      userId: normalizeUserId(item.userId),
      createdAt: new Date(item.createdAt),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function fsWriteAll(events: BillingEventRecord[], userId = 'default') {
  ensureDataDir();
  fs.writeFileSync(getBillingEventsFile(userId), JSON.stringify(events, null, 2));
}

function isMissingBillingTableError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'P2021') {
    return true;
  }
  const message = String((error as { message?: string } | null)?.message || '');
  return message.includes('billing_events') && message.includes('does not exist');
}

export async function recordBillingEventOnce(input: {
  id: string;
  userId?: string;
  kind: string;
  amount: number;
  status?: string;
  metadata?: Record<string, any>;
}): Promise<{ created: boolean; event: BillingEventRecord }> {
  const userId = normalizeUserId(input.userId);
  const status = String(input.status || 'applied').trim() || 'applied';
  const id = String(input.id || '').trim();
  if (!id) {
    throw new Error('Billing event id is required');
  }

  if (usePostgresStore) {
    try {
      const row = await prisma.billingEvent.create({
        data: {
          id,
          userId,
          kind: input.kind,
          amount: input.amount,
          status,
          metadata: (input.metadata || {}) as Prisma.InputJsonValue,
        },
      });
      return {
        created: true,
        event: {
          id: row.id,
          userId: row.userId,
          kind: row.kind,
          amount: row.amount,
          status: row.status,
          metadata: (row.metadata as Record<string, any>) || undefined,
          createdAt: row.createdAt,
        },
      };
    } catch (error: any) {
      if (isMissingBillingTableError(error)) {
        // Graceful fallback for partially migrated databases.
        const existingFs = fsReadAll(userId).find(item => item.id === id);
        if (existingFs) {
          return { created: false, event: existingFs };
        }
        const event: BillingEventRecord = {
          id,
          userId,
          kind: input.kind,
          amount: input.amount,
          status,
          metadata: input.metadata || undefined,
          createdAt: new Date(),
        };
        const all = fsReadAll(userId);
        all.unshift(event);
        fsWriteAll(all, userId);
        return { created: true, event };
      }
      if (error?.code !== 'P2002') {
        throw error;
      }
      const existing = await prisma.billingEvent.findUnique({ where: { id } });
      if (!existing) {
        throw error;
      }
      return {
        created: false,
        event: {
          id: existing.id,
          userId: existing.userId,
          kind: existing.kind,
          amount: existing.amount,
          status: existing.status,
          metadata: (existing.metadata as Record<string, any>) || undefined,
          createdAt: existing.createdAt,
        },
      };
    }
  }

  const existing = fsReadAll(userId).find(item => item.id === id);
  if (existing) {
    return { created: false, event: existing };
  }

  const event: BillingEventRecord = {
    id,
    userId,
    kind: input.kind,
    amount: input.amount,
    status,
    metadata: input.metadata || undefined,
    createdAt: new Date(),
  };
  const all = fsReadAll(userId);
  all.unshift(event);
  fsWriteAll(all, userId);
  return { created: true, event };
}

export async function listBillingEvents(userId = 'default', limit = 30): Promise<BillingEventRecord[]> {
  const scopedUserId = normalizeUserId(userId);
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  if (usePostgresStore) {
    try {
      const rows = await prisma.billingEvent.findMany({
        where: { userId: scopedUserId },
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
      });
      return rows.map(row => ({
        id: row.id,
        userId: row.userId,
        kind: row.kind,
        amount: row.amount,
        status: row.status,
        metadata: (row.metadata as Record<string, any>) || undefined,
        createdAt: row.createdAt,
      }));
    } catch (error) {
      if (!isMissingBillingTableError(error)) {
        throw error;
      }
      // Graceful fallback for partially migrated databases.
      return fsReadAll(scopedUserId).slice(0, safeLimit);
    }
  }

  return fsReadAll(scopedUserId).slice(0, safeLimit);
}

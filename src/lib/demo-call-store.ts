import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/auto-caller-data' : path.join(process.cwd(), 'data'));
const STORE_DRIVER = (process.env.STORE_DRIVER || '').toLowerCase();
const usePostgresStore =
  STORE_DRIVER === 'postgres' ||
  (STORE_DRIVER !== 'filesystem' && (process.env.DATABASE_URL || '').startsWith('postgres'));

const DEMO_DB_FILE = path.join(DATA_DIR, 'demo-call-store.json');
const IP_WINDOW_SECONDS = 15 * 60;
const PHONE_COOLDOWN_SECONDS = 24 * 60 * 60;
const MAX_ATTEMPTS_PER_IP_WINDOW = Number(process.env.DEMO_CALL_MAX_PER_IP_15M || 5);

let pgTablesReadyPromise: Promise<void> | null = null;

export type DemoTurnRole = 'agent' | 'lead';

export interface DemoSessionTurn {
  role: DemoTurnRole;
  text: string;
  createdAt: string;
}

export interface DemoSession {
  id: string;
  phoneNumber: string;
  ipHash: string;
  leadName: string;
  consentAccepted: boolean;
  callSid: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'no_answer';
  turnCount: number;
  turns: DemoSessionTurn[];
  createdAt: string;
  updatedAt: string;
}

interface DemoAttempt {
  id: string;
  phoneNumber: string;
  ipHash: string;
  status: 'started' | 'completed' | 'failed' | 'no_answer' | 'blocked';
  reason: string;
  createdAt: string;
}

export interface DemoEligibility {
  allowed: boolean;
  retryAfterSeconds: number;
  message: string;
  code: 'OK' | 'IP_RATE_LIMIT' | 'PHONE_COOLDOWN';
}

interface FsDb {
  sessions: DemoSession[];
  attempts: DemoAttempt[];
}

function normalizePhone(phone: string): string {
  return String(phone || '').trim();
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function readFsDb(): FsDb {
  ensureDataDir();
  if (!fs.existsSync(DEMO_DB_FILE)) {
    const empty: FsDb = { sessions: [], attempts: [] };
    fs.writeFileSync(DEMO_DB_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(DEMO_DB_FILE, 'utf-8')) as FsDb;
    return {
      sessions: Array.isArray(parsed?.sessions) ? parsed.sessions : [],
      attempts: Array.isArray(parsed?.attempts) ? parsed.attempts : [],
    };
  } catch {
    return { sessions: [], attempts: [] };
  }
}

function writeFsDb(next: FsDb) {
  ensureDataDir();
  fs.writeFileSync(DEMO_DB_FILE, JSON.stringify(next, null, 2));
}

function getCutoffIso(secondsBack: number): string {
  return new Date(Date.now() - secondsBack * 1000).toISOString();
}

function fsCheckEligibility(phoneNumber: string, ipHash: string): DemoEligibility {
  const db = readFsDb();
  const now = Date.now();
  const ipCutoff = now - IP_WINDOW_SECONDS * 1000;
  const phoneCutoff = now - PHONE_COOLDOWN_SECONDS * 1000;

  const ipAttempts = db.attempts.filter(item => item.ipHash === ipHash && new Date(item.createdAt).getTime() >= ipCutoff);
  if (ipAttempts.length >= MAX_ATTEMPTS_PER_IP_WINDOW) {
    const oldest = ipAttempts
      .map(item => new Date(item.createdAt).getTime())
      .sort((a, b) => a - b)[0];
    const retryAfterSeconds = Math.max(30, Math.ceil((oldest + IP_WINDOW_SECONDS * 1000 - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      message: 'Too many demo requests from this network. Try again later.',
      code: 'IP_RATE_LIMIT',
    };
  }

  const recentPhone = db.attempts.find(item => (
    item.phoneNumber === phoneNumber &&
    (item.status === 'started' || item.status === 'completed') &&
    new Date(item.createdAt).getTime() >= phoneCutoff
  ));

  if (recentPhone) {
    const retryAfterSeconds = Math.max(60, Math.ceil((new Date(recentPhone.createdAt).getTime() + PHONE_COOLDOWN_SECONDS * 1000 - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      message: 'This number already received a demo recently. Try again tomorrow.',
      code: 'PHONE_COOLDOWN',
    };
  }

  return { allowed: true, retryAfterSeconds: 0, message: 'Allowed', code: 'OK' };
}

function fsRecordAttempt(input: Omit<DemoAttempt, 'id' | 'createdAt'>) {
  const db = readFsDb();
  db.attempts.unshift({
    id: crypto.randomUUID(),
    phoneNumber: normalizePhone(input.phoneNumber),
    ipHash: input.ipHash,
    status: input.status,
    reason: input.reason,
    createdAt: nowIso(),
  });
  db.attempts = db.attempts.slice(0, 5000);
  writeFsDb(db);
}

function fsCreateSession(input: {
  phoneNumber: string;
  ipHash: string;
  leadName: string;
  consentAccepted: boolean;
}): DemoSession {
  const db = readFsDb();
  const created = nowIso();
  const session: DemoSession = {
    id: crypto.randomUUID(),
    phoneNumber: normalizePhone(input.phoneNumber),
    ipHash: input.ipHash,
    leadName: String(input.leadName || '').trim(),
    consentAccepted: input.consentAccepted,
    callSid: '',
    status: 'queued',
    turnCount: 0,
    turns: [],
    createdAt: created,
    updatedAt: created,
  };
  db.sessions.unshift(session);
  db.sessions = db.sessions.slice(0, 2000);
  writeFsDb(db);
  return session;
}

function fsAttachCallSid(sessionId: string, callSid: string): DemoSession | null {
  const db = readFsDb();
  const index = db.sessions.findIndex(item => item.id === sessionId);
  if (index < 0) return null;
  db.sessions[index] = {
    ...db.sessions[index],
    callSid: callSid || db.sessions[index].callSid,
    status: 'in_progress',
    updatedAt: nowIso(),
  };
  writeFsDb(db);
  return db.sessions[index];
}

function fsGetSessionByCallSid(callSid: string): DemoSession | null {
  if (!callSid) return null;
  const db = readFsDb();
  return db.sessions.find(item => item.callSid === callSid) || null;
}

function fsGetSessionById(id: string): DemoSession | null {
  if (!id) return null;
  const db = readFsDb();
  return db.sessions.find(item => item.id === id) || null;
}

function fsAppendTurn(callSid: string, role: DemoTurnRole, text: string): DemoSession | null {
  const db = readFsDb();
  const index = db.sessions.findIndex(item => item.callSid === callSid);
  if (index < 0) return null;
  const turns = [
    ...db.sessions[index].turns,
    {
      role,
      text,
      createdAt: nowIso(),
    },
  ].slice(-30);
  db.sessions[index] = {
    ...db.sessions[index],
    turnCount: db.sessions[index].turnCount + (role === 'lead' ? 1 : 0),
    turns,
    updatedAt: nowIso(),
  };
  writeFsDb(db);
  return db.sessions[index];
}

function fsSetSessionStatus(callSid: string, status: DemoSession['status']): DemoSession | null {
  const db = readFsDb();
  const index = db.sessions.findIndex(item => item.callSid === callSid);
  if (index < 0) return null;
  db.sessions[index] = {
    ...db.sessions[index],
    status,
    updatedAt: nowIso(),
  };
  writeFsDb(db);
  return db.sessions[index];
}

async function ensurePgTables() {
  if (!usePostgresStore) return;
  if (pgTablesReadyPromise) {
    await pgTablesReadyPromise;
    return;
  }

  pgTablesReadyPromise = (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS demo_call_sessions (
        id TEXT PRIMARY KEY,
        phone_number TEXT NOT NULL,
        ip_hash TEXT NOT NULL,
        lead_name TEXT NOT NULL DEFAULT '',
        consent_accepted BOOLEAN NOT NULL DEFAULT FALSE,
        call_sid TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'queued',
        turn_count INTEGER NOT NULL DEFAULT 0,
        turns JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS demo_call_sessions_phone_created_idx
      ON demo_call_sessions (phone_number, created_at DESC);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS demo_call_sessions_call_sid_idx
      ON demo_call_sessions (call_sid);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS demo_call_attempts (
        id TEXT PRIMARY KEY,
        phone_number TEXT NOT NULL,
        ip_hash TEXT NOT NULL,
        status TEXT NOT NULL,
        reason TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS demo_call_attempts_ip_created_idx
      ON demo_call_attempts (ip_hash, created_at DESC);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS demo_call_attempts_phone_created_idx
      ON demo_call_attempts (phone_number, created_at DESC);
    `);
  })();

  await pgTablesReadyPromise;
}

async function pgCheckEligibility(phoneNumber: string, ipHash: string): Promise<DemoEligibility> {
  await ensurePgTables();

  const ipRows = await prisma.$queryRaw<Array<{ count: bigint | number }>>`
    SELECT COUNT(*)::bigint as count
    FROM demo_call_attempts
    WHERE ip_hash = ${ipHash}
      AND created_at >= NOW() - INTERVAL '15 minutes'
  `;

  const ipCount = Number(ipRows[0]?.count || 0);
  if (ipCount >= MAX_ATTEMPTS_PER_IP_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: IP_WINDOW_SECONDS,
      message: 'Too many demo requests from this network. Try again later.',
      code: 'IP_RATE_LIMIT',
    };
  }

  const phoneRows = await prisma.$queryRaw<Array<{ count: bigint | number }>>`
    SELECT COUNT(*)::bigint as count
    FROM demo_call_attempts
    WHERE phone_number = ${phoneNumber}
      AND status IN ('started', 'completed')
      AND created_at >= NOW() - INTERVAL '24 hours'
  `;

  const phoneCount = Number(phoneRows[0]?.count || 0);
  if (phoneCount > 0) {
    return {
      allowed: false,
      retryAfterSeconds: PHONE_COOLDOWN_SECONDS,
      message: 'This number already received a demo recently. Try again tomorrow.',
      code: 'PHONE_COOLDOWN',
    };
  }

  return { allowed: true, retryAfterSeconds: 0, message: 'Allowed', code: 'OK' };
}

async function pgRecordAttempt(input: Omit<DemoAttempt, 'id' | 'createdAt'>): Promise<void> {
  await ensurePgTables();
  await prisma.$executeRaw`
    INSERT INTO demo_call_attempts (id, phone_number, ip_hash, status, reason)
    VALUES (${crypto.randomUUID()}, ${normalizePhone(input.phoneNumber)}, ${input.ipHash}, ${input.status}, ${input.reason})
  `;
}

async function pgCreateSession(input: {
  phoneNumber: string;
  ipHash: string;
  leadName: string;
  consentAccepted: boolean;
}): Promise<DemoSession> {
  await ensurePgTables();
  const session: DemoSession = {
    id: crypto.randomUUID(),
    phoneNumber: normalizePhone(input.phoneNumber),
    ipHash: input.ipHash,
    leadName: String(input.leadName || '').trim(),
    consentAccepted: input.consentAccepted,
    callSid: '',
    status: 'queued',
    turnCount: 0,
    turns: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO demo_call_sessions
      (id, phone_number, ip_hash, lead_name, consent_accepted, call_sid, status, turn_count, turns)
      VALUES ($1, $2, $3, $4, $5, NULL, 'queued', 0, $6::jsonb)
    `,
    session.id,
    session.phoneNumber,
    session.ipHash,
    session.leadName,
    session.consentAccepted,
    JSON.stringify(session.turns)
  );

  return session;
}

function mapSessionRow(row: {
  id: string;
  phone_number: string;
  ip_hash: string;
  lead_name: string;
  consent_accepted: boolean;
  call_sid: string | null;
  status: string;
  turn_count: number;
  turns: unknown;
  created_at: Date;
  updated_at: Date;
}): DemoSession {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    ipHash: row.ip_hash,
    leadName: row.lead_name || '',
    consentAccepted: !!row.consent_accepted,
    callSid: row.call_sid || '',
    status: ['queued', 'in_progress', 'completed', 'failed', 'no_answer'].includes(row.status) ? (row.status as DemoSession['status']) : 'queued',
    turnCount: Number(row.turn_count || 0),
    turns: Array.isArray(row.turns) ? (row.turns as DemoSessionTurn[]) : [],
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function pgAttachCallSid(sessionId: string, callSid: string): Promise<DemoSession | null> {
  await ensurePgTables();
  await prisma.$executeRaw`
    UPDATE demo_call_sessions
    SET call_sid = ${callSid}, status = 'in_progress', updated_at = NOW()
    WHERE id = ${sessionId}
  `;
  return pgGetSessionById(sessionId);
}

async function pgGetSessionById(id: string): Promise<DemoSession | null> {
  await ensurePgTables();
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    phone_number: string;
    ip_hash: string;
    lead_name: string;
    consent_accepted: boolean;
    call_sid: string | null;
    status: string;
    turn_count: number;
    turns: unknown;
    created_at: Date;
    updated_at: Date;
  }>>`
    SELECT id, phone_number, ip_hash, lead_name, consent_accepted, call_sid, status, turn_count, turns, created_at, updated_at
    FROM demo_call_sessions
    WHERE id = ${id}
    LIMIT 1
  `;
  if (!rows.length) return null;
  return mapSessionRow(rows[0]);
}

async function pgGetSessionByCallSid(callSid: string): Promise<DemoSession | null> {
  await ensurePgTables();
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    phone_number: string;
    ip_hash: string;
    lead_name: string;
    consent_accepted: boolean;
    call_sid: string | null;
    status: string;
    turn_count: number;
    turns: unknown;
    created_at: Date;
    updated_at: Date;
  }>>`
    SELECT id, phone_number, ip_hash, lead_name, consent_accepted, call_sid, status, turn_count, turns, created_at, updated_at
    FROM demo_call_sessions
    WHERE call_sid = ${callSid}
    LIMIT 1
  `;
  if (!rows.length) return null;
  return mapSessionRow(rows[0]);
}

async function pgAppendTurn(callSid: string, role: DemoTurnRole, text: string): Promise<DemoSession | null> {
  const session = await pgGetSessionByCallSid(callSid);
  if (!session) return null;

  const nextTurns = [
    ...session.turns,
    {
      role,
      text,
      createdAt: nowIso(),
    },
  ].slice(-30);

  const nextTurnCount = session.turnCount + (role === 'lead' ? 1 : 0);

  await prisma.$executeRawUnsafe(
    `
      UPDATE demo_call_sessions
      SET turns = $1::jsonb, turn_count = $2, updated_at = NOW()
      WHERE call_sid = $3
    `,
    JSON.stringify(nextTurns),
    nextTurnCount,
    callSid
  );

  return pgGetSessionByCallSid(callSid);
}

async function pgSetSessionStatus(callSid: string, status: DemoSession['status']): Promise<DemoSession | null> {
  await ensurePgTables();
  await prisma.$executeRaw`
    UPDATE demo_call_sessions
    SET status = ${status}, updated_at = NOW()
    WHERE call_sid = ${callSid}
  `;
  return pgGetSessionByCallSid(callSid);
}

export function hashIpAddress(ip: string): string {
  return crypto.createHash('sha256').update(String(ip || 'unknown')).digest('hex');
}

export async function checkDemoEligibility(phoneNumber: string, ipHash: string): Promise<DemoEligibility> {
  return usePostgresStore ? pgCheckEligibility(phoneNumber, ipHash) : fsCheckEligibility(phoneNumber, ipHash);
}

export async function recordDemoAttempt(input: Omit<DemoAttempt, 'id' | 'createdAt'>): Promise<void> {
  if (usePostgresStore) {
    await pgRecordAttempt(input);
    return;
  }
  fsRecordAttempt(input);
}

export async function createDemoSession(input: {
  phoneNumber: string;
  ipHash: string;
  leadName: string;
  consentAccepted: boolean;
}): Promise<DemoSession> {
  return usePostgresStore ? pgCreateSession(input) : fsCreateSession(input);
}

export async function attachDemoCallSid(sessionId: string, callSid: string): Promise<DemoSession | null> {
  return usePostgresStore ? pgAttachCallSid(sessionId, callSid) : fsAttachCallSid(sessionId, callSid);
}

export async function getDemoSessionByCallSid(callSid: string): Promise<DemoSession | null> {
  return usePostgresStore ? pgGetSessionByCallSid(callSid) : fsGetSessionByCallSid(callSid);
}

export async function getDemoSessionById(sessionId: string): Promise<DemoSession | null> {
  return usePostgresStore ? pgGetSessionById(sessionId) : fsGetSessionById(sessionId);
}

export async function appendDemoSessionTurn(callSid: string, role: DemoTurnRole, text: string): Promise<DemoSession | null> {
  return usePostgresStore ? pgAppendTurn(callSid, role, text) : fsAppendTurn(callSid, role, text);
}

export async function setDemoSessionStatus(callSid: string, status: DemoSession['status']): Promise<DemoSession | null> {
  return usePostgresStore ? pgSetSessionStatus(callSid, status) : fsSetSessionStatus(callSid, status);
}

export const demoLimits = {
  ipWindowSeconds: IP_WINDOW_SECONDS,
  phoneCooldownSeconds: PHONE_COOLDOWN_SECONDS,
  maxAttemptsPerIpWindow: MAX_ATTEMPTS_PER_IP_WINDOW,
};

export function demoCutoffs() {
  return {
    ipCutoffIso: getCutoffIso(IP_WINDOW_SECONDS),
    phoneCutoffIso: getCutoffIso(PHONE_COOLDOWN_SECONDS),
  };
}

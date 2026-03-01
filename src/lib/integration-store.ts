import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/auto-caller-data' : path.join(process.cwd(), 'data'));
const STORE_DRIVER = (process.env.STORE_DRIVER || '').toLowerCase();
const usePostgresStore =
  STORE_DRIVER === 'postgres' ||
  (STORE_DRIVER !== 'filesystem' && (process.env.DATABASE_URL || '').startsWith('postgres'));

const SETTINGS_PREFIX = 'integration.settings.';
const EVENTS_PREFIX = 'integration.events.';
const INBOX_PREFIX = 'integration.inbox.';

let pgTablesReadyPromise: Promise<void> | null = null;

export interface LeadSourceSettings {
  zapierEnabled: boolean;
  zapierInboundSecret: string;
  googleDriveEnabled: boolean;
  googleDriveCsvUrl: string;
  googleDriveAutoSync: boolean;
}

export interface IntegrationEvent {
  id: string;
  userId: string;
  source: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  importedCount: number;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface LeadInboxItem {
  id: string;
  userId: string;
  source: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  payload: Record<string, unknown>;
  status: 'new' | 'consumed';
  createdAt: string;
  consumedAt?: string;
}

export interface LeadInboxSummary {
  newCount: number;
  consumedCount: number;
}

export interface LeadInboxInput {
  phoneNumber: string;
  name?: string;
  email?: string;
  payload?: Record<string, unknown>;
}

function normalizeUserId(userId?: string): string {
  return String(userId || '').trim() || 'default';
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function defaultSettings(): LeadSourceSettings {
  return {
    zapierEnabled: true,
    zapierInboundSecret: createZapierSecret(),
    googleDriveEnabled: false,
    googleDriveCsvUrl: '',
    googleDriveAutoSync: false,
  };
}

function createZapierSecret(): string {
  return crypto.randomBytes(24).toString('hex');
}

function safeParseJson<T>(input: string, fallback: T): T {
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

function getSettingsFile(userId: string): string {
  return path.join(DATA_DIR, `${SETTINGS_PREFIX}${normalizeUserId(userId)}.json`);
}

function getEventsFile(userId: string): string {
  return path.join(DATA_DIR, `${EVENTS_PREFIX}${normalizeUserId(userId)}.json`);
}

function getInboxFile(userId: string): string {
  return path.join(DATA_DIR, `${INBOX_PREFIX}${normalizeUserId(userId)}.json`);
}

function fsGetSettings(userId = 'default'): LeadSourceSettings {
  ensureDataDir();
  const scopedUserId = normalizeUserId(userId);
  const file = getSettingsFile(scopedUserId);
  const defaults = defaultSettings();

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaults, null, 2));
    return defaults;
  }

  const existing = safeParseJson<Partial<LeadSourceSettings>>(fs.readFileSync(file, 'utf-8'), {});
  const merged = {
    ...defaults,
    ...existing,
    zapierInboundSecret: existing.zapierInboundSecret || defaults.zapierInboundSecret,
  };

  if (!existing.zapierInboundSecret) {
    fs.writeFileSync(file, JSON.stringify(merged, null, 2));
  }

  return merged;
}

function fsSaveSettings(settings: Partial<LeadSourceSettings>, userId = 'default'): LeadSourceSettings {
  ensureDataDir();
  const scopedUserId = normalizeUserId(userId);
  const current = fsGetSettings(scopedUserId);
  const next = {
    ...current,
    ...settings,
  };
  fs.writeFileSync(getSettingsFile(scopedUserId), JSON.stringify(next, null, 2));
  return next;
}

function fsGetEvents(userId = 'default', limit = 30): IntegrationEvent[] {
  ensureDataDir();
  const scopedUserId = normalizeUserId(userId);
  const file = getEventsFile(scopedUserId);
  if (!fs.existsSync(file)) return [];

  const events = safeParseJson<IntegrationEvent[]>(fs.readFileSync(file, 'utf-8'), []);
  return events
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, Math.max(1, Math.min(200, limit)));
}

function fsAppendEvent(event: Omit<IntegrationEvent, 'id' | 'createdAt' | 'userId'>, userId = 'default'): IntegrationEvent {
  ensureDataDir();
  const scopedUserId = normalizeUserId(userId);
  const file = getEventsFile(scopedUserId);
  const now = new Date().toISOString();
  const entry: IntegrationEvent = {
    id: crypto.randomUUID(),
    userId: scopedUserId,
    source: event.source,
    status: event.status,
    message: event.message,
    importedCount: event.importedCount,
    details: event.details || {},
    createdAt: now,
  };

  const current = fs.existsSync(file)
    ? safeParseJson<IntegrationEvent[]>(fs.readFileSync(file, 'utf-8'), [])
    : [];

  current.unshift(entry);
  fs.writeFileSync(file, JSON.stringify(current.slice(0, 300), null, 2));
  return entry;
}

function fsListInbox(userId = 'default', status: 'new' | 'consumed' | 'all' = 'new', limit = 200): LeadInboxItem[] {
  ensureDataDir();
  const scopedUserId = normalizeUserId(userId);
  const file = getInboxFile(scopedUserId);
  if (!fs.existsSync(file)) return [];

  const rows = safeParseJson<LeadInboxItem[]>(fs.readFileSync(file, 'utf-8'), []);
  return rows
    .filter(item => status === 'all' || item.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, Math.max(1, Math.min(500, limit)));
}

function fsSaveInboxRows(userId: string, rows: LeadInboxItem[]) {
  ensureDataDir();
  fs.writeFileSync(getInboxFile(userId), JSON.stringify(rows, null, 2));
}

function fsEnqueueInbox(source: string, leads: LeadInboxInput[], userId = 'default'): number {
  ensureDataDir();
  const scopedUserId = normalizeUserId(userId);
  const existing = fsListInbox(scopedUserId, 'all', 5000);
  const known = new Set(
    existing
      .filter(item => item.status === 'new')
      .map(item => `${item.source}|${item.phoneNumber}`)
  );

  const additions: LeadInboxItem[] = [];
  for (const lead of leads) {
    const phoneNumber = String(lead.phoneNumber || '').trim();
    if (!phoneNumber) continue;

    const dedupeKey = `${source}|${phoneNumber}`;
    if (known.has(dedupeKey)) continue;
    known.add(dedupeKey);

    additions.push({
      id: crypto.randomUUID(),
      userId: scopedUserId,
      source,
      phoneNumber,
      name: lead.name || '',
      email: lead.email || '',
      payload: lead.payload || {},
      status: 'new',
      createdAt: new Date().toISOString(),
    });
  }

  if (additions.length === 0) return 0;

  fsSaveInboxRows(scopedUserId, [...additions, ...existing].slice(0, 5000));
  return additions.length;
}

function fsConsumeInbox(userId = 'default', limit = 200): LeadInboxItem[] {
  ensureDataDir();
  const scopedUserId = normalizeUserId(userId);
  const all = fsListInbox(scopedUserId, 'all', 5000);
  const targets = all
    .filter(item => item.status === 'new')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, Math.max(1, Math.min(500, limit)));

  if (targets.length === 0) return [];

  const targetIds = new Set(targets.map(item => item.id));
  const consumedAt = new Date().toISOString();
  const next = all.map(item => {
    if (!targetIds.has(item.id)) return item;
    return {
      ...item,
      status: 'consumed' as const,
      consumedAt,
    };
  });

  fsSaveInboxRows(scopedUserId, next);
  return targets;
}

function fsGetInboxSummary(userId = 'default'): LeadInboxSummary {
  const all = fsListInbox(userId, 'all', 5000);
  return {
    newCount: all.filter(item => item.status === 'new').length,
    consumedCount: all.filter(item => item.status === 'consumed').length,
  };
}

function fsFindUserByZapierSecret(secret: string): string | null {
  ensureDataDir();
  const token = String(secret || '').trim();
  if (!token) return null;

  const files = fs.readdirSync(DATA_DIR).filter(file => file.startsWith(SETTINGS_PREFIX) && file.endsWith('.json'));
  for (const fileName of files) {
    const fullPath = path.join(DATA_DIR, fileName);
    const data = safeParseJson<Partial<LeadSourceSettings>>(fs.readFileSync(fullPath, 'utf-8'), {});
    if (data.zapierEnabled === false) continue;
    if (String(data.zapierInboundSecret || '') !== token) continue;

    const userPart = fileName.slice(SETTINGS_PREFIX.length, -'.json'.length);
    return userPart || 'default';
  }

  return null;
}

async function ensurePgTables() {
  if (!usePostgresStore) return;
  if (pgTablesReadyPromise) {
    await pgTablesReadyPromise;
    return;
  }

  pgTablesReadyPromise = (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS integration_settings (
        user_id TEXT PRIMARY KEY,
        zapier_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        zapier_inbound_secret TEXT NOT NULL DEFAULT '',
        google_drive_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        google_drive_csv_url TEXT NOT NULL DEFAULT '',
        google_drive_auto_sync BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS integration_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT NOT NULL,
        imported_count INTEGER NOT NULL DEFAULT 0,
        details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS integration_events_user_created_idx
      ON integration_events (user_id, created_at DESC);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS lead_inbox (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        source TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        name TEXT,
        email TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        consumed_at TIMESTAMPTZ
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS lead_inbox_user_status_created_idx
      ON lead_inbox (user_id, status, created_at DESC);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS lead_inbox_user_source_phone_new_idx
      ON lead_inbox (user_id, source, phone_number, status);
    `);
  })();

  await pgTablesReadyPromise;
}

type PgSettingsRow = {
  user_id: string;
  zapier_enabled: boolean;
  zapier_inbound_secret: string;
  google_drive_enabled: boolean;
  google_drive_csv_url: string;
  google_drive_auto_sync: boolean;
};

async function pgGetSettings(userId = 'default'): Promise<LeadSourceSettings> {
  await ensurePgTables();
  const scopedUserId = normalizeUserId(userId);

  const rows = await prisma.$queryRaw<PgSettingsRow[]>`
    SELECT user_id, zapier_enabled, zapier_inbound_secret, google_drive_enabled, google_drive_csv_url, google_drive_auto_sync
    FROM integration_settings
    WHERE user_id = ${scopedUserId}
    LIMIT 1
  `;

  if (!rows.length) {
    const defaults = defaultSettings();
    await prisma.$executeRaw`
      INSERT INTO integration_settings (user_id, zapier_enabled, zapier_inbound_secret, google_drive_enabled, google_drive_csv_url, google_drive_auto_sync)
      VALUES (${scopedUserId}, ${defaults.zapierEnabled}, ${defaults.zapierInboundSecret}, ${defaults.googleDriveEnabled}, ${defaults.googleDriveCsvUrl}, ${defaults.googleDriveAutoSync})
    `;
    return defaults;
  }

  const row = rows[0];
  let secret = String(row.zapier_inbound_secret || '').trim();
  if (!secret) {
    secret = createZapierSecret();
    await prisma.$executeRaw`
      UPDATE integration_settings
      SET zapier_inbound_secret = ${secret}, updated_at = NOW()
      WHERE user_id = ${scopedUserId}
    `;
  }

  return {
    zapierEnabled: !!row.zapier_enabled,
    zapierInboundSecret: secret,
    googleDriveEnabled: !!row.google_drive_enabled,
    googleDriveCsvUrl: String(row.google_drive_csv_url || ''),
    googleDriveAutoSync: !!row.google_drive_auto_sync,
  };
}

async function pgSaveSettings(settings: Partial<LeadSourceSettings>, userId = 'default'): Promise<LeadSourceSettings> {
  await ensurePgTables();
  const scopedUserId = normalizeUserId(userId);
  const current = await pgGetSettings(scopedUserId);
  const next: LeadSourceSettings = {
    ...current,
    ...settings,
  };

  await prisma.$executeRaw`
    INSERT INTO integration_settings (user_id, zapier_enabled, zapier_inbound_secret, google_drive_enabled, google_drive_csv_url, google_drive_auto_sync)
    VALUES (${scopedUserId}, ${next.zapierEnabled}, ${next.zapierInboundSecret}, ${next.googleDriveEnabled}, ${next.googleDriveCsvUrl}, ${next.googleDriveAutoSync})
    ON CONFLICT (user_id)
    DO UPDATE SET
      zapier_enabled = EXCLUDED.zapier_enabled,
      zapier_inbound_secret = EXCLUDED.zapier_inbound_secret,
      google_drive_enabled = EXCLUDED.google_drive_enabled,
      google_drive_csv_url = EXCLUDED.google_drive_csv_url,
      google_drive_auto_sync = EXCLUDED.google_drive_auto_sync,
      updated_at = NOW()
  `;

  return next;
}

async function pgListEvents(userId = 'default', limit = 30): Promise<IntegrationEvent[]> {
  await ensurePgTables();
  const scopedUserId = normalizeUserId(userId);
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 30));

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    user_id: string;
    source: string;
    status: string;
    message: string;
    imported_count: number;
    details: unknown;
    created_at: Date;
  }>>`
    SELECT id, user_id, source, status, message, imported_count, details, created_at
    FROM integration_events
    WHERE user_id = ${scopedUserId}
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    source: row.source,
    status: (row.status === 'success' || row.status === 'warning' || row.status === 'error' ? row.status : 'warning'),
    message: row.message,
    importedCount: Number(row.imported_count || 0),
    details: (row.details && typeof row.details === 'object' ? (row.details as Record<string, unknown>) : {}),
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

async function pgAppendEvent(
  event: Omit<IntegrationEvent, 'id' | 'createdAt' | 'userId'>,
  userId = 'default'
): Promise<IntegrationEvent> {
  await ensurePgTables();
  const scopedUserId = normalizeUserId(userId);
  const entry: IntegrationEvent = {
    id: crypto.randomUUID(),
    userId: scopedUserId,
    source: event.source,
    status: event.status,
    message: event.message,
    importedCount: Number(event.importedCount || 0),
    details: event.details || {},
    createdAt: new Date().toISOString(),
  };

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO integration_events (id, user_id, source, status, message, imported_count, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
    entry.id,
    entry.userId,
    entry.source,
    entry.status,
    entry.message,
    entry.importedCount,
    JSON.stringify(entry.details || {})
  );

  return entry;
}

async function pgEnqueueInbox(source: string, leads: LeadInboxInput[], userId = 'default'): Promise<number> {
  await ensurePgTables();
  const scopedUserId = normalizeUserId(userId);
  let inserted = 0;

  for (const lead of leads) {
    const phoneNumber = String(lead.phoneNumber || '').trim();
    if (!phoneNumber) continue;

    const id = crypto.randomUUID();
    const result = await prisma.$executeRawUnsafe(
      `
        INSERT INTO lead_inbox (id, user_id, source, phone_number, name, email, status, payload)
        VALUES ($1, $2, $3, $4, $5, $6, 'new', $7::jsonb)
        ON CONFLICT (user_id, source, phone_number, status) DO NOTHING
      `,
      id,
      scopedUserId,
      source,
      phoneNumber,
      String(lead.name || ''),
      String(lead.email || ''),
      JSON.stringify(lead.payload || {})
    );

    if (Number(result) > 0) inserted += 1;
  }

  return inserted;
}

async function pgListInbox(
  userId = 'default',
  status: 'new' | 'consumed' | 'all' = 'new',
  limit = 200
): Promise<LeadInboxItem[]> {
  await ensurePgTables();
  const scopedUserId = normalizeUserId(userId);
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200));

  const statusWhere = status === 'all' ? 'TRUE' : `status = '${status}'`;
  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string;
    user_id: string;
    source: string;
    phone_number: string;
    name: string | null;
    email: string | null;
    payload: unknown;
    status: 'new' | 'consumed';
    created_at: Date;
    consumed_at: Date | null;
  }>>(
    `
      SELECT id, user_id, source, phone_number, name, email, payload, status, created_at, consumed_at
      FROM lead_inbox
      WHERE user_id = $1 AND ${statusWhere}
      ORDER BY created_at DESC
      LIMIT $2
    `,
    scopedUserId,
    safeLimit
  );

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    source: row.source,
    phoneNumber: row.phone_number,
    name: row.name || '',
    email: row.email || '',
    payload: (row.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : {}),
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    consumedAt: row.consumed_at ? new Date(row.consumed_at).toISOString() : undefined,
  }));
}

async function pgConsumeInbox(userId = 'default', limit = 200): Promise<LeadInboxItem[]> {
  await ensurePgTables();
  const scopedUserId = normalizeUserId(userId);
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200));

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    user_id: string;
    source: string;
    phone_number: string;
    name: string | null;
    email: string | null;
    payload: unknown;
    status: 'new' | 'consumed';
    created_at: Date;
    consumed_at: Date | null;
  }>>`
    SELECT id, user_id, source, phone_number, name, email, payload, status, created_at, consumed_at
    FROM lead_inbox
    WHERE user_id = ${scopedUserId} AND status = 'new'
    ORDER BY created_at ASC
    LIMIT ${safeLimit}
  `;

  if (!rows.length) return [];

  for (const row of rows) {
    await prisma.$executeRaw`
      UPDATE lead_inbox
      SET status = 'consumed', consumed_at = NOW()
      WHERE id = ${row.id} AND user_id = ${scopedUserId}
    `;
  }

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    source: row.source,
    phoneNumber: row.phone_number,
    name: row.name || '',
    email: row.email || '',
    payload: (row.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : {}),
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    consumedAt: row.consumed_at ? new Date(row.consumed_at).toISOString() : undefined,
  }));
}

async function pgGetInboxSummary(userId = 'default'): Promise<LeadInboxSummary> {
  await ensurePgTables();
  const scopedUserId = normalizeUserId(userId);

  const rows = await prisma.$queryRaw<Array<{ status: string; count: bigint | number }>>`
    SELECT status, COUNT(*) as count
    FROM lead_inbox
    WHERE user_id = ${scopedUserId}
    GROUP BY status
  `;

  let newCount = 0;
  let consumedCount = 0;
  for (const row of rows) {
    const count = Number(row.count || 0);
    if (row.status === 'new') newCount = count;
    if (row.status === 'consumed') consumedCount = count;
  }

  return { newCount, consumedCount };
}

async function pgFindUserByZapierSecret(secret: string): Promise<string | null> {
  await ensurePgTables();
  const token = String(secret || '').trim();
  if (!token) return null;

  const rows = await prisma.$queryRaw<Array<{ user_id: string }>>`
    SELECT user_id
    FROM integration_settings
    WHERE zapier_inbound_secret = ${token} AND zapier_enabled = TRUE
    LIMIT 1
  `;

  return rows[0]?.user_id || null;
}

export async function getLeadSourceSettings(userId = 'default'): Promise<LeadSourceSettings> {
  return usePostgresStore ? pgGetSettings(userId) : fsGetSettings(userId);
}

export async function saveLeadSourceSettings(settings: Partial<LeadSourceSettings>, userId = 'default'): Promise<LeadSourceSettings> {
  return usePostgresStore ? pgSaveSettings(settings, userId) : fsSaveSettings(settings, userId);
}

export async function rotateZapierInboundSecret(userId = 'default'): Promise<string> {
  const secret = createZapierSecret();
  await saveLeadSourceSettings({ zapierInboundSecret: secret }, userId);
  return secret;
}

export async function listIntegrationEvents(userId = 'default', limit = 30): Promise<IntegrationEvent[]> {
  return usePostgresStore ? pgListEvents(userId, limit) : fsGetEvents(userId, limit);
}

export async function appendIntegrationEvent(
  event: Omit<IntegrationEvent, 'id' | 'createdAt' | 'userId'>,
  userId = 'default'
): Promise<IntegrationEvent> {
  return usePostgresStore ? pgAppendEvent(event, userId) : fsAppendEvent(event, userId);
}

export async function enqueueLeadInboxItems(
  source: string,
  leads: LeadInboxInput[],
  userId = 'default'
): Promise<number> {
  return usePostgresStore ? pgEnqueueInbox(source, leads, userId) : fsEnqueueInbox(source, leads, userId);
}

export async function listLeadInboxItems(
  userId = 'default',
  status: 'new' | 'consumed' | 'all' = 'new',
  limit = 200
): Promise<LeadInboxItem[]> {
  return usePostgresStore ? pgListInbox(userId, status, limit) : fsListInbox(userId, status, limit);
}

export async function consumeLeadInboxItems(userId = 'default', limit = 200): Promise<LeadInboxItem[]> {
  return usePostgresStore ? pgConsumeInbox(userId, limit) : fsConsumeInbox(userId, limit);
}

export async function getLeadInboxSummary(userId = 'default'): Promise<LeadInboxSummary> {
  return usePostgresStore ? pgGetInboxSummary(userId) : fsGetInboxSummary(userId);
}

export async function findUserIdByZapierSecret(secret: string): Promise<string | null> {
  return usePostgresStore ? pgFindUserByZapierSecret(secret) : fsFindUserByZapierSecret(secret);
}

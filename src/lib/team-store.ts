import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from './prisma';

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
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

function normalizeUserId(userId?: string): string {
  return String(userId || '').trim() || 'default';
}

function getTeamMembersFile(userId: string): string {
  return path.join(DATA_DIR, `team-members.${normalizeUserId(userId)}.json`);
}

function fsReadAll(userId = 'default'): TeamMember[] {
  ensureDataDir();
  const filePath = getTeamMembersFile(userId);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]');
    return [];
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw) as Array<Omit<TeamMember, 'createdAt'> & { createdAt: string }>;

  return data
    .map(item => ({ ...item, userId: normalizeUserId((item as any).userId), createdAt: new Date(item.createdAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function fsWriteAll(members: TeamMember[], userId = 'default') {
  ensureDataDir();
  fs.writeFileSync(getTeamMembersFile(userId), JSON.stringify(members, null, 2));
}

export async function listTeamMembers(userId = 'default'): Promise<TeamMember[]> {
  const scopedUserId = normalizeUserId(userId);
  if (usePostgresStore) {
    const rows = await prisma.teamMember.findMany({
      where: { userId: scopedUserId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(row => ({
      id: row.id,
      userId: row.userId,
      name: row.name,
      email: row.email,
      role: row.role,
      active: row.active,
      createdAt: row.createdAt,
    }));
  }

  return fsReadAll(scopedUserId);
}

export async function saveTeamMember(
  member: Partial<TeamMember> & { name: string; email: string; role: string },
  userId = 'default'
): Promise<TeamMember> {
  const now = new Date();
  const scopedUserId = normalizeUserId(userId);

  if (usePostgresStore) {
    const id = member.id || uuidv4();
    const existing = member.id
      ? await prisma.teamMember.findUnique({ where: { id: member.id } })
      : null;
    if (existing && existing.userId !== scopedUserId) {
      throw new Error('Team member does not belong to this user');
    }

    const row = await prisma.teamMember.upsert({
      where: { id },
      create: {
        id,
        userId: scopedUserId,
        name: member.name,
        email: member.email.toLowerCase(),
        role: member.role,
        active: typeof member.active === 'boolean' ? member.active : true,
      },
      update: {
        userId: scopedUserId,
        name: member.name,
        email: member.email.toLowerCase(),
        role: member.role,
        active: typeof member.active === 'boolean' ? member.active : true,
      },
    });

    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      email: row.email,
      role: row.role,
      active: row.active,
      createdAt: row.createdAt,
    };
  }

  const all = fsReadAll(scopedUserId);
  const id = member.id || uuidv4();
  const existingIndex = all.findIndex(item => item.id === id || item.email.toLowerCase() === member.email.toLowerCase());

  const normalized: TeamMember = {
    id: existingIndex >= 0 ? all[existingIndex].id : id,
    userId: scopedUserId,
    name: member.name,
    email: member.email.toLowerCase(),
    role: member.role,
    active: typeof member.active === 'boolean' ? member.active : true,
    createdAt: existingIndex >= 0 ? all[existingIndex].createdAt : now,
  };

  if (existingIndex >= 0) {
    all[existingIndex] = normalized;
  } else {
    all.push(normalized);
  }

  fsWriteAll(all, scopedUserId);
  return normalized;
}

export async function deleteTeamMember(id: string, userId = 'default'): Promise<void> {
  const scopedUserId = normalizeUserId(userId);
  if (usePostgresStore) {
    await prisma.teamMember.deleteMany({ where: { id, userId: scopedUserId } });
    return;
  }

  const all = fsReadAll(scopedUserId).filter(item => item.id !== id);
  fsWriteAll(all, scopedUserId);
}

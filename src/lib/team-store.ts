import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from './prisma';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
}

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/auto-caller-data' : path.join(process.cwd(), 'data'));
const TEAM_MEMBERS_FILE = path.join(DATA_DIR, 'team-members.json');

const STORE_DRIVER = (process.env.STORE_DRIVER || '').toLowerCase();
const usePostgresStore =
  STORE_DRIVER === 'postgres' ||
  (STORE_DRIVER !== 'filesystem' && (process.env.DATABASE_URL || '').startsWith('postgres'));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function fsReadAll(): TeamMember[] {
  ensureDataDir();

  if (!fs.existsSync(TEAM_MEMBERS_FILE)) {
    fs.writeFileSync(TEAM_MEMBERS_FILE, '[]');
    return [];
  }

  const raw = fs.readFileSync(TEAM_MEMBERS_FILE, 'utf-8');
  const data = JSON.parse(raw) as Array<Omit<TeamMember, 'createdAt'> & { createdAt: string }>;

  return data
    .map(item => ({ ...item, createdAt: new Date(item.createdAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function fsWriteAll(members: TeamMember[]) {
  ensureDataDir();
  fs.writeFileSync(TEAM_MEMBERS_FILE, JSON.stringify(members, null, 2));
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  if (usePostgresStore) {
    const rows = await prisma.teamMember.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      active: row.active,
      createdAt: row.createdAt,
    }));
  }

  return fsReadAll();
}

export async function saveTeamMember(member: Partial<TeamMember> & { name: string; email: string; role: string }): Promise<TeamMember> {
  const now = new Date();

  if (usePostgresStore) {
    const id = member.id || uuidv4();
    const row = await prisma.teamMember.upsert({
      where: { id },
      create: {
        id,
        name: member.name,
        email: member.email.toLowerCase(),
        role: member.role,
        active: typeof member.active === 'boolean' ? member.active : true,
      },
      update: {
        name: member.name,
        email: member.email.toLowerCase(),
        role: member.role,
        active: typeof member.active === 'boolean' ? member.active : true,
      },
    });

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      active: row.active,
      createdAt: row.createdAt,
    };
  }

  const all = fsReadAll();
  const id = member.id || uuidv4();
  const existingIndex = all.findIndex(item => item.id === id || item.email.toLowerCase() === member.email.toLowerCase());

  const normalized: TeamMember = {
    id: existingIndex >= 0 ? all[existingIndex].id : id,
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

  fsWriteAll(all);
  return normalized;
}

export async function deleteTeamMember(id: string): Promise<void> {
  if (usePostgresStore) {
    await prisma.teamMember.deleteMany({ where: { id } });
    return;
  }

  const all = fsReadAll().filter(item => item.id !== id);
  fsWriteAll(all);
}

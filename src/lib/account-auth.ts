import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE_NAME = 'acp_session';

const SESSION_VERSION = 1;

interface SessionPayload {
  v: number;
  userId: string;
  email: string;
  exp: number;
}

function getSessionSecret(): string {
  return (
    process.env.APP_SESSION_SECRET ||
    process.env.APP_ACCESS_PASSWORD ||
    process.env.CRON_SECRET ||
    'change-me-session-secret'
  );
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function fromBase64url(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

function signPayload(payload: string): string {
  return base64url(crypto.createHmac('sha256', getSessionSecret()).update(payload).digest());
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function createSessionToken(user: { id: string; email: string }, ttlDays = 30): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    v: SESSION_VERSION,
    userId: user.id,
    email: user.email.toLowerCase(),
    exp: now + ttlDays * 24 * 60 * 60,
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expected = signPayload(encodedPayload);
  if (!safeEqual(signature, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64url(encodedPayload).toString('utf8')) as SessionPayload;
    if (!payload || payload.v !== SESSION_VERSION || !payload.userId || !payload.email) {
      return null;
    }
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

function hashWithScrypt(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) return reject(error);
      resolve(Buffer.from(key).toString('hex'));
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const digest = await hashWithScrypt(password, salt);
  return `scrypt:${salt}:${digest}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [algo, salt, expectedDigest] = String(passwordHash || '').split(':');
  if (algo !== 'scrypt' || !salt || !expectedDigest) return false;
  const digest = await hashWithScrypt(password, salt);
  return safeEqual(digest, expectedDigest);
}

export async function createUserAccount(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<{ id: string; name: string; email: string }> {
  const name = payload.name.trim();
  const email = payload.email.trim().toLowerCase();
  const password = payload.password;

  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.userAccount.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  return { id: user.id, name: user.name, email: user.email };
}

export async function authenticateUserAccount(payload: {
  email: string;
  password: string;
}): Promise<{ id: string; name: string; email: string } | null> {
  const email = payload.email.trim().toLowerCase();
  const password = payload.password;
  if (!email || !password) return null;

  const user = await prisma.userAccount.findUnique({ where: { email } });
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, name: user.name, email: user.email };
}

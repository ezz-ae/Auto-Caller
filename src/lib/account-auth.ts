import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { isAccountAuthEnabled } from '@/lib/access-control';

export const SESSION_COOKIE_NAME = 'acp_session';

const SESSION_VERSION = 1;
const PASSWORD_RESET_TTL_MINUTES = 30;

interface SessionPayload {
  v: number;
  userId: string;
  email: string;
  exp: number;
}

function getSessionSecret(): string {
  const explicitSecret = String(process.env.APP_SESSION_SECRET || '').trim();
  if (explicitSecret) return explicitSecret;

  if (isAccountAuthEnabled() && process.env.NODE_ENV === 'production') {
    throw new Error('APP_SESSION_SECRET is required in production when AUTH_MODE=accounts');
  }

  const fallbackSecret = String(process.env.APP_ACCESS_PASSWORD || process.env.CRON_SECRET || '').trim();
  if (fallbackSecret) return fallbackSecret;

  return 'dev-only-session-secret';
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

export async function createPasswordResetRequest(
  emailInput: string
): Promise<{ email: string; resetToken: string } | null> {
  const email = String(emailInput || '').trim().toLowerCase();
  if (!email) return null;

  const user = await prisma.userAccount.findUnique({ where: { email } });
  if (!user) return null;

  const now = new Date();
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      OR: [
        { usedAt: { not: null } },
        { expiresAt: { lt: now } },
      ],
    },
  });

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      email: user.email,
      tokenHash,
      expiresAt,
    },
  });

  return { email: user.email, resetToken };
}

export async function consumePasswordResetToken(payload: {
  token: string;
  newPassword: string;
}): Promise<{ id: string; name: string; email: string } | null> {
  const token = String(payload.token || '').trim();
  const newPassword = String(payload.newPassword || '');
  if (!token || !newPassword) return null;
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const now = new Date();

  const reset = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!reset) return null;
  if (reset.usedAt) return null;
  if (reset.expiresAt.getTime() < now.getTime()) return null;

  const passwordHash = await hashPassword(newPassword);

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.userAccount.update({
      where: { id: reset.userId },
      data: { passwordHash },
    });

    await tx.passwordResetToken.update({
      where: { id: reset.id },
      data: { usedAt: now },
    });

    await tx.passwordResetToken.deleteMany({
      where: {
        userId: reset.userId,
        id: { not: reset.id },
      },
    });

    return updated;
  });

  return { id: user.id, name: user.name, email: user.email };
}

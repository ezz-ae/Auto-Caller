import crypto from 'crypto';

function getSigningSecret(): string {
  return String(
    process.env.TTS_SIGNING_SECRET ||
    process.env.APP_SESSION_SECRET ||
    process.env.CRON_SECRET ||
    ''
  ).trim();
}

function createSignature(payload: string): string {
  const secret = getSigningSecret();
  if (!secret) return '';
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function buildPayload(params: {
  script: string;
  voiceId: string;
  language: string;
  userId: string;
  exp: number;
}): string {
  return [
    params.script,
    params.voiceId,
    params.language,
    params.userId,
    String(params.exp),
  ].join('|');
}

export function createSignedTtsParams(input: {
  script: string;
  voiceId: string;
  language: string;
  userId: string;
  ttlSeconds?: number;
}): { exp: number; sig: string } {
  const ttlSeconds = Math.max(30, Math.min(600, Number(input.ttlSeconds || 180)));
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = buildPayload({
    script: input.script,
    voiceId: input.voiceId,
    language: input.language,
    userId: input.userId,
    exp,
  });
  const sig = createSignature(payload);
  return { exp, sig };
}

export function verifySignedTtsParams(input: {
  script: string;
  voiceId: string;
  language: string;
  userId: string;
  exp: number;
  sig: string;
}): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(input.exp) || input.exp < now) return false;
  if (!input.sig || !input.userId) return false;
  const payload = buildPayload({
    script: input.script,
    voiceId: input.voiceId,
    language: input.language,
    userId: input.userId,
    exp: input.exp,
  });
  const expected = createSignature(payload);
  if (!expected) return process.env.NODE_ENV !== 'production';
  return safeEqual(expected, input.sig);
}

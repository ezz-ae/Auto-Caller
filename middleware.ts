import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE_NAME,
  isAccountAuthEnabled,
  isAccessProtectionEnabled,
  isAuthorizedWithToken,
  shouldSkipAuthPath,
} from './src/lib/access-control';

const SESSION_COOKIE_NAME = 'acp_session';
const SESSION_VERSION = 1;

interface SessionPayload {
  v: number;
  userId: string;
  email: string;
  exp: number;
}

function getSessionSecret(): string {
  const explicitSecret = String(process.env.APP_SESSION_SECRET || '').trim();
  if (explicitSecret) return explicitSecret;

  const fallbackSecret = String(process.env.APP_ACCESS_PASSWORD || process.env.CRON_SECRET || '').trim();
  if (fallbackSecret) return fallbackSecret;

  const dbUrl = String(process.env.DATABASE_URL || '').trim();
  if (dbUrl) return dbUrl;

  return 'dev-only-session-secret';
}

function fromBase64url(input: string): string | null {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4 || 4)) % 4);
    const binary = atob(base64 + padding);
    return binary;
  } catch {
    return null;
  }
}

function toBase64url(input: Uint8Array): string {
  let binary = '';
  for (const byte of input) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifySessionTokenInEdge(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  try {
    const secret = getSessionSecret();
    const keyData = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedPayload));
    const expectedSignature = toBase64url(new Uint8Array(signed));
    if (!safeEqual(signature, expectedSignature)) return null;

    const payloadBinary = fromBase64url(encodedPayload);
    if (!payloadBinary) return null;
    const payloadJson = new TextDecoder().decode(
      Uint8Array.from(payloadBinary, char => char.charCodeAt(0))
    );
    const payload = JSON.parse(payloadJson) as SessionPayload;

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

export async function middleware(request: NextRequest) {
  if (!isAccessProtectionEnabled()) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  if (shouldSkipAuthPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionTokenInEdge(sessionToken);

  if (isAccountAuthEnabled() && Boolean(session?.userId)) {
    return NextResponse.next();
  }

  if (isAuthorizedWithToken(token)) {
    return NextResponse.next();
  }

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

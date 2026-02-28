export const ACCESS_COOKIE_NAME = 'acp_auth';

export function isLegacyAuthAllowed() {
  const forced = String(process.env.ALLOW_LEGACY_AUTH || '').trim().toLowerCase();
  if (forced === 'true') return true;
  if (forced === 'false') return false;
  return !isAccountAuthEnabled();
}

export function isAccessProtectionEnabled() {
  const forced = String(process.env.AUTH_REQUIRED || '').trim().toLowerCase();
  if (forced === 'false') return false;
  if (forced === 'true') return true;

  if (isAccountAuthEnabled()) return true;
  return Boolean(process.env.APP_ACCESS_PASSWORD);
}

export function isAccountAuthEnabled() {
  const mode = String(process.env.AUTH_MODE || '').trim().toLowerCase();
  if (mode === 'legacy') return false;
  if (mode === 'accounts') return true;
  return Boolean(process.env.DATABASE_URL);
}

export function getExpectedAuthToken() {
  const username = process.env.APP_ACCESS_USERNAME || 'admin';
  const password = process.env.APP_ACCESS_PASSWORD || '';
  return `${username}:${password}`;
}

export function isAuthorizedWithToken(token?: string | null) {
  if (!isAccessProtectionEnabled()) return true;
  if (!isLegacyAuthAllowed()) return false;
  return token === getExpectedAuthToken();
}

export function shouldSkipAuthPath(pathname: string) {
  if (pathname === '/api' || pathname === '/api/') return true;
  if (pathname.startsWith('/api/')) {
    const publicApiPrefixes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/session',
      '/api/auth/logout',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/calls/answer',
      '/api/calls/status',
      '/api/calls/recording-complete',
      '/api/calls/handle-forward',
      '/api/calls/voicemail-recorded',
      '/api/calls/transcription',
      '/api/calls/tts',
      '/api/transcriptions',
      '/api/cron/dispatch-scheduled',
      '/api/paypal/webhook',
    ];

    return publicApiPrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/favicon')) return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/forgot-password')) return true;
  if (pathname.startsWith('/reset-password')) return true;
  if (pathname === '/') return true;
  if (pathname.startsWith('/features')) return true;
  if (pathname.startsWith('/how-it-works')) return true;
  if (pathname.startsWith('/docs')) return true;
  if (pathname.startsWith('/faq')) return true;
  if (pathname.startsWith('/pricing')) return true;
  return false;
}

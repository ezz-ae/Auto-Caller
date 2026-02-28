export const ACCESS_COOKIE_NAME = 'acp_auth';

export function isAccessProtectionEnabled() {
  return Boolean(process.env.APP_ACCESS_PASSWORD);
}

export function getExpectedAuthToken() {
  const username = process.env.APP_ACCESS_USERNAME || 'admin';
  const password = process.env.APP_ACCESS_PASSWORD || '';
  return `${username}:${password}`;
}

export function isAuthorizedWithToken(token?: string | null) {
  if (!isAccessProtectionEnabled()) return true;
  return token === getExpectedAuthToken();
}

export function shouldSkipAuthPath(pathname: string) {
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/favicon')) return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname === '/') return true;
  if (pathname.startsWith('/features')) return true;
  if (pathname.startsWith('/how-it-works')) return true;
  if (pathname.startsWith('/docs')) return true;
  if (pathname.startsWith('/faq')) return true;
  if (pathname.startsWith('/pricing')) return true;
  return false;
}

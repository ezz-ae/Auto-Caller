import { NextRequest } from 'next/server';
import { ACCESS_COOKIE_NAME, isAuthorizedWithToken } from '@/lib/access-control';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/account-auth';

export function getUserIdFromRequest(
  request: NextRequest,
  options: { allowQuery?: boolean; fallbackToDefault?: boolean } = {}
): string | null {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);
  if (session?.userId) return session.userId;

  const legacyToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (isAuthorizedWithToken(legacyToken)) return 'default';

  if (options.allowQuery) {
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    if (queryUserId) return queryUserId;
  }

  if (options.fallbackToDefault) return 'default';
  return null;
}

export function requireUserIdFromRequest(
  request: NextRequest,
  options: { allowQuery?: boolean; fallbackToDefault?: boolean } = {}
): string {
  const userId = getUserIdFromRequest(request, options);
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

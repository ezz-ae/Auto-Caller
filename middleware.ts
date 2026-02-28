import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE_NAME,
  isAccountAuthEnabled,
  isAccessProtectionEnabled,
  isAuthorizedWithToken,
  shouldSkipAuthPath,
} from './src/lib/access-control';

const SESSION_COOKIE_NAME = 'acp_session';

export function middleware(request: NextRequest) {
  if (!isAccessProtectionEnabled()) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  if (shouldSkipAuthPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (isAccountAuthEnabled() && Boolean(sessionToken)) {
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

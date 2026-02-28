import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE_NAME,
  isAccountAuthEnabled,
  getExpectedAuthToken,
  isAccessProtectionEnabled,
  isAuthorizedWithToken,
} from '@/lib/access-control';
import { authenticateUserAccount, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/account-auth';

export async function POST(request: NextRequest) {
  try {
    if (!isAccessProtectionEnabled()) {
      return NextResponse.json({ success: true, disabled: true });
    }

    const body = await request.json();
    const username = String(body?.username || body?.email || '').trim();
    const password = String(body?.password || '');
    const accountMode = isAccountAuthEnabled();

    if (accountMode) {
      const user = await authenticateUserAccount({ email: username, password });
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
      response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      response.cookies.set(ACCESS_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    const token = `${username}:${password}`;
    if (!isAuthorizedWithToken(token)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ACCESS_COOKIE_NAME, getExpectedAuthToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}

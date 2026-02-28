import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE_NAME,
  getExpectedAuthToken,
  isAccessProtectionEnabled,
  isAuthorizedWithToken,
} from '@/lib/access-control';

export async function POST(request: NextRequest) {
  try {
    if (!isAccessProtectionEnabled()) {
      return NextResponse.json({ success: true, disabled: true });
    }

    const body = await request.json();
    const username = String(body?.username || '').trim();
    const password = String(body?.password || '');
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

    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}

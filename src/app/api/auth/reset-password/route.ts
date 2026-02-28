import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE_NAME, isAccountAuthEnabled } from '@/lib/access-control';
import { consumePasswordResetToken, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/account-auth';

export async function POST(request: NextRequest) {
  try {
    if (!isAccountAuthEnabled()) {
      return NextResponse.json({ error: 'Password reset is unavailable in legacy mode' }, { status: 400 });
    }

    const body = await request.json();
    const token = String(body?.token || '').trim();
    const password = String(body?.password || '');
    const rememberDevice = body?.rememberDevice !== false;

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    const user = await consumePasswordResetToken({ token, newPassword: password });
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user, rememberDevice ? 30 : 1), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      ...(rememberDevice ? { maxAge: 60 * 60 * 24 * 30 } : {}),
    });
    response.cookies.set(ACCESS_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    const message = String(error?.message || '');
    if (message.toLowerCase().includes('at least 8')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error('Reset password failed:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}

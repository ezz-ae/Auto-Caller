import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE_NAME, isAccountAuthEnabled } from '@/lib/access-control';
import { createSessionToken, createUserAccount, SESSION_COOKIE_NAME } from '@/lib/account-auth';

export async function POST(request: NextRequest) {
  try {
    if (!isAccountAuthEnabled()) {
      return NextResponse.json({ error: 'Account registration is disabled' }, { status: 400 });
    }

    const body = await request.json();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const user = await createUserAccount({ name, email, password });
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, createSessionToken({ id: user.id, email: user.email }), {
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
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }
    console.error('Register failed:', error);
    return NextResponse.json({ error: error?.message || 'Failed to register' }, { status: 500 });
  }
}

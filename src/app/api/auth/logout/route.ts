import { NextResponse } from 'next/server';
import { ACCESS_COOKIE_NAME } from '@/lib/access-control';
import { SESSION_COOKIE_NAME } from '@/lib/account-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ACCESS_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

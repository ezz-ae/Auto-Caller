import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE_NAME, isAccountAuthEnabled, isAuthorizedWithToken } from '@/lib/access-control';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/account-auth';

export async function GET(request: NextRequest) {
  try {
    const accountMode = isAccountAuthEnabled();
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);
    if (session?.userId) {
      return NextResponse.json({
        authenticated: true,
        accountMode: true,
        user: {
          id: session.userId,
          email: session.email,
        },
      });
    }

    const legacyToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
    if (!accountMode && isAuthorizedWithToken(legacyToken)) {
      return NextResponse.json({
        authenticated: true,
        accountMode: false,
        user: {
          id: 'default',
          email: process.env.APP_ACCESS_USERNAME || 'admin',
        },
      });
    }

    return NextResponse.json({
      authenticated: false,
      accountMode,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, accountMode: isAccountAuthEnabled() });
  }
}

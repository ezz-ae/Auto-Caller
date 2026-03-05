import { NextRequest, NextResponse } from 'next/server';
import { isAccountAuthEnabled } from '@/lib/access-control';
import { createPasswordResetRequest } from '@/lib/account-auth';
import { resolvePublicAppUrl } from '@/lib/public-app-url';

async function sendPasswordResetEmail(payload: {
  to: string;
  resetUrl: string;
}): Promise<boolean> {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || '').trim();
  const replyTo = String(process.env.RESEND_REPLY_TO || '').trim();
  if (!apiKey || !from) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      reply_to: replyTo || undefined,
      subject: 'Reset your Callware password',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <p>You requested a password reset for your Callware account.</p>
          <p><a href="${payload.resetUrl}" style="background:#10b981;color:#04140f;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a></p>
          <p>This link expires in 30 minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });

  return res.ok;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAccountAuthEnabled()) {
      return NextResponse.json({ error: 'Password reset is unavailable in legacy mode' }, { status: 400 });
    }

    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const reset = await createPasswordResetRequest(email);
    if (!reset) {
      return NextResponse.json({
        success: true,
        message: 'If this email exists, a reset link has been sent.',
      });
    }

    const appUrl = resolvePublicAppUrl(request);
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(reset.resetToken)}`;
    const emailSent = await sendPasswordResetEmail({ to: reset.email, resetUrl });

    if (!emailSent) {
      console.info('Password reset email not sent (email provider missing).');
    }

    const response: Record<string, unknown> = {
      success: true,
      message: 'If this email exists, a reset link has been sent.',
    };
    if (!emailSent && process.env.NODE_ENV !== 'production') {
      response.devResetUrl = resetUrl;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Forgot password failed:', error);
    return NextResponse.json({ error: 'Failed to process password reset request' }, { status: 500 });
  }
}

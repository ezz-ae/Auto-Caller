import { NextRequest, NextResponse } from 'next/server';
import {
  checkDemoEligibility,
  createDemoSession,
  hashIpAddress,
  recordDemoAttempt,
  attachDemoCallSid,
  demoLimits,
} from '@/lib/demo-call-store';
import {
  createDemoOutboundCall,
  getClientIp,
  isDemoCallEnabled,
  normalizePhoneNumber,
} from '@/lib/demo-call';

export async function POST(request: NextRequest) {
  try {
    if (!isDemoCallEnabled()) {
      return NextResponse.json({ error: 'Demo call is temporarily disabled.' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const phoneRaw = String(body?.phoneNumber || '').trim();
    const leadName = String(body?.name || '').trim();
    const consent = body?.consent === true;
    const honeypot = String(body?.website || '').trim();

    if (honeypot) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (!consent) {
      return NextResponse.json({ error: 'Consent is required to receive an automated demo call.' }, { status: 400 });
    }

    const phoneNumber = normalizePhoneNumber(phoneRaw);
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Enter a valid phone number with country code.' }, { status: 400 });
    }

    const ipAddress = getClientIp(request.headers);
    const ipHash = hashIpAddress(ipAddress);

    const eligibility = await checkDemoEligibility(phoneNumber, ipHash);
    if (!eligibility.allowed) {
      await recordDemoAttempt({
        phoneNumber,
        ipHash,
        status: 'blocked',
        reason: eligibility.code,
      });

      return NextResponse.json(
        {
          error: eligibility.message,
          code: eligibility.code,
          retryAfterSeconds: eligibility.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(60, eligibility.retryAfterSeconds || 60)),
          },
        }
      );
    }

    const session = await createDemoSession({
      phoneNumber,
      ipHash,
      leadName,
      consentAccepted: true,
    });

    const call = await createDemoOutboundCall({
      to: phoneNumber,
      sessionId: session.id,
    });

    await attachDemoCallSid(session.id, call.sid);
    await recordDemoAttempt({
      phoneNumber,
      ipHash,
      status: 'started',
      reason: 'CALL_CREATED',
    });

    return NextResponse.json({
      success: true,
      message: 'Demo call is on the way. Keep your phone nearby.',
      callSid: call.sid,
      fromNumber: call.fromNumber,
      limits: {
        perIp15m: demoLimits.maxAttemptsPerIpWindow,
        phoneCooldownHours: Math.round(demoLimits.phoneCooldownSeconds / 3600),
      },
    });
  } catch (error) {
    console.error('demo-call/start failed', error);
    return NextResponse.json({ error: 'Failed to start demo call. Please try again.' }, { status: 500 });
  }
}

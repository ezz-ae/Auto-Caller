import { NextRequest, NextResponse } from 'next/server';
import { getDemoSessionByCallSid, recordDemoAttempt, setDemoSessionStatus } from '@/lib/demo-call-store';
import { formDataToParams, isValidTwilioWebhook } from '@/lib/twilio-webhook-auth';

function mapTwilioStatus(status: string): 'queued' | 'in_progress' | 'completed' | 'failed' | 'no_answer' {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'completed') return 'completed';
  if (normalized === 'no-answer' || normalized === 'canceled') return 'no_answer';
  if (normalized === 'busy' || normalized === 'failed') return 'failed';
  if (normalized === 'in-progress' || normalized === 'ringing' || normalized === 'answered') return 'in_progress';
  return 'queued';
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const validWebhook = await isValidTwilioWebhook({
      request,
      formParams: formDataToParams(form),
      allowDemoToken: true,
    });
    if (!validWebhook) {
      return NextResponse.json({ error: 'Invalid Twilio signature' }, { status: 403 });
    }

    const callSid = String(form.get('CallSid') || '').trim();
    const callStatus = String(form.get('CallStatus') || '').trim();

    if (!callSid) {
      return NextResponse.json({ success: true });
    }

    const session = await getDemoSessionByCallSid(callSid);
    if (!session) {
      return NextResponse.json({ success: true });
    }

    const mappedStatus = mapTwilioStatus(callStatus);
    await setDemoSessionStatus(callSid, mappedStatus);

    if (mappedStatus === 'completed' || mappedStatus === 'failed' || mappedStatus === 'no_answer') {
      await recordDemoAttempt({
        phoneNumber: session.phoneNumber,
        ipHash: session.ipHash,
        status: mappedStatus === 'completed' ? 'completed' : mappedStatus,
        reason: callStatus || mappedStatus,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('demo-call/status failed', error);
    return NextResponse.json({ success: true });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { updateCampaignResultByCallSid } from '@/lib/store';
import { syncParentFollowUpStatusFromChild } from '@/lib/follow-up-status';
import { CallResult } from '@/lib/types';
import { formDataToParams, isValidTwilioWebhook } from '@/lib/twilio-webhook-auth';

function mapDialStatus(dialStatus: string): CallResult['status'] {
  const statusMap: Record<string, CallResult['status']> = {
    completed: 'forwarded',
    answered: 'forwarded',
    busy: 'no-answer',
    failed: 'failed',
    'no-answer': 'no-answer',
    canceled: 'failed',
  };

  return statusMap[dialStatus] || 'connected';
}

async function handleForward(request: NextRequest) {
  const formData = await request.formData();
  const url = new URL(request.url);
  const userId = String(url.searchParams.get('userId') || formData.get('userId') || '').trim() || undefined;
  const validWebhook = await isValidTwilioWebhook({
    request,
    formParams: formDataToParams(formData),
    userId,
  });
  if (!validWebhook) {
    return NextResponse.json({ error: 'Invalid Twilio signature' }, { status: 403 });
  }

  const callSid = (url.searchParams.get('callSid') || formData.get('CallSid') || '') as string;
  const dialCallStatus = (formData.get('DialCallStatus') || formData.get('CallStatus') || '') as string;
  const dialCallDuration = (formData.get('DialCallDuration') || formData.get('CallDuration') || '') as string;

  if (callSid) {
    const patch: Partial<CallResult> = {
      status: mapDialStatus(dialCallStatus),
      callComment:
        dialCallStatus === 'completed' || dialCallStatus === 'answered'
          ? 'Transferred to human team'
          : dialCallStatus
            ? `Transfer leg status: ${dialCallStatus}`
            : 'Transfer attempt finished',
    };

    if (dialCallDuration) {
      const duration = parseInt(dialCallDuration, 10);
      if (!Number.isNaN(duration)) {
        patch.duration = duration;
      }
    }

    const updated = await updateCampaignResultByCallSid(callSid, patch);
    if (updated.updated) {
      await syncParentFollowUpStatusFromChild({
        campaignId: updated.campaignId,
        resultId: updated.resultId,
        childStatus: patch.status || 'connected',
      });
    }
  }

  const response = new twilio.twiml.VoiceResponse();
  response.hangup();

  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

export async function GET(request: NextRequest) {
  return handleForward(request);
}

export async function POST(request: NextRequest) {
  return handleForward(request);
}

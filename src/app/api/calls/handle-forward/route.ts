import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { updateCampaignResultByCallSid } from '@/lib/store';
import { CallResult } from '@/lib/types';

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

  const callSid = (url.searchParams.get('callSid') || formData.get('CallSid') || '') as string;
  const dialCallStatus = (formData.get('DialCallStatus') || formData.get('CallStatus') || '') as string;
  const dialCallDuration = (formData.get('DialCallDuration') || formData.get('CallDuration') || '') as string;

  if (callSid) {
    const patch: Partial<CallResult> = {
      status: mapDialStatus(dialCallStatus),
    };

    if (dialCallDuration) {
      const duration = parseInt(dialCallDuration, 10);
      if (!Number.isNaN(duration)) {
        patch.duration = duration;
      }
    }

    await updateCampaignResultByCallSid(callSid, patch);
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

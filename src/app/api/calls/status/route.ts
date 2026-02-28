import { NextRequest, NextResponse } from 'next/server';
import { updateCampaignResultByCallSid } from '@/lib/store';
import { CallResult } from '@/lib/types';

// Handle call status updates from Twilio
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const errorCode = formData.get('ErrorCode') as string | null;
    const errorMessage = formData.get('ErrorMessage') as string | null;
    
    console.log('Call status update:', {
      callSid,
      callStatus,
      callDuration,
      from,
      to,
    });
    
    // Map Twilio status to our status
    const statusMap: Record<string, CallResult['status']> = {
      'completed': 'connected',
      'answered': 'connected',
      'no-answer': 'no-answer',
      'failed': 'failed',
      'busy': 'no-answer',
      'ringing': 'calling',
      'in-progress': 'connected',
    };
    
    const mappedStatus = statusMap[callStatus] || 'pending';

    const patch: Partial<CallResult> = {
      status: mappedStatus,
    };

    if (callDuration) {
      const duration = parseInt(callDuration, 10);
      if (!Number.isNaN(duration)) {
        patch.duration = duration;
      }
    }

    if (errorCode || errorMessage) {
      patch.error = [errorCode, errorMessage].filter(Boolean).join(': ');
    }

    const updated = updateCampaignResultByCallSid(callSid, patch);
    
    return NextResponse.json({ 
      success: true,
      callSid,
      status: mappedStatus,
      matchedCampaign: updated.updated,
    });
    
  } catch (error) {
    console.error('Status callback error:', error);
    return NextResponse.json({ error: 'Failed to process status' }, { status: 500 });
  }
}

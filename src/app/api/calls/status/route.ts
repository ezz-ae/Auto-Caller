import { NextRequest, NextResponse } from 'next/server';
import { getCampaign, updateCampaignResult, saveCampaign } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
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
    
    // Find the campaign that contains this call
    // In a production app, we'd store callSid -> campaign mapping
    // For now, we'll update the campaign based on the "to" number
    
    // Update call result if we can find it
    // This is a simplified version - in production you'd want a proper call tracking system
    
    return NextResponse.json({ 
      success: true,
      callSid,
      status: mappedStatus,
    });
    
  } catch (error) {
    console.error('Status callback error:', error);
    return NextResponse.json({ error: 'Failed to process status' }, { status: 500 });
  }
}

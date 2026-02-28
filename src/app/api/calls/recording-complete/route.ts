import { NextRequest, NextResponse } from 'next/server';
import { saveRecording, getRecordingByCallSid, findCampaignResultByCallSid, getSettings } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import { Recording } from '@/lib/types';

// Handle recording completion from Twilio
export async function POST(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get('userId') || undefined;
    const formData = await request.formData();
    
    const callSid = formData.get('CallSid') as string;
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;
    const recordingStatus = formData.get('RecordingStatus') as string;

    const matchedCall = await findCampaignResultByCallSid(callSid);
    const campaignId = matchedCall?.campaign.id || '';
    const phoneNumber = matchedCall?.result.phoneNumber || '';
    
    console.log('Recording completed:', {
      callSid,
      recordingSid,
      recordingUrl,
      recordingDuration,
      recordingStatus,
      campaignId,
      phoneNumber,
    });
    
    // Check if we already have a recording for this call
    const existingRecording = await getRecordingByCallSid(callSid, userId);
    
    if (existingRecording) {
      // Update existing recording
      existingRecording.recordingUrl = recordingUrl.endsWith('.mp3') ? recordingUrl : `${recordingUrl}.mp3`;
      existingRecording.duration = parseInt(recordingDuration) || 0;
      existingRecording.status = 'completed';
      existingRecording.campaignId = existingRecording.campaignId || campaignId;
      existingRecording.phoneNumber = existingRecording.phoneNumber || phoneNumber;
      existingRecording.userId = existingRecording.userId || userId || matchedCall?.campaign.userId || 'default';
      await saveRecording(existingRecording);
      
      return NextResponse.json({ success: true, recording: existingRecording });
    }
    
    // Create new recording record
    const recording: Recording = {
      id: uuidv4(),
      userId: userId || matchedCall?.campaign.userId || 'default',
      callSid,
      campaignId,
      phoneNumber,
      recordingSid,
      recordingUrl: recordingUrl.endsWith('.mp3') ? recordingUrl : `${recordingUrl}.mp3`,
      duration: parseInt(recordingDuration) || 0,
      status: 'completed',
      createdAt: new Date(),
    };
    
    await saveRecording(recording);
    
    // Trigger transcription if enabled
    const settings = await getSettings(recording.userId);
    if (settings.transcribeCalls) {
      const transcribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/transcriptions`;

      // Fire and forget transcription
      fetch(transcribeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.CRON_SECRET || '',
        },
        body: JSON.stringify({ recordingId: recording.id, useOpenAI: true, userId: recording.userId }),
      }).catch(err => console.error('Failed to start transcription:', err));
    }
    
    return NextResponse.json({ 
      success: true, 
      recording,
    });
    
  } catch (error) {
    console.error('Recording callback error:', error);
    return NextResponse.json({ error: 'Failed to process recording' }, { status: 500 });
  }
}

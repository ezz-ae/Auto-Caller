import { NextRequest, NextResponse } from 'next/server';
import { saveRecording, getRecordingByCallSid } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import { Recording } from '@/lib/types';

// Handle recording completion from Twilio
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const callSid = formData.get('CallSid') as string;
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;
    const recordingStatus = formData.get('RecordingStatus') as string;
    
    console.log('Recording completed:', {
      callSid,
      recordingSid,
      recordingUrl,
      recordingDuration,
      recordingStatus,
    });
    
    // Check if we already have a recording for this call
    const existingRecording = getRecordingByCallSid(callSid);
    
    if (existingRecording) {
      // Update existing recording
      existingRecording.recordingUrl = recordingUrl;
      existingRecording.duration = parseInt(recordingDuration) || 0;
      existingRecording.status = 'completed';
      saveRecording(existingRecording);
      
      return NextResponse.json({ success: true, recording: existingRecording });
    }
    
    // Create new recording record
    const recording: Recording = {
      id: uuidv4(),
      callSid,
      campaignId: '', // Will be linked later
      phoneNumber: '',
      recordingSid,
      recordingUrl: `${recordingUrl}.mp3`,
      duration: parseInt(recordingDuration) || 0,
      status: 'completed',
      createdAt: new Date(),
    };
    
    saveRecording(recording);
    
    // Trigger transcription if enabled
    const transcribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/transcriptions/process`;
    
    // Fire and forget transcription
    fetch(transcribeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordingId: recording.id }),
    }).catch(err => console.error('Failed to start transcription:', err));
    
    return NextResponse.json({ 
      success: true, 
      recording,
    });
    
  } catch (error) {
    console.error('Recording callback error:', error);
    return NextResponse.json({ error: 'Failed to process recording' }, { status: 500 });
  }
}

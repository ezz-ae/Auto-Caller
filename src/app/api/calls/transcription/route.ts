import { NextRequest, NextResponse } from 'next/server';
import { getRecordingByCallSid, updateRecordingTranscript } from '@/lib/store';
import { Transcript } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Handle transcription callback from Twilio
export async function POST(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get('userId') || undefined;
    const formData = await request.formData();
    
    const callSid = formData.get('CallSid') as string;
    const transcriptionSid = formData.get('TranscriptionSid') as string;
    const transcriptionText = formData.get('TranscriptionText') as string;
    const transcriptionStatus = formData.get('TranscriptionStatus') as string;
    const recordingSid = formData.get('RecordingSid') as string;
    
    console.log('Transcription received:', {
      callSid,
      transcriptionSid,
      transcriptionText: transcriptionText?.substring(0, 100) + '...',
      transcriptionStatus,
    });
    
    if (transcriptionStatus !== 'completed' || !transcriptionText) {
      return NextResponse.json({ success: false, reason: 'Transcription not ready' });
    }
    
    // Find the recording
    const recording = await getRecordingByCallSid(callSid, userId);
    
    if (!recording) {
      console.log('No recording found for call:', callSid);
      return NextResponse.json({ success: false, reason: 'No recording found' });
    }
    
    // Create transcript
    const transcript: Transcript = {
      id: uuidv4(),
      userId: recording.userId || userId || 'default',
      recordingId: recording.id,
      text: transcriptionText,
      confidence: 0.85, // Twilio doesn't provide confidence
      createdAt: new Date(),
    };
    
    // Update recording with transcript
    await updateRecordingTranscript(recording.id, transcript, transcript.userId);
    
    return NextResponse.json({ 
      success: true, 
      transcript,
    });
    
  } catch (error) {
    console.error('Transcription callback error:', error);
    return NextResponse.json({ error: 'Failed to process transcription' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getRecording, updateRecordingTranscript, getSettings } from '@/lib/store';
import { processRecording } from '@/lib/transcription';
import { downloadRecording as downloadTwilioRecording } from '@/lib/twilio';

// Get all transcriptions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get('recordingId');
    
    if (recordingId) {
      const recording = getRecording(recordingId);
      return NextResponse.json({ 
        transcript: recording?.transcript || null 
      });
    }
    
    // Return all transcripts
    const recordings = await import('@/lib/store').then(m => m.getAllRecordings());
    const transcripts = recordings
      .filter(r => r.transcript)
      .map(r => ({
        recordingId: r.id,
        phoneNumber: r.phoneNumber,
        callSid: r.callSid,
        ...r.transcript,
      }));
    
    return NextResponse.json({ transcripts });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get transcriptions' }, { status: 500 });
  }
}

// Process a recording transcription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordingId, useOpenAI } = body;
    
    if (!recordingId) {
      return NextResponse.json({ error: 'Recording ID required' }, { status: 400 });
    }
    
    const recording = getRecording(recordingId);
    
    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    if (!recording.recordingSid) {
      return NextResponse.json({ error: 'No recording SID' }, { status: 400 });
    }
    
    // Check if we have OpenAI API key for high-quality transcription
    const settings = getSettings();
    
    if (useOpenAI && settings.openaiApiKey) {
      // Download recording from Twilio
      console.log('Downloading recording for Whisper transcription...');
      const audioBuffer = await downloadTwilioRecording(recording.recordingSid);
      
      // Process with OpenAI Whisper
      console.log('Transcribing with OpenAI Whisper...');
      const transcript = await processRecording(audioBuffer, {
        phoneNumber: recording.phoneNumber,
      });
      
      // Update recording with transcript
      transcript.recordingId = recording.id;
      updateRecordingTranscript(recording.id, transcript);
      
      return NextResponse.json({ 
        success: true, 
        transcript,
        message: 'Transcription completed with OpenAI Whisper',
      });
    }
    
    // Fallback: Use Twilio's built-in transcription (already done)
    if (recording.transcript) {
      return NextResponse.json({ 
        success: true, 
        transcript: recording.transcript,
        message: 'Using Twilio transcription',
      });
    }
    
    return NextResponse.json({ 
      error: 'No transcript available. Enable OpenAI for high-quality transcription.',
    }, { status: 400 });
    
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      error: 'Failed to process transcription',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

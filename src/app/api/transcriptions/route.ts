import { NextRequest, NextResponse } from 'next/server';
import { getRecording, updateRecordingTranscript, getSettings } from '@/lib/store';
import { processRecording } from '@/lib/transcription';
import { downloadRecording as downloadTwilioRecording } from '@/lib/twilio';
import { getUserIdFromRequest } from '@/lib/request-user';

// Get all transcriptions
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get('recordingId');
    
    if (recordingId) {
      const recording = await getRecording(recordingId, userId);
      return NextResponse.json({ 
        transcript: recording?.transcript || null 
      });
    }
    
    // Return all transcripts
    const recordings = await import('@/lib/store').then(m => m.getAllRecordings(userId));
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
    const authUserId = getUserIdFromRequest(request);
    const internalSecret = request.headers.get('x-internal-secret') || '';
    const trustedInternal = !!process.env.CRON_SECRET && internalSecret === process.env.CRON_SECRET;
    const internalUserId = trustedInternal ? String(body?.userId || '').trim() : '';
    const userId = authUserId || internalUserId;
    const { recordingId, useOpenAI, useAI } = body;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!recordingId) {
      return NextResponse.json({ error: 'Recording ID required' }, { status: 400 });
    }
    
    const recording = await getRecording(recordingId, userId);
    
    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    if (!recording.recordingSid) {
      return NextResponse.json({ error: 'No recording SID' }, { status: 400 });
    }
    
    // Check if we have AI provider for high-quality transcription + analysis
    const settings = await getSettings(userId);
    const googleApiKey =
      process.env.MANAGED_GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      '';
    const openAIApiKey =
      settings.openaiApiKey ||
      process.env.OPENAI_API_KEY ||
      process.env.MANAGED_OPENAI_API_KEY ||
      '';
    const shouldUseAI = typeof useAI === 'boolean' ? useAI : !!useOpenAI;

    if (shouldUseAI && (googleApiKey || openAIApiKey)) {
      // Download recording from Twilio
      console.log('Downloading recording for AI transcription...');
      const audioBuffer = await downloadTwilioRecording(recording.recordingSid);
      
      // Process with AI provider (Google primary, OpenAI fallback)
      console.log('Transcribing with AI provider...');
      const transcript = await processRecording(audioBuffer, {
        phoneNumber: recording.phoneNumber,
        userId,
      });
      
      // Update recording with transcript
      transcript.recordingId = recording.id;
      transcript.userId = userId;
      await updateRecordingTranscript(recording.id, transcript, userId);
      
      return NextResponse.json({ 
        success: true, 
        transcript,
        message: googleApiKey ? 'Transcription completed with Google AI' : 'Transcription completed with OpenAI',
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
      error: 'No transcript available. Configure GOOGLE_AI_API_KEY (recommended) or OPENAI_API_KEY for high-quality transcription.',
    }, { status: 400 });
    
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      error: 'Failed to process transcription',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

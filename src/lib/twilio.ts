// Auto Caller Pro - Twilio Service (Enhanced with Recording & Transcription)

import twilio from 'twilio';
import { getSettings } from './store';

let twilioClient: ReturnType<typeof twilio> | null = null;

export function isTwilioNativeVoice(voiceId?: string): boolean {
  if (!voiceId) return true;
  return voiceId === 'alice' || voiceId.startsWith('Polly.');
}

function resolveTwilioVoice(voiceId?: string): string {
  if (!voiceId) return 'alice';
  return isTwilioNativeVoice(voiceId) ? voiceId : 'alice';
}

async function getClient() {
  if (twilioClient) return twilioClient;
  
  const settings = await getSettings();
  
  if (!settings.twilioAccountSid || !settings.twilioAuthToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  twilioClient = twilio(settings.twilioAccountSid, settings.twilioAuthToken);
  return twilioClient;
}

export function resetClient() {
  twilioClient = null;
}

// Generate TwiML for call with TTS, recording, and forwarding
export function generateCallTwiML(
  script: string, 
  forwardToNumber: string, 
  callSid: string,
  options: {
    record?: boolean;
    transcribe?: boolean;
    transcriptionCallback?: string;
    webSocketUrl?: string;
    language?: string;
    voiceId?: string;
    ttsAudioUrl?: string;
  } = {}
): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  if (options.webSocketUrl) {
    response.start().stream({
      url: options.webSocketUrl,
    });
  }
  
  // Pause slightly at start
  response.pause({ length: 1 });
  
  if (options.ttsAudioUrl) {
    response.play(options.ttsAudioUrl);
  } else {
    response.say({
      voice: resolveTwilioVoice(options.voiceId) as any,
      language: (options.language || 'en-US') as any,
    }, script);
  }
  
  // Pause before forwarding
  response.pause({ length: 1 });
  
  // Say connecting message
  response.say('Connecting you now.');
  
  // Forward the call to user's phone with recording
  const dialOptions: Record<string, unknown> = {
    timeout: 30,
    action: `/api/calls/handle-forward?callSid=${callSid}`,
    method: 'POST',
  };
  
  // Enable call recording on the forwarded leg
  if (options.record) {
    dialOptions.record = 'record-from-ringing-dual';
    dialOptions.action = `/api/calls/handle-forward?callSid=${callSid}&record=true`;
  }
  
  response.dial(dialOptions, forwardToNumber);
  
  return response.toString();
}

// Generate TwiML for voicemail with recording
export function generateVoicemailTwiML(script: string, callSid: string): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  
  response.pause({ length: 1 });
  response.say({
    voice: 'alice',
    language: 'en-US',
  }, script);
  
  response.say('Please leave a message after the beep.');
  response.record({
    maxLength: 120,
    action: `/api/calls/voicemail-recorded?callSid=${callSid}`,
    method: 'POST',
    transcribe: true,
    transcribeCallback: `/api/calls/transcription?callSid=${callSid}`,
    playBeep: true,
  });
  
  return response.toString();
}

// Make a call with recording options
export async function makeCall(
  to: string,
  script: string,
  forwardToNumber: string,
  webhookUrl: string,
  options: {
    record?: boolean;
    transcribe?: boolean;
    language?: string;
    callerIdentityId?: string;
    callerName?: string;
    callerPosition?: string;
    voiceId?: string;
    fromNumber?: string;
    mode?: 'conversation' | 'legacy';
  } = {}
): Promise<{ sid: string; status: string }> {
  const client = await getClient();
  const settings = await getSettings();

  const fromNumber = options.fromNumber || settings.twilioPhoneNumber;

  if (!fromNumber) {
    throw new Error('Twilio phone number not configured');
  }
  
  // Build the call URL with parameters
  const params = new URLSearchParams({
    script: script,
    forward: forwardToNumber,
    record: String(options.record || settings.recordCalls || false),
    transcribe: String(options.transcribe || settings.transcribeCalls || false),
    language: options.language || 'en-US',
    voiceId: options.voiceId || 'alice',
    mode: options.mode || 'conversation',
  });

  if (options.callerIdentityId) {
    params.set('callerIdentityId', options.callerIdentityId);
  }

  if (options.callerName) {
    params.set('callerName', options.callerName);
  }

  if (options.callerPosition) {
    params.set('callerPosition', options.callerPosition);
  }

  const statusUrl = new URL(`${webhookUrl}/api/calls/status`);
  if (options.callerIdentityId) {
    statusUrl.searchParams.set('callerIdentityId', options.callerIdentityId);
  }
  
  const call = await client.calls.create({
    to: to,
    from: fromNumber,
    url: `${webhookUrl}/api/calls/answer?${params.toString()}`,
    statusCallback: statusUrl.toString(),
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'failed', 'no-answer'],
    statusCallbackMethod: 'POST',
    timeout: 30,
    // Record the call from the beginning
    record: options.record || settings.recordCalls || false,
    recordingStatusCallback: `${webhookUrl}/api/calls/recording-complete`,
    recordingStatusCallbackEvent: ['completed'],
    recordingStatusCallbackMethod: 'POST',
  });
  
  return {
    sid: call.sid,
    status: call.status,
  };
}

// Get call status with recording info
export async function getCallStatus(callSid: string): Promise<{
  status: string;
  duration: string;
  price: string;
  recordingUrl?: string;
}> {
  const client = await getClient();
  
  const call = await client.calls(callSid).fetch();
  
  // Get recordings for this call
  const recordings = await client.recordings.list({ callSid });
  const recordingUrl = recordings.length > 0 
    ? `https://api.twilio.com${recordings[0].uri.replace('.json', '.mp3')}`
    : undefined;
  
  return {
    status: call.status,
    duration: call.duration || '0',
    price: call.price || '0',
    recordingUrl,
  };
}

// Get all recordings for a call
export async function getCallRecordings(callSid: string): Promise<{
  sid: string;
  duration: string;
  url: string;
  status: string;
}[]> {
  const client = await getClient();
  
  const recordings = await client.recordings.list({ callSid });
  
  return recordings.map(r => ({
    sid: r.sid,
    duration: r.duration,
    url: `https://api.twilio.com${r.uri.replace('.json', '.mp3')}`,
    status: r.status,
  }));
}

// Download recording as buffer
export async function downloadRecording(recordingSid: string): Promise<Buffer> {
  const client = await getClient();
  const settings = await getSettings();
  
  const response = await client.recordings(recordingSid).fetch();
  const uri = `https://api.twilio.com${response.uri.replace('.json', '.mp3')}`;
  
  const res = await fetch(uri, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${settings.twilioAccountSid}:${settings.twilioAuthToken}`).toString('base64'),
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to download recording');
  }
  
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Get transcription for a recording
export async function getTranscription(recordingSid: string): Promise<{
  sid: string;
  status: string;
  text: string;
} | null> {
  const client = await getClient();
  
  const transcriptions = await (client as any).transcriptions.list({ recordingSid });
  
  if (transcriptions.length === 0) {
    return null;
  }
  
  const transcription = transcriptions[0];
  
  // Get the full text
  const sentences = await (client as any).transcriptions(transcription.sid).sentences.list();
  const text = sentences.map(s => s.transcript).join(' ');
  
  return {
    sid: transcription.sid,
    status: transcription.status,
    text,
  };
}

// End a call
export async function endCall(callSid: string): Promise<void> {
  const client = await getClient();
  
  await client.calls(callSid).update({
    status: 'completed',
  });
}

// Validate Twilio webhook signature
export async function validateWebhookSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): Promise<boolean> {
  const settings = await getSettings();
  
  if (!settings.twilioAuthToken) {
    return false;
  }
  
  return twilio.validateRequest(
    settings.twilioAuthToken,
    signature,
    url,
    params
  );
}

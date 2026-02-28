import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { v4 as uuidv4 } from 'uuid';
import {
  findCampaignResultByCallSid,
  getRecordingByCallSid,
  saveRecording,
  updateCampaignResultByCallSid,
} from '@/lib/store';
import { Recording } from '@/lib/types';

async function handleVoicemail(request: NextRequest) {
  const formData = await request.formData();

  const callSid = (formData.get('CallSid') || '') as string;
  const recordingSid = (formData.get('RecordingSid') || '') as string;
  const recordingUrl = (formData.get('RecordingUrl') || '') as string;
  const recordingDuration = (formData.get('RecordingDuration') || '0') as string;

  const matchedCall = callSid ? findCampaignResultByCallSid(callSid) : null;
  const campaignId = matchedCall?.campaign.id || '';
  const phoneNumber = matchedCall?.result.phoneNumber || '';

  if (callSid) {
    updateCampaignResultByCallSid(callSid, { status: 'voicemail' });
  }

  const existingRecording = callSid ? getRecordingByCallSid(callSid) : null;

  if (existingRecording) {
    existingRecording.recordingSid = recordingSid || existingRecording.recordingSid;
    existingRecording.recordingUrl = recordingUrl
      ? (recordingUrl.endsWith('.mp3') ? recordingUrl : `${recordingUrl}.mp3`)
      : existingRecording.recordingUrl;
    existingRecording.duration = parseInt(recordingDuration, 10) || existingRecording.duration;
    existingRecording.status = 'completed';
    existingRecording.campaignId = existingRecording.campaignId || campaignId;
    existingRecording.phoneNumber = existingRecording.phoneNumber || phoneNumber;
    saveRecording(existingRecording);
  } else if (recordingSid && recordingUrl) {
    const recording: Recording = {
      id: uuidv4(),
      callSid,
      campaignId,
      phoneNumber,
      recordingSid,
      recordingUrl: recordingUrl.endsWith('.mp3') ? recordingUrl : `${recordingUrl}.mp3`,
      duration: parseInt(recordingDuration, 10) || 0,
      status: 'completed',
      createdAt: new Date(),
    };
    saveRecording(recording);
  }

  const response = new twilio.twiml.VoiceResponse();
  response.say('Thank you. Goodbye.');
  response.hangup();

  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

export async function GET(request: NextRequest) {
  return handleVoicemail(request);
}

export async function POST(request: NextRequest) {
  return handleVoicemail(request);
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllRecordings, 
  getRecording, 
  getRecordingsByCampaign,
  deleteRecording 
} from '@/lib/store';
import { getCallRecordings, downloadRecording } from '@/lib/twilio';
import { requireUserIdFromRequest } from '@/lib/request-user';

// Get recordings
export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const campaignId = searchParams.get('campaignId');
    
    if (id) {
      const recording = await getRecording(id, userId);
      return NextResponse.json({ recording });
    }
    
    if (campaignId) {
      const recordings = await getRecordingsByCampaign(campaignId, userId);
      return NextResponse.json({ recordings });
    }
    
    const recordings = await getAllRecordings(userId);
    return NextResponse.json({ recordings });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get recordings' }, { status: 500 });
  }
}

// Delete a recording
export async function DELETE(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Recording ID required' }, { status: 400 });
    }
    
    await deleteRecording(id, userId);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete recording' }, { status: 500 });
  }
}

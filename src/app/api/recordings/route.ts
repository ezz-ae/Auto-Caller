import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllRecordings, 
  getRecording, 
  getRecordingsByCampaign,
  deleteRecording 
} from '@/lib/store';
import { getCallRecordings, downloadRecording } from '@/lib/twilio';

// Get recordings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const campaignId = searchParams.get('campaignId');
    
    if (id) {
      const recording = getRecording(id);
      return NextResponse.json({ recording });
    }
    
    if (campaignId) {
      const recordings = getRecordingsByCampaign(campaignId);
      return NextResponse.json({ recordings });
    }
    
    const recordings = getAllRecordings();
    return NextResponse.json({ recordings });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get recordings' }, { status: 500 });
  }
}

// Delete a recording
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Recording ID required' }, { status: 400 });
    }
    
    deleteRecording(id);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete recording' }, { status: 500 });
  }
}

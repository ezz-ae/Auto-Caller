import { NextRequest, NextResponse } from 'next/server';
import { requireUserIdFromRequest } from '@/lib/request-user';
import { isUnauthorizedError } from '@/lib/route-errors';
import { getAllCampaigns, getAllRecordings, getAllTranscripts } from '@/lib/store';
import { listSuppressionNumbers } from '@/lib/compliance-store';

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);

    const [campaigns, recordings, transcripts, suppressions] = await Promise.all([
      getAllCampaigns(userId),
      getAllRecordings(userId),
      getAllTranscripts(userId),
      listSuppressionNumbers(userId, 2000),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      userId,
      summary: {
        campaigns: campaigns.length,
        calls: campaigns.reduce((sum, campaign) => sum + (campaign.results?.length || 0), 0),
        recordings: recordings.length,
        transcripts: transcripts.length,
        dncNumbers: suppressions.length,
      },
      campaigns,
      recordings,
      transcripts,
      suppressions,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="trren-compliance-export-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Compliance export failed:', error);
    return NextResponse.json({ error: 'Failed to export compliance data' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAllCampaigns } from '@/lib/store';
import { buildDailyReport } from '@/lib/call-center-intelligence';
import { requireUserIdFromRequest } from '@/lib/request-user';

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const dateInput = String(searchParams.get('date') || '').trim();
    const requestedDate = dateInput ? new Date(dateInput) : new Date();

    if (Number.isNaN(requestedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const campaigns = await getAllCampaigns(userId);
    const report = buildDailyReport(campaigns, requestedDate);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Daily report API error:', error);
    return NextResponse.json({ error: 'Failed to load daily report' }, { status: 500 });
  }
}

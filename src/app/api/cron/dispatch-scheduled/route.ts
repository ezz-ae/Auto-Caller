import { NextRequest, NextResponse } from 'next/server';
import { dispatchDueScheduledCampaigns } from '@/lib/campaign-scheduler';

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || '';
  if (!cronSecret) return true;

  const authHeader = request.headers.get('authorization') || '';
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await dispatchDueScheduledCampaigns();
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron dispatch failed:', error);
    return NextResponse.json({ error: 'Failed to dispatch scheduled campaigns' }, { status: 500 });
  }
}

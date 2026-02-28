import { NextRequest, NextResponse } from 'next/server';
import { getAllCampaigns } from '@/lib/store';
import { buildCallbackQueue } from '@/lib/call-center-intelligence';
import { requireUserIdFromRequest } from '@/lib/request-user';

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const status = String(searchParams.get('status') || '').trim().toLowerCase();

    const campaigns = await getAllCampaigns(userId);
    const queue = buildCallbackQueue(campaigns);
    const callbacks = ['scheduled', 'completed', 'cancelled'].includes(status)
      ? queue.filter(item => item.status === status)
      : queue;

    return NextResponse.json({
      success: true,
      callbacks,
      count: callbacks.length,
    });
  } catch (error) {
    console.error('Callbacks API error:', error);
    return NextResponse.json({ error: 'Failed to load callback queue' }, { status: 500 });
  }
}

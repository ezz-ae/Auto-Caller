import { NextRequest, NextResponse } from 'next/server';
import { requireUserIdFromRequest } from '@/lib/request-user';
import { isUnauthorizedError } from '@/lib/route-errors';
import { listBillingEvents } from '@/lib/billing-events';

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 30);
    const events = await listBillingEvents(userId, Number.isFinite(limit) ? limit : 30);
    return NextResponse.json({ events });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to load billing events' }, { status: 500 });
  }
}

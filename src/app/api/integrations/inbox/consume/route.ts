import { NextRequest, NextResponse } from 'next/server';
import { requireUserIdFromRequest } from '@/lib/request-user';
import { isUnauthorizedError } from '@/lib/route-errors';
import { appendIntegrationEvent, consumeLeadInboxItems } from '@/lib/integration-store';

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const limit = Number(body.limit || 200);

    const consumed = await consumeLeadInboxItems(userId, limit);
    const numbers = consumed.map(item => item.phoneNumber);
    const notes = consumed.map(item => {
      const identity = item.name || item.email || item.source;
      return `${item.phoneNumber} | ${identity} | source: ${item.source}`;
    });

    if (consumed.length > 0) {
      await appendIntegrationEvent(
        {
          source: 'inbox',
          status: 'success',
          message: `Moved ${consumed.length} leads to Call Center composer.`,
          importedCount: consumed.length,
          details: {},
        },
        userId
      );
    }

    return NextResponse.json({
      success: true,
      consumed: consumed.length,
      numbers,
      notes,
      leads: consumed,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to consume lead inbox' }, { status: 500 });
  }
}

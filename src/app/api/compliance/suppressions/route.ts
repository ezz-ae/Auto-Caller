import { NextRequest, NextResponse } from 'next/server';
import {
  addSuppressionNumber,
  listSuppressionNumbers,
  removeSuppressionNumber,
} from '@/lib/compliance-store';
import { requireUserIdFromRequest } from '@/lib/request-user';
import { isUnauthorizedError } from '@/lib/route-errors';

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const limit = Number(new URL(request.url).searchParams.get('limit') || 200);
    const entries = await listSuppressionNumbers(userId, limit);
    return NextResponse.json({ entries });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to load suppression list' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const phoneNumber = String(body?.phoneNumber || '').trim();
    const reason = String(body?.reason || 'Manual DNC suppression').trim();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 });
    }

    const created = await addSuppressionNumber({
      userId,
      phoneNumber,
      reason,
      source: 'manual',
    });

    if (!created) {
      return NextResponse.json({ error: 'Invalid phoneNumber' }, { status: 400 });
    }

    return NextResponse.json({ success: true, entry: created });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to add suppression entry' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const phoneNumber = String(new URL(request.url).searchParams.get('phoneNumber') || '').trim();
    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 });
    }
    const removed = await removeSuppressionNumber(userId, phoneNumber);
    return NextResponse.json({ success: true, removed });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to remove suppression entry' }, { status: 500 });
  }
}

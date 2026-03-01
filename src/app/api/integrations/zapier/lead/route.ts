import { NextRequest, NextResponse } from 'next/server';
import { appendIntegrationEvent, enqueueLeadInboxItems, findUserIdByZapierSecret } from '@/lib/integration-store';
import { parseLeadsFromPayload } from '@/lib/lead-import';

function getKeyFromRequest(request: NextRequest): string {
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key') || '';
  const headerKey = request.headers.get('x-acaller-webhook-key') || '';
  return String(queryKey || headerKey).trim();
}

export async function GET(request: NextRequest) {
  const key = getKeyFromRequest(request);
  if (!key) {
    return NextResponse.json({
      success: false,
      error: 'Missing key. Use ?key=YOUR_WEBHOOK_KEY',
    }, { status: 401 });
  }

  const userId = await findUserIdByZapierSecret(key);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Invalid webhook key' }, { status: 401 });
  }

  return NextResponse.json({ success: true, message: 'Webhook key is valid.' });
}

export async function POST(request: NextRequest) {
  try {
    const key = getKeyFromRequest(request);
    if (!key) {
      return NextResponse.json({ success: false, error: 'Missing webhook key' }, { status: 401 });
    }

    const userId = await findUserIdByZapierSecret(key);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Invalid webhook key' }, { status: 401 });
    }

    const payload = await request.json().catch(() => ({}));
    const parsed = parseLeadsFromPayload(payload);

    if (parsed.length === 0) {
      await appendIntegrationEvent(
        {
          source: 'zapier',
          status: 'warning',
          message: 'Zapier payload received with no valid phone numbers.',
          importedCount: 0,
          details: {},
        },
        userId
      );

      return NextResponse.json({
        success: false,
        error: 'No valid phone numbers found in payload',
      }, { status: 400 });
    }

    const inserted = await enqueueLeadInboxItems(
      'zapier',
      parsed.map(lead => ({
        phoneNumber: lead.phoneNumber,
        name: lead.name,
        email: lead.email,
        payload: lead.payload,
      })),
      userId
    );

    await appendIntegrationEvent(
      {
        source: 'zapier',
        status: inserted > 0 ? 'success' : 'warning',
        message:
          inserted > 0
            ? `Zapier imported ${inserted} lead${inserted === 1 ? '' : 's'} into inbox.`
            : 'Zapier payload received, but all leads were duplicates.',
        importedCount: inserted,
        details: {
          parsed: parsed.length,
        },
      },
      userId
    );

    return NextResponse.json({
      success: true,
      parsed: parsed.length,
      imported: inserted,
      duplicates: Math.max(0, parsed.length - inserted),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to process Zapier webhook' }, { status: 500 });
  }
}

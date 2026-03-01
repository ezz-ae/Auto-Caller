import { NextRequest, NextResponse } from 'next/server';
import { requireUserIdFromRequest } from '@/lib/request-user';
import { isUnauthorizedError } from '@/lib/route-errors';
import { resolvePublicAppUrl } from '@/lib/public-app-url';
import {
  appendIntegrationEvent,
  getLeadInboxSummary,
  getLeadSourceSettings,
  listIntegrationEvents,
  rotateZapierInboundSecret,
  saveLeadSourceSettings,
} from '@/lib/integration-store';

function buildWebhookUrl(baseUrl: string, key: string): string {
  const url = new URL('/api/integrations/zapier/lead', baseUrl);
  url.searchParams.set('key', key);
  return url.toString();
}

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const settings = await getLeadSourceSettings(userId);
    const events = await listIntegrationEvents(userId, 25);
    const inbox = await getLeadInboxSummary(userId);
    const baseUrl = resolvePublicAppUrl(request);

    return NextResponse.json({
      success: true,
      settings,
      webhookUrl: buildWebhookUrl(baseUrl, settings.zapierInboundSecret),
      inbox,
      events,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to load lead source settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const body = await request.json().catch(() => ({}));

    let updated = await saveLeadSourceSettings(
      {
        zapierEnabled: typeof body.zapierEnabled === 'boolean' ? body.zapierEnabled : undefined,
        googleDriveEnabled: typeof body.googleDriveEnabled === 'boolean' ? body.googleDriveEnabled : undefined,
        googleDriveCsvUrl: typeof body.googleDriveCsvUrl === 'string' ? body.googleDriveCsvUrl.trim() : undefined,
        googleDriveAutoSync: typeof body.googleDriveAutoSync === 'boolean' ? body.googleDriveAutoSync : undefined,
      },
      userId
    );

    if (body.rotateZapierSecret === true) {
      const secret = await rotateZapierInboundSecret(userId);
      updated = await saveLeadSourceSettings({ zapierInboundSecret: secret }, userId);
      await appendIntegrationEvent(
        {
          source: 'zapier',
          status: 'warning',
          message: 'Zapier webhook secret rotated.',
          importedCount: 0,
          details: {},
        },
        userId
      );
    }

    const events = await listIntegrationEvents(userId, 25);
    const inbox = await getLeadInboxSummary(userId);
    const baseUrl = resolvePublicAppUrl(request);

    return NextResponse.json({
      success: true,
      settings: updated,
      webhookUrl: buildWebhookUrl(baseUrl, updated.zapierInboundSecret),
      inbox,
      events,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to save lead source settings' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireUserIdFromRequest } from '@/lib/request-user';
import { isUnauthorizedError } from '@/lib/route-errors';
import {
  appendIntegrationEvent,
  enqueueLeadInboxItems,
  getLeadSourceSettings,
  saveLeadSourceSettings,
} from '@/lib/integration-store';
import { parseLeadsFromCsvText } from '@/lib/lead-import';

function toGoogleCsvUrl(input: string): string {
  const raw = String(input || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);

    if (url.hostname.includes('docs.google.com') && url.pathname.includes('/spreadsheets/d/')) {
      const parts = url.pathname.split('/');
      const id = parts[parts.indexOf('d') + 1];
      const gid = url.searchParams.get('gid') || '0';
      if (id) {
        return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(gid)}`;
      }
    }

    if (url.hostname.includes('drive.google.com') && url.pathname.includes('/file/d/')) {
      const parts = url.pathname.split('/');
      const id = parts[parts.indexOf('d') + 1];
      if (id) {
        return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
      }
    }

    return raw;
  } catch {
    return raw;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const current = await getLeadSourceSettings(userId);

    const providedUrl = typeof body.fileUrl === 'string' ? body.fileUrl.trim() : '';
    const sourceUrl = providedUrl || current.googleDriveCsvUrl;
    if (!sourceUrl) {
      return NextResponse.json({ error: 'Google Drive CSV URL is required' }, { status: 400 });
    }

    const csvUrl = toGoogleCsvUrl(sourceUrl);
    const response = await fetch(csvUrl, { cache: 'no-store' });

    if (!response.ok) {
      const message = `Failed to fetch CSV (${response.status})`;
      await appendIntegrationEvent(
        {
          source: 'google_drive',
          status: 'error',
          message,
          importedCount: 0,
          details: { csvUrl },
        },
        userId
      );
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const csvText = await response.text();
    const parsed = parseLeadsFromCsvText(csvText);

    if (parsed.length === 0) {
      await appendIntegrationEvent(
        {
          source: 'google_drive',
          status: 'warning',
          message: 'No valid phone numbers found in CSV.',
          importedCount: 0,
          details: { csvUrl },
        },
        userId
      );

      return NextResponse.json({
        success: false,
        error: 'No valid phone numbers found in CSV',
      }, { status: 400 });
    }

    const inserted = await enqueueLeadInboxItems(
      'google_drive',
      parsed.map(lead => ({
        phoneNumber: lead.phoneNumber,
        name: lead.name,
        email: lead.email,
        payload: lead.payload,
      })),
      userId
    );

    if (providedUrl && (body.persistUrl === true || !current.googleDriveCsvUrl)) {
      await saveLeadSourceSettings(
        {
          googleDriveCsvUrl: providedUrl,
          googleDriveEnabled: true,
        },
        userId
      );
    }

    await appendIntegrationEvent(
      {
        source: 'google_drive',
        status: inserted > 0 ? 'success' : 'warning',
        message:
          inserted > 0
            ? `Google Drive sync imported ${inserted} leads.`
            : 'Google Drive sync ran, but all rows were duplicates.',
        importedCount: inserted,
        details: {
          parsed: parsed.length,
          csvUrl,
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
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to sync Google Drive source' }, { status: 500 });
  }
}

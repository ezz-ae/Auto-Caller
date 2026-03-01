import { NextRequest, NextResponse } from 'next/server';
import { requireUserIdFromRequest } from '@/lib/request-user';
import { isUnauthorizedError } from '@/lib/route-errors';
import { addSuppressionNumber } from '@/lib/compliance-store';
import { getAllCampaigns, saveCampaign } from '@/lib/store';

function normalizePhoneNumber(input: string): string {
  let value = String(input || '').trim();
  if (!value) return '';
  value = value.replace(/[\s().-]+/g, '');
  if (value.startsWith('00')) value = `+${value.slice(2)}`;
  if (value.startsWith('+')) {
    value = `+${value.slice(1).replace(/\D/g, '')}`;
  } else {
    value = value.replace(/\D/g, '');
  }
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  return value.startsWith('+') ? value : `+${value}`;
}

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const normalizedPhone = normalizePhoneNumber(String(body?.phoneNumber || ''));

    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
    }

    await addSuppressionNumber({
      userId,
      phoneNumber: normalizedPhone,
      reason: 'Deleted by workspace user',
      source: 'workspace_delete',
    });

    const campaigns = await getAllCampaigns(userId);
    let updatedCampaigns = 0;
    let updatedResults = 0;

    for (const campaign of campaigns) {
      const originalNumbersLength = campaign.numbers.length;
      let touchedCampaign = false;
      campaign.numbers = campaign.numbers.filter(number => normalizePhoneNumber(number) !== normalizedPhone);
      if (campaign.numbers.length !== originalNumbersLength) {
        touchedCampaign = true;
      }

      campaign.results = campaign.results.map(result => {
        if (normalizePhoneNumber(result.phoneNumber) !== normalizedPhone) {
          return result;
        }
        updatedResults += 1;
        touchedCampaign = true;
        return {
          ...result,
          status: 'failed',
          pursuitState: 'DNC',
          followUpRequested: false,
          followUpStatus: 'cancelled',
          callComment: 'Lead deleted by user and added to DNC list',
          leadRequest: 'Do not call / deleted by workspace user',
        };
      });

      if (touchedCampaign) {
        updatedCampaigns += 1;
        await saveCampaign(campaign);
      }
    }

    return NextResponse.json({
      success: true,
      phoneNumber: normalizedPhone,
      updatedCampaigns,
      updatedResults,
      message: 'Lead deleted from active pursuit and added to DNC list.',
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete lead failed:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}

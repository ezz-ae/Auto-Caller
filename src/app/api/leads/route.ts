import { NextRequest, NextResponse } from 'next/server';
import { getAllCampaigns } from '@/lib/store';
import { buildLeadProfiles } from '@/lib/call-center-intelligence';
import { requireUserIdFromRequest } from '@/lib/request-user';

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const limitRaw = parseInt(searchParams.get('limit') || '100', 10);
    const limit = Number.isNaN(limitRaw) ? 100 : Math.max(1, Math.min(limitRaw, 500));

    const campaigns = await getAllCampaigns(userId);
    const leads = buildLeadProfiles(campaigns).slice(0, limit);

    return NextResponse.json({
      success: true,
      leads,
      count: leads.length,
    });
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
  }
}

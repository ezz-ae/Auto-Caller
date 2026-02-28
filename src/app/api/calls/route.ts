import { NextRequest, NextResponse } from 'next/server';
import { getCredits, getSettings, saveCampaign, getCampaign, getAllCampaigns } from '@/lib/store';
import { applyCallerIdentityKpiDelta, getCallerIdentity } from '@/lib/caller-identity-store';
import { v4 as uuidv4 } from 'uuid';
import { Campaign } from '@/lib/types';
import { runCampaign } from '@/lib/campaign-runner';
import { dispatchDueScheduledCampaigns } from '@/lib/campaign-scheduler';
import { requireUserIdFromRequest } from '@/lib/request-user';

function normalizePhoneKey(raw: string): string {
  return String(raw || '').replace(/[^\d+]/g, '');
}

function parseLeadNotes(
  input: unknown
): Record<string, { userComment?: string; targetComment?: string }> {
  if (!input) return {};

  if (typeof input === 'object' && !Array.isArray(input)) {
    const map: Record<string, { userComment?: string; targetComment?: string }> = {};
    for (const [key, value] of Object.entries(input as Record<string, any>)) {
      const normalized = normalizePhoneKey(key);
      if (!normalized) continue;
      map[normalized] = {
        userComment: String(value?.userComment || '').trim() || undefined,
        targetComment: String(value?.targetComment || '').trim() || undefined,
      };
    }
    return map;
  }

  if (typeof input !== 'string') return {};

  const map: Record<string, { userComment?: string; targetComment?: string }> = {};
  const lines = input
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const [rawNumber, rawUserComment, rawTargetComment] = line.split('|').map(part => String(part || '').trim());
    const normalized = normalizePhoneKey(rawNumber);
    if (!normalized) continue;
    map[normalized] = {
      userComment: rawUserComment || undefined,
      targetComment: rawTargetComment || undefined,
    };
  }

  return map;
}

// Get all campaigns
export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    await dispatchDueScheduledCampaigns();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const campaign = await getCampaign(id, userId);
      return NextResponse.json({ campaign });
    }
    
    const campaigns = await getAllCampaigns(userId);
    return NextResponse.json({ campaigns });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get campaigns' }, { status: 500 });
  }
}

// Start a new campaign
export async function POST(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const body = await request.json();
    const { numbers, voiceId, language, script, target, leadNotes, name, record, transcribe, callerIdentityId, scheduledAt } = body;

    if (!Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json({
        error: 'At least one phone number is required',
      }, { status: 400 });
    }
    
    // Check credits
    const credits = await getCredits(userId);
    if (credits < numbers.length) {
      return NextResponse.json({ 
        error: `Not enough credits. Need ${numbers.length}, have ${credits}` 
      }, { status: 400 });
    }
    
    // Get settings
    const settings = await getSettings(userId);
    if (!settings.forwardToNumber) {
      return NextResponse.json({ 
        error: 'Forward number not configured. Go to Settings first.' 
      }, { status: 400 });
    }

    if (!callerIdentityId) {
      return NextResponse.json({
        error: 'Caller identity is required before launching a campaign',
        code: 'CALLER_IDENTITY_REQUIRED',
      }, { status: 400 });
    }

    const selectedIdentity = await getCallerIdentity(String(callerIdentityId), userId);
    if (!selectedIdentity) {
      return NextResponse.json({
        error: 'Selected caller identity was not found',
        code: 'CALLER_IDENTITY_NOT_FOUND',
      }, { status: 400 });
    }

    if (settings.managedMode && !selectedIdentity.dedicatedNumber) {
      return NextResponse.json({
        error: `Caller "${selectedIdentity.name}" is missing a dedicated number. Buy number first.`,
        code: 'CALLER_NUMBER_REQUIRED',
      }, { status: 400 });
    }

    const selectedLanguage = String(language || selectedIdentity?.language || 'en-US');
    const selectedVoiceId = String(voiceId || selectedIdentity?.voiceId || '21m00Tcm4TlvDq8ikWAM');
    const baseScript = String(
      target ||
      script ||
      selectedIdentity?.script ||
      [
        'Goal: qualify lead and connect to human agent',
        `Audience: ${selectedIdentity?.industry || settings.industry || 'general'} prospects`,
        `Offer: ${settings.businessName || 'our company'} update relevant to their needs`,
        'Qualification: Need + budget + timeline + decision maker',
        'CTA: connect now with our team',
      ].join('\n')
    ).trim();
    const ruleNotes = (selectedIdentity?.sayThisRules || settings.sayThisRules || '').trim();
    const finalScript = [baseScript, ruleNotes].filter(Boolean).join(' ');
    const noteMap = parseLeadNotes(leadNotes);
    const parsedSchedule =
      typeof scheduledAt === 'string' && scheduledAt.trim().length > 0
        ? new Date(scheduledAt)
        : null;

    if (parsedSchedule && Number.isNaN(parsedSchedule.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduled date' }, { status: 400 });
    }

    const shouldSchedule = !!(parsedSchedule && parsedSchedule.getTime() > Date.now());
    
    // Create campaign
    const campaign: Campaign = {
      id: uuidv4(),
      userId,
      name: name || `Campaign ${new Date().toLocaleDateString()}`,
      status: shouldSchedule ? 'scheduled' : 'running',
      voiceId: selectedVoiceId,
      language: selectedLanguage,
      callerIdentityId: selectedIdentity?.id,
      callerIdentityName: selectedIdentity?.name,
      callerPosition: selectedIdentity?.position,
      script: finalScript,
      numbers,
      currentIndex: 0,
      results: numbers.map((phoneNumber: string) => {
        const note = noteMap[normalizePhoneKey(phoneNumber)] || {};
        return {
          id: uuidv4(),
          campaignId: '',
          phoneNumber,
          status: 'pending' as const,
          timestamp: new Date(),
          userComment: note.userComment,
          targetComment: note.targetComment,
          callComment: 'Queued for first attempt',
        };
      }),
      createdAt: new Date(),
      scheduledAt: parsedSchedule || undefined,
      recordCalls: typeof record === 'boolean' ? record : settings.recordCalls,
      transcribeCalls: typeof transcribe === 'boolean' ? transcribe : settings.transcribeCalls,
    };

    campaign.results = campaign.results.map(result => ({
      ...result,
      campaignId: campaign.id,
    }));
    
    await saveCampaign(campaign);

    if (selectedIdentity) {
      await applyCallerIdentityKpiDelta(selectedIdentity.id, {
        campaignsLaunched: 1,
      }, userId);
    }
    
    if (shouldSchedule) {
      return NextResponse.json({
        success: true,
        campaign,
        message: `Campaign scheduled for ${parsedSchedule?.toLocaleString()}`,
      });
    }

    // Start calling in background
    void runCampaign(campaign).catch(error => {
      console.error('Campaign runner failed:', campaign.id, error);
    });
    
    return NextResponse.json({ 
      success: true, 
      campaign,
      message: `Started calling ${numbers.length} numbers` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to start campaign' }, { status: 500 });
  }
}

// Stop campaign
export async function DELETE(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }
    
    const campaign = await getCampaign(id, userId);
    if (campaign) {
      campaign.status = 'stopped';
      await saveCampaign(campaign);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to stop campaign' }, { status: 500 });
  }
}

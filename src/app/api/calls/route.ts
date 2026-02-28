import { NextRequest, NextResponse } from 'next/server';
import { getCredits, getSettings, saveCampaign, getCampaign, getAllCampaigns } from '@/lib/store';
import { applyCallerIdentityKpiDelta, getCallerIdentity } from '@/lib/caller-identity-store';
import { v4 as uuidv4 } from 'uuid';
import { Campaign } from '@/lib/types';
import { runCampaign } from '@/lib/campaign-runner';
import { dispatchDueScheduledCampaigns } from '@/lib/campaign-scheduler';

// Get all campaigns
export async function GET(request: NextRequest) {
  try {
    await dispatchDueScheduledCampaigns();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const campaign = await getCampaign(id);
      return NextResponse.json({ campaign });
    }
    
    const campaigns = await getAllCampaigns();
    return NextResponse.json({ campaigns });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get campaigns' }, { status: 500 });
  }
}

// Start a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { numbers, voiceId, language, script, name, record, transcribe, callerIdentityId, scheduledAt } = body;

    if (!Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json({
        error: 'At least one phone number is required',
      }, { status: 400 });
    }
    
    // Check credits
    const credits = await getCredits();
    if (credits < numbers.length) {
      return NextResponse.json({ 
        error: `Not enough credits. Need ${numbers.length}, have ${credits}` 
      }, { status: 400 });
    }
    
    // Get settings
    const settings = await getSettings();
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

    const selectedIdentity = await getCallerIdentity(String(callerIdentityId));
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
    const baseScript = String(script || selectedIdentity?.script || 'Hi, this is a quick update call. Are you open to hearing the offer?').trim();
    const introLine = selectedIdentity
      ? (selectedIdentity.mentionAi
        ? `Hi, this is ${selectedIdentity.name}, an AI assistant calling on behalf of ${settings.businessName || 'our company'}.`
        : `Hi, this is ${selectedIdentity.name}, ${selectedIdentity.position} at ${settings.businessName || 'our company'}.`)
      : '';

    const ruleNotes = (selectedIdentity?.sayThisRules || settings.sayThisRules || '').trim();

    const finalScript = [introLine, baseScript, ruleNotes].filter(Boolean).join(' ');
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
      userId: 'default',
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
      results: [],
      createdAt: new Date(),
      scheduledAt: parsedSchedule || undefined,
      recordCalls: typeof record === 'boolean' ? record : settings.recordCalls,
      transcribeCalls: typeof transcribe === 'boolean' ? transcribe : settings.transcribeCalls,
    };
    
    await saveCampaign(campaign);

    if (selectedIdentity) {
      await applyCallerIdentityKpiDelta(selectedIdentity.id, {
        campaignsLaunched: 1,
      });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }
    
    const campaign = await getCampaign(id);
    if (campaign) {
      campaign.status = 'stopped';
      await saveCampaign(campaign);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to stop campaign' }, { status: 500 });
  }
}

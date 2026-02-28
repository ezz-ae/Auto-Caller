import { NextRequest, NextResponse } from 'next/server';
import { getCredits, updateCredits, getSettings, saveCampaign, getCampaign, getAllCampaigns, updateCampaignResult } from '@/lib/store';
import { makeCall } from '@/lib/twilio';
import { applyCallerIdentityKpiDelta, getCallerIdentity } from '@/lib/caller-identity-store';
import { v4 as uuidv4 } from 'uuid';
import { Campaign, CallResult } from '@/lib/types';

// Get all campaigns
export async function GET(request: NextRequest) {
  try {
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
    const { numbers, voiceId, language, script, name, record, transcribe, callerIdentityId } = body;

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

    const selectedIdentity = callerIdentityId ? await getCallerIdentity(String(callerIdentityId)) : null;
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
    
    // Create campaign
    const campaign: Campaign = {
      id: uuidv4(),
      userId: 'default',
      name: name || `Campaign ${new Date().toLocaleDateString()}`,
      status: 'running',
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
      recordCalls: typeof record === 'boolean' ? record : settings.recordCalls,
      transcribeCalls: typeof transcribe === 'boolean' ? transcribe : settings.transcribeCalls,
    };
    
    await saveCampaign(campaign);

    if (selectedIdentity) {
      await applyCallerIdentityKpiDelta(selectedIdentity.id, {
        campaignsLaunched: 1,
      });
    }
    
    // Start calling in background
    startCalling(campaign);
    
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

// Background calling function
async function startCalling(campaign: Campaign) {
  const settings = await getSettings();
  
  // Determine webhook URL (this server)
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  for (let i = 0; i < campaign.numbers.length; i++) {
    // Check if campaign was stopped
    const currentCampaign = await getCampaign(campaign.id);
    if (!currentCampaign || currentCampaign.status !== 'running') {
      break;
    }
    
    const number = campaign.numbers[i];
    const callId = uuidv4();
    
    // Create pending result
    const result: CallResult = {
      id: callId,
      campaignId: campaign.id,
      phoneNumber: number,
      status: 'calling',
      timestamp: new Date(),
    };
    
    await updateCampaignResult(campaign.id, result);
    
    try {
      // Make the call
      const call = await makeCall(
        number,
        campaign.script,
        settings.forwardToNumber,
        webhookUrl,
        {
          record: campaign.recordCalls ?? settings.recordCalls,
          transcribe: campaign.transcribeCalls ?? settings.transcribeCalls,
          language: campaign.language || 'en-US',
          callerIdentityId: campaign.callerIdentityId,
          voiceId: campaign.voiceId,
        }
      );
      
      // Deduct credit
      await updateCredits(-1);
      if (campaign.callerIdentityId) {
        await applyCallerIdentityKpiDelta(campaign.callerIdentityId, {
          totalCalls: 1,
          creditsUsed: 1,
          lastCalledAt: new Date(),
        });
      }
      
      // Update result
      result.callSid = call.sid;
      result.status = 'calling';
      await updateCampaignResult(campaign.id, result);
      
      // Wait between calls to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error: any) {
      result.status = 'failed';
      result.error = error.message;
      await updateCampaignResult(campaign.id, result);
    }
    
    // Update index
    if (currentCampaign) {
      currentCampaign.currentIndex = i + 1;
      await saveCampaign(currentCampaign);
    }
  }
  
  // Mark campaign as completed
  const finalCampaign = await getCampaign(campaign.id);
  if (finalCampaign && finalCampaign.status === 'running') {
    finalCampaign.status = 'completed';
    finalCampaign.completedAt = new Date();
    await saveCampaign(finalCampaign);
  }
}

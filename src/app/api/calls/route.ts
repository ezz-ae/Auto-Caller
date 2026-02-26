import { NextRequest, NextResponse } from 'next/server';
import { getCredits, updateCredits, getSettings, saveCampaign, getCampaign, getAllCampaigns, deleteCampaign, updateCampaignResult } from '@/lib/store';
import { makeCall, getCallStatus } from '@/lib/twilio';
import { v4 as uuidv4 } from 'uuid';
import { Campaign, CallResult } from '@/lib/types';

// Get all campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const campaign = getCampaign(id);
      return NextResponse.json({ campaign });
    }
    
    const campaigns = getAllCampaigns();
    return NextResponse.json({ campaigns });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get campaigns' }, { status: 500 });
  }
}

// Start a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { numbers, voiceId, script, name } = body;
    
    // Check credits
    const credits = getCredits();
    if (credits < numbers.length) {
      return NextResponse.json({ 
        error: `Not enough credits. Need ${numbers.length}, have ${credits}` 
      }, { status: 400 });
    }
    
    // Get settings
    const settings = getSettings();
    if (!settings.forwardToNumber) {
      return NextResponse.json({ 
        error: 'Forward number not configured. Go to Settings first.' 
      }, { status: 400 });
    }
    
    // Create campaign
    const campaign: Campaign = {
      id: uuidv4(),
      userId: 'default',
      name: name || `Campaign ${new Date().toLocaleDateString()}`,
      status: 'running',
      voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM',
      script: script || 'Hi, this is a call from your real estate agent. I have an exciting property opportunity for you. Are you interested in learning more?',
      numbers,
      currentIndex: 0,
      results: [],
      createdAt: new Date(),
    };
    
    saveCampaign(campaign);
    
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
    
    const campaign = getCampaign(id);
    if (campaign) {
      campaign.status = 'stopped';
      saveCampaign(campaign);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to stop campaign' }, { status: 500 });
  }
}

// Background calling function
async function startCalling(campaign: Campaign) {
  const settings = getSettings();
  
  // Determine webhook URL (this server)
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  for (let i = 0; i < campaign.numbers.length; i++) {
    // Check if campaign was stopped
    const currentCampaign = getCampaign(campaign.id);
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
    
    updateCampaignResult(campaign.id, result);
    
    try {
      // Make the call
      const call = await makeCall(
        number,
        campaign.script,
        settings.forwardToNumber,
        webhookUrl
      );
      
      // Deduct credit
      updateCredits(-1);
      
      // Update result
      result.status = 'connected';
      updateCampaignResult(campaign.id, result);
      
      // Wait between calls to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error: any) {
      result.status = 'failed';
      result.error = error.message;
      updateCampaignResult(campaign.id, result);
    }
    
    // Update index
    if (currentCampaign) {
      currentCampaign.currentIndex = i + 1;
      saveCampaign(currentCampaign);
    }
  }
  
  // Mark campaign as completed
  const finalCampaign = getCampaign(campaign.id);
  if (finalCampaign && finalCampaign.status === 'running') {
    finalCampaign.status = 'completed';
    finalCampaign.completedAt = new Date();
    saveCampaign(finalCampaign);
  }
}

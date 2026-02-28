import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings, getCredits, setCredits, updateCredits } from '@/lib/store';
import { resetClient } from '@/lib/twilio';

export async function GET() {
  try {
    const settings = getSettings();
    const credits = getCredits();
    const managedMode = settings.managedMode;
    
    return NextResponse.json({
      settings: {
        elevenLabsApiKey: managedMode ? '' : (settings.elevenLabsApiKey ? '••••••••' : ''),
        twilioAccountSid: managedMode ? '' : (settings.twilioAccountSid ? '••••••••' : ''),
        twilioAuthToken: managedMode ? '' : (settings.twilioAuthToken ? '••••••••' : ''),
        twilioPhoneNumber: settings.twilioPhoneNumber || '',
        forwardToNumber: settings.forwardToNumber || '',
        recordCalls: settings.recordCalls ?? true,
        transcribeCalls: settings.transcribeCalls ?? true,
        openaiApiKey: managedMode ? '' : (settings.openaiApiKey ? '••••••••' : ''),
        managedMode,
        assignedPhoneNumber: settings.assignedPhoneNumber || '',
        businessName: settings.businessName || '',
      },
      credits,
      isConfigured: managedMode
        ? !!(settings.twilioAccountSid && settings.twilioAuthToken && settings.twilioPhoneNumber && settings.forwardToNumber)
        : !!(settings.twilioAccountSid && settings.twilioAuthToken && settings.twilioPhoneNumber && settings.forwardToNumber),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const current = getSettings();
    const managedMode = current.managedMode;
    
    const toSave: Record<string, string | number | boolean> = {};
    
    // Handle API keys (only save if not masked)
    if (!managedMode && body.elevenLabsApiKey && !body.elevenLabsApiKey.includes('•')) {
      toSave.elevenLabsApiKey = body.elevenLabsApiKey;
    }
    if (!managedMode && body.twilioAccountSid && !body.twilioAccountSid.includes('•')) {
      toSave.twilioAccountSid = body.twilioAccountSid;
    }
    if (!managedMode && body.twilioAuthToken && !body.twilioAuthToken.includes('•')) {
      toSave.twilioAuthToken = body.twilioAuthToken;
    }
    if (!managedMode && body.openaiApiKey && !body.openaiApiKey.includes('•')) {
      toSave.openaiApiKey = body.openaiApiKey;
    }
    
    // Handle phone numbers
    if (!managedMode && body.twilioPhoneNumber) {
      toSave.twilioPhoneNumber = body.twilioPhoneNumber;
    }
    if (body.forwardToNumber) {
      toSave.forwardToNumber = body.forwardToNumber;
    }
    if (body.assignedPhoneNumber) {
      toSave.assignedPhoneNumber = body.assignedPhoneNumber;
    }
    if (body.businessName) {
      toSave.businessName = body.businessName;
    }
    
    // Handle boolean settings
    if (typeof body.recordCalls === 'boolean') {
      toSave.recordCalls = body.recordCalls;
    }
    if (typeof body.transcribeCalls === 'boolean') {
      toSave.transcribeCalls = body.transcribeCalls;
    }
    
    // Handle credit updates
    if (typeof body.addCredits === 'number') {
      updateCredits(body.addCredits);
    }
    
    saveSettings(toSave);
    resetClient();
    
    return NextResponse.json({ success: true, credits: getCredits() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (typeof body.credits === 'number') {
      setCredits(body.credits);
    }
    
    return NextResponse.json({ success: true, credits: getCredits() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
  }
}

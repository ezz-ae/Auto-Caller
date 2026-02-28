import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings, getCredits, setCredits, updateCredits } from '@/lib/store';
import { assignManagedNumber } from '@/lib/store';
import { resetClient } from '@/lib/twilio';
import { requireUserIdFromRequest } from '@/lib/request-user';

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const settings = await getSettings(userId);
    const credits = await getCredits(userId);
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
        industry: settings.industry || '',
        companyDetails: settings.companyDetails || '',
        sayThisRules: settings.sayThisRules || '',
        avoidThisRules: settings.avoidThisRules || '',
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
    const userId = requireUserIdFromRequest(request);
    const body = await request.json();
    const current = await getSettings(userId);
    const managedMode = current.managedMode;
    const assignOnRegistration =
      (process.env.MANAGED_ASSIGN_NUMBER_ON_REGISTRATION || 'false').toLowerCase() === 'true';
    
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
    if (typeof body.industry === 'string') {
      toSave.industry = body.industry;
    }
    if (typeof body.companyDetails === 'string') {
      toSave.companyDetails = body.companyDetails;
    }
    if (typeof body.sayThisRules === 'string') {
      toSave.sayThisRules = body.sayThisRules;
    }
    if (typeof body.avoidThisRules === 'string') {
      toSave.avoidThisRules = body.avoidThisRules;
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
      await updateCredits(body.addCredits, userId);
    }
    
    await saveSettings(toSave, userId);

    let assignedPhoneNumber = current.assignedPhoneNumber || '';
    if (managedMode && assignOnRegistration && !assignedPhoneNumber) {
      assignedPhoneNumber = await assignManagedNumber(userId);
    }

    resetClient();
    
    return NextResponse.json({
      success: true,
      credits: await getCredits(userId),
      assignedPhoneNumber,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const body = await request.json();
    
    if (typeof body.credits === 'number') {
      await setCredits(body.credits, userId);
    }
    
    return NextResponse.json({ success: true, credits: await getCredits(userId) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
  }
}

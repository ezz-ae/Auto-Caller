import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings, getCredits } from '@/lib/store';
import { assignManagedNumber } from '@/lib/store';
import { resetClient } from '@/lib/twilio';
import { requireUserIdFromRequest } from '@/lib/request-user';
import { isUnauthorizedError } from '@/lib/route-errors';

function isManagedModeEnvEnabled(): boolean {
  return ['1', 'true', 'yes', 'on'].includes(String(process.env.MANAGED_MODE || '').trim().toLowerCase());
}

function shouldAssignManagedNumberOnRegistration(): boolean {
  return ['1', 'true', 'yes', 'on'].includes(
    String(process.env.MANAGED_ASSIGN_NUMBER_ON_REGISTRATION || '').trim().toLowerCase()
  );
}

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    let settings = await getSettings(userId);
    const credits = await getCredits(userId);
    const managedMode = isManagedModeEnvEnabled() || settings.managedMode;

    if (managedMode && shouldAssignManagedNumberOnRegistration() && !settings.assignedPhoneNumber) {
      await assignManagedNumber(userId);
      settings = await getSettings(userId);
    }
    
    return NextResponse.json({
      settings: {
        elevenLabsApiKey: managedMode ? '' : (settings.elevenLabsApiKey ? '••••••••' : ''),
        ttsProvider: settings.ttsProvider || 'elevenlabs',
        csmEnabled: !!settings.csmEnabled,
        csmSpeaker: Number.isFinite(settings.csmSpeaker) ? settings.csmSpeaker : 0,
        csmVoiceLabel: settings.csmVoiceLabel || '',
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
        includeAutomatedDisclosure: settings.includeAutomatedDisclosure ?? true,
      },
      credits,
      isConfigured: !!(
        settings.twilioAccountSid &&
        settings.twilioAuthToken &&
        settings.twilioPhoneNumber &&
        settings.forwardToNumber
      ),
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const body = await request.json();
    const current = await getSettings(userId);
    const managedMode = isManagedModeEnvEnabled() || current.managedMode;
    const assignOnRegistration = shouldAssignManagedNumberOnRegistration();
    
    const toSave: Record<string, string | number | boolean> = {};
    
    // Handle API keys (only save if not masked)
    if (!managedMode && body.elevenLabsApiKey && !body.elevenLabsApiKey.includes('•')) {
      toSave.elevenLabsApiKey = body.elevenLabsApiKey;
    }
    if (body.ttsProvider === 'elevenlabs' || body.ttsProvider === 'csm') {
      toSave.ttsProvider = body.ttsProvider;
    }
    if (typeof body.csmEnabled === 'boolean') {
      toSave.csmEnabled = body.csmEnabled;
    }
    if (body.csmSpeaker !== undefined) {
      const csmSpeaker = Number(body.csmSpeaker);
      if (Number.isFinite(csmSpeaker) && csmSpeaker >= 0) {
        toSave.csmSpeaker = Math.floor(csmSpeaker);
      }
    }
    if (typeof body.csmVoiceLabel === 'string') {
      toSave.csmVoiceLabel = body.csmVoiceLabel.trim();
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
    if (typeof body.forwardToNumber === 'string') {
      toSave.forwardToNumber = body.forwardToNumber.trim();
    }
    if (typeof body.assignedPhoneNumber === 'string') {
      toSave.assignedPhoneNumber = body.assignedPhoneNumber.trim();
    }
    if (typeof body.businessName === 'string') {
      toSave.businessName = body.businessName.trim();
    }
    if (typeof body.industry === 'string') {
      toSave.industry = body.industry.trim();
    }
    if (typeof body.companyDetails === 'string') {
      toSave.companyDetails = body.companyDetails.trim();
    }
    if (typeof body.sayThisRules === 'string') {
      toSave.sayThisRules = body.sayThisRules.trim();
    }
    if (typeof body.avoidThisRules === 'string') {
      toSave.avoidThisRules = body.avoidThisRules.trim();
    }
    if (typeof body.includeAutomatedDisclosure === 'boolean') {
      toSave.includeAutomatedDisclosure = body.includeAutomatedDisclosure;
    }
    
    // Handle boolean settings
    if (typeof body.recordCalls === 'boolean') {
      toSave.recordCalls = body.recordCalls;
    }
    if (typeof body.transcribeCalls === 'boolean') {
      toSave.transcribeCalls = body.transcribeCalls;
    }
    
    await saveSettings(toSave, userId);

    let assignedPhoneNumber = current.assignedPhoneNumber || '';
    if (managedMode && assignOnRegistration && !assignedPhoneNumber) {
      assignedPhoneNumber = await assignManagedNumber(userId);
    }

    const latest = await getSettings(userId);

    resetClient();
    
    return NextResponse.json({
      success: true,
      credits: await getCredits(userId),
      assignedPhoneNumber: latest.assignedPhoneNumber || assignedPhoneNumber,
      managedMode: isManagedModeEnvEnabled() || latest.managedMode,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireUserIdFromRequest(request);
    return NextResponse.json(
      { error: 'Direct credit updates are disabled. Use billing checkout endpoints.' },
      { status: 403 }
    );
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
  }
}

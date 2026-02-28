import { v4 as uuidv4 } from 'uuid';
import { applyCallerIdentityKpiDelta, getCallerIdentity } from '@/lib/caller-identity-store';
import { getCampaign, getSettings, saveCampaign, updateCampaignResult, updateCredits } from '@/lib/store';
import { makeCall } from '@/lib/twilio';
import { Campaign, CallResult } from '@/lib/types';
import { resolvePublicAppUrl } from '@/lib/public-app-url';

function normalizePhoneKey(raw: string): string {
  return String(raw || '').replace(/[^\d+]/g, '');
}

export async function runCampaign(campaign: Campaign): Promise<void> {
  const settings = await getSettings(campaign.userId);
  const selectedIdentity = campaign.callerIdentityId
    ? await getCallerIdentity(campaign.callerIdentityId, campaign.userId)
    : null;
  const fromNumber = selectedIdentity?.dedicatedNumber || settings.twilioPhoneNumber;
  const webhookUrl = resolvePublicAppUrl();

  if (campaign.callerIdentityId && !selectedIdentity?.dedicatedNumber) {
    const latest = await getCampaign(campaign.id, campaign.userId);
    if (latest && latest.status === 'running') {
      latest.status = 'stopped';
      await saveCampaign(latest);
    }
    return;
  }

  for (let i = 0; i < campaign.numbers.length; i++) {
    const currentCampaign = await getCampaign(campaign.id, campaign.userId);
    if (!currentCampaign || currentCampaign.status !== 'running') {
      break;
    }

    const number = campaign.numbers[i];
    const existingResult = (currentCampaign.results || []).find(result =>
      normalizePhoneKey(result.phoneNumber) === normalizePhoneKey(number)
    );

    const result: CallResult = {
      id: existingResult?.id || uuidv4(),
      campaignId: campaign.id,
      phoneNumber: number,
      status: 'calling',
      timestamp: new Date(),
      userComment: existingResult?.userComment,
      targetComment: existingResult?.targetComment,
      callComment: existingResult?.callComment || 'Dialing lead',
      followUpRequested: existingResult?.followUpRequested,
      followUpAt: existingResult?.followUpAt,
      followUpStatus: existingResult?.followUpStatus,
      followUpCampaignId: existingResult?.followUpCampaignId,
    };

    await updateCampaignResult(campaign.id, result);

    try {
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
          callerName: campaign.callerIdentityName,
          callerPosition: campaign.callerPosition,
          voiceId: campaign.voiceId,
          fromNumber,
          mode: 'conversation',
          userId: campaign.userId,
        }
      );

      await updateCredits(-1, campaign.userId);
      if (campaign.callerIdentityId) {
        await applyCallerIdentityKpiDelta(campaign.callerIdentityId, {
          totalCalls: 1,
          creditsUsed: 1,
          lastCalledAt: new Date(),
        }, campaign.userId);
      }

      result.callSid = call.sid;
      result.status = 'calling';
      result.callComment = 'Call initiated';
      await updateCampaignResult(campaign.id, result);

      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error: any) {
      result.status = 'failed';
      result.error = error.message;
      await updateCampaignResult(campaign.id, result);
    }

    if (currentCampaign) {
      currentCampaign.currentIndex = i + 1;
      await saveCampaign(currentCampaign);
    }
  }

  const finalCampaign = await getCampaign(campaign.id, campaign.userId);
  if (finalCampaign && finalCampaign.status === 'running') {
    finalCampaign.status = 'completed';
    finalCampaign.completedAt = new Date();
    await saveCampaign(finalCampaign);
  }
}

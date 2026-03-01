import { v4 as uuidv4 } from 'uuid';
import { applyCallerIdentityKpiDelta, getCallerIdentity } from '@/lib/caller-identity-store';
import { getCampaign, getSettings, saveCampaign, updateCampaignResult, updateCredits } from '@/lib/store';
import { makeCall } from '@/lib/twilio';
import { Campaign, CallResult } from '@/lib/types';
import { resolvePublicAppUrl } from '@/lib/public-app-url';
import { getQuietHoursDecision, resolveLeadTimeZone } from '@/lib/compliance';
import { getSuppressionForNumber } from '@/lib/compliance-store';

function normalizePhoneKey(raw: string): string {
  return String(raw || '').replace(/[^\d+]/g, '');
}

async function ensureQuietHoursFollowUpCampaign(params: {
  parent: Campaign;
  phoneNumber: string;
  leadTimezone?: string;
  nextAllowedAt?: Date;
  existingFollowUpCampaignId?: string;
  callComment: string;
}): Promise<string | undefined> {
  if (!params.nextAllowedAt) return undefined;

  const existingFollowUpCampaignId = String(params.existingFollowUpCampaignId || '').trim();
  if (existingFollowUpCampaignId) {
    const existing = await getCampaign(existingFollowUpCampaignId, params.parent.userId);
    if (existing && (existing.status === 'scheduled' || existing.status === 'running' || existing.status === 'pending')) {
      return existing.id;
    }
  }

  const followUpCampaignId = uuidv4();
  const followUpCampaign: Campaign = {
    id: followUpCampaignId,
    userId: params.parent.userId,
    name: `${params.parent.name} · Quiet-Hours Follow-up`,
    status: 'scheduled',
    voiceId: params.parent.voiceId,
    language: params.parent.language,
    callerIdentityId: params.parent.callerIdentityId,
    callerIdentityName: params.parent.callerIdentityName,
    callerPosition: params.parent.callerPosition,
    script: params.parent.script,
    numbers: [params.phoneNumber],
    currentIndex: 0,
    results: [
      {
        id: uuidv4(),
        campaignId: followUpCampaignId,
        phoneNumber: params.phoneNumber,
        status: 'pending',
        timestamp: new Date(),
        leadTimezone: params.leadTimezone,
        callComment: params.callComment,
      },
    ],
    createdAt: new Date(),
    scheduledAt: params.nextAllowedAt,
    recordCalls: params.parent.recordCalls,
    transcribeCalls: params.parent.transcribeCalls,
  };

  await saveCampaign(followUpCampaign);
  return followUpCampaignId;
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
      status: 'pending',
      timestamp: new Date(),
      userComment: existingResult?.userComment,
      targetComment: existingResult?.targetComment,
      leadTimezone: existingResult?.leadTimezone,
      callComment: existingResult?.callComment || 'Queued for compliance checks',
      followUpRequested: existingResult?.followUpRequested,
      followUpAt: existingResult?.followUpAt,
      followUpStatus: existingResult?.followUpStatus,
      followUpCampaignId: existingResult?.followUpCampaignId,
    };

    const suppression = await getSuppressionForNumber(campaign.userId, number);
    if (suppression) {
      result.status = 'failed';
      result.error = 'Suppressed (Do Not Call / Opt-out)';
      result.callComment = `Skipped by suppression list: ${suppression.reason || 'Do Not Call'}`;
      result.leadRequest = suppression.reason || 'Suppressed by compliance';
      result.followUpRequested = false;
      result.followUpStatus = 'cancelled';
      await updateCampaignResult(campaign.id, result);
      continue;
    }

    const leadTimezone = resolveLeadTimeZone(result.leadTimezone);
    result.leadTimezone = leadTimezone;
    const quietHours = getQuietHoursDecision({ timeZone: leadTimezone });
    if (!quietHours.allowed) {
      const nextAllowedAt = quietHours.nextAllowedAt;
      const callComment =
        `Deferred by quiet-hours policy (${quietHours.startHour}:00-${quietHours.endHour}:00 ${leadTimezone}).`;

      const followUpCampaignId = await ensureQuietHoursFollowUpCampaign({
        parent: currentCampaign,
        phoneNumber: number,
        leadTimezone,
        nextAllowedAt,
        existingFollowUpCampaignId: result.followUpCampaignId,
        callComment,
      });

      result.status = 'pending';
      result.callComment = nextAllowedAt
        ? `${callComment} Auto-rescheduled for ${nextAllowedAt.toISOString()}.`
        : callComment;
      result.followUpRequested = true;
      result.followUpStatus = 'scheduled';
      result.followUpAt = nextAllowedAt;
      result.followUpCampaignId = followUpCampaignId;
      await updateCampaignResult(campaign.id, result);
      continue;
    }

    result.status = 'calling';
    result.callComment = 'Dialing lead';
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

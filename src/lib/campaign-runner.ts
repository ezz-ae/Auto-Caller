import { v4 as uuidv4 } from 'uuid';
import { applyCallerIdentityKpiDelta, getCallerIdentity } from '@/lib/caller-identity-store';
import { getCampaign, getSettings, saveCampaign, updateCampaignResult, updateCredits } from '@/lib/store';
import { recordBillingEventOnce } from '@/lib/billing-events';
import { makeCall } from '@/lib/twilio';
import { Campaign, CallResult } from '@/lib/types';
import { resolvePublicAppUrl } from '@/lib/public-app-url';
import { getQuietHoursDecision, resolveLeadTimeZone } from '@/lib/compliance';
import { getSuppressionForNumber } from '@/lib/compliance-store';
import { acquireCampaignSlot } from '@/lib/campaign-concurrency';

function normalizePhoneKey(raw: string): string {
  return String(raw || '').replace(/[^\d+]/g, '');
}

function envInt(name: string, fallback: number): number {
  const parsed = Number(process.env[name] || '');
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
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
  const slot = acquireCampaignSlot(campaign.id, campaign.userId);
  if (!slot.ok) {
    const latest = await getCampaign(campaign.id, campaign.userId);
    if (latest && latest.status === 'running') {
      latest.status = 'scheduled';
      latest.scheduledAt = new Date(Date.now() + 2 * 60 * 1000);
      await saveCampaign(latest);
    }
    return;
  }

  const maxRetries = envInt('CALL_ATTEMPT_MAX_RETRIES', 1);
  const retryBaseMs = envInt('CALL_ATTEMPT_RETRY_BASE_MS', 2000);

  try {
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
      callAttemptState: 'queued',
      attemptCount: existingResult?.attemptCount || 0,
      timestamp: new Date(),
      userComment: existingResult?.userComment,
      targetComment: existingResult?.targetComment,
      leadTimezone: existingResult?.leadTimezone,
      callComment: existingResult?.callComment || 'Queued for compliance checks',
      followUpRequested: existingResult?.followUpRequested,
      followUpAt: existingResult?.followUpAt,
      followUpStatus: existingResult?.followUpStatus,
      followUpCampaignId: existingResult?.followUpCampaignId,
      billingEventId: existingResult?.billingEventId,
      billedAt: existingResult?.billedAt,
    };

    const suppression = await getSuppressionForNumber(campaign.userId, number);
    if (suppression) {
      result.status = 'failed';
      result.callAttemptState = 'suppressed';
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
      result.callAttemptState = 'deferred_quiet_hours';
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
    result.callAttemptState = 'dialing';
    result.attemptCount = 0;
    result.callComment = 'Dialing lead';
    await updateCampaignResult(campaign.id, result);

    try {
      let call: { sid: string; status: string } | null = null;
      let lastError: any = null;

      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        result.attemptCount = attempt + 1;
        result.callAttemptState = attempt === 0 ? 'dialing' : 'retrying';
        result.callComment =
          attempt === 0
            ? 'Dialing lead'
            : `Retrying dial attempt ${attempt + 1} of ${maxRetries + 1}`;
        await updateCampaignResult(campaign.id, result);

        try {
          call = await makeCall(
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
          break;
        } catch (error: any) {
          lastError = error;
          if (attempt >= maxRetries) {
            break;
          }
          const delay = retryBaseMs * Math.max(1, 2 ** attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      if (!call) {
        throw lastError || new Error('Failed to initiate call');
      }

      const billingEventId = `call_attempt:${campaign.id}:${result.id}`;
      const billingEvent = await recordBillingEventOnce({
        id: billingEventId,
        userId: campaign.userId,
        kind: 'call_attempt',
        amount: -1,
        status: 'applied',
        metadata: {
          campaignId: campaign.id,
          resultId: result.id,
          phoneNumber: number,
          callSid: call.sid,
        },
      });

      if (billingEvent.created) {
        await updateCredits(-1, campaign.userId);
        if (campaign.callerIdentityId) {
          await applyCallerIdentityKpiDelta(campaign.callerIdentityId, {
            totalCalls: 1,
            creditsUsed: 1,
            lastCalledAt: new Date(),
          }, campaign.userId);
        }
      }

      result.callSid = call.sid;
      result.status = 'calling';
      result.callAttemptState = 'initiated';
      result.callComment = billingEvent.created ? 'Call initiated' : 'Call initiated (billing already applied)';
      result.billingEventId = billingEventId;
      result.billedAt = billingEvent.event.createdAt;
      await updateCampaignResult(campaign.id, result);

      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error: any) {
      result.status = 'failed';
      result.callAttemptState = 'failed';
      result.error = error.message;
      result.callComment = `Dial failed after ${maxRetries + 1} attempt(s)`;
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
  } finally {
    slot.release?.();
  }
}

import { getCampaign, updateCampaignResultByCallSid } from '@/lib/store';
import { CallResult } from '@/lib/types';

function getParentFollowUpPatch(
  childStatus: CallResult['status'],
  childPhoneNumber: string
): Partial<CallResult> | null {
  if (childStatus === 'connected' || childStatus === 'forwarded') {
    return {
      followUpStatus: 'completed',
      callComment: `Auto callback completed for ${childPhoneNumber}`,
    };
  }

  if (childStatus === 'failed' || childStatus === 'no-answer' || childStatus === 'voicemail') {
    return {
      followUpStatus: 'cancelled',
      callComment: `Auto callback ended without connection (${childStatus})`,
    };
  }

  return null;
}

export async function syncParentFollowUpStatusFromChild(params: {
  campaignId?: string;
  resultId?: string;
  childStatus: CallResult['status'];
}) {
  if (!params.campaignId || !params.resultId) return;

  const campaign = await getCampaign(params.campaignId);
  const childResult = campaign?.results.find(result => result.id === params.resultId);
  if (!childResult?.parentCallSid) return;

  const patch = getParentFollowUpPatch(params.childStatus, childResult.phoneNumber);
  if (!patch) return;

  await updateCampaignResultByCallSid(childResult.parentCallSid, patch);
}

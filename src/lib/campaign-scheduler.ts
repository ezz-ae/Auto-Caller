import { getAllCampaigns, getCampaign, saveCampaign } from '@/lib/store';
import { runCampaign } from '@/lib/campaign-runner';

export async function dispatchDueScheduledCampaigns(): Promise<{
  checked: number;
  due: number;
  dispatched: number;
}> {
  const campaigns = await getAllCampaigns();
  const now = Date.now();
  let dispatched = 0;

  const dueCampaigns = campaigns.filter(campaign => {
    if (campaign.status !== 'scheduled' || !campaign.scheduledAt) return false;
    return new Date(campaign.scheduledAt).getTime() <= now;
  });

  for (const campaign of dueCampaigns) {
    const latest = await getCampaign(campaign.id);
    if (!latest || latest.status !== 'scheduled' || !latest.scheduledAt) continue;
    if (new Date(latest.scheduledAt).getTime() > now) continue;

    latest.status = 'running';
    latest.scheduledAt = undefined;
    await saveCampaign(latest);
    dispatched += 1;

    void runCampaign(latest).catch(error => {
      console.error('Scheduled campaign runner failed:', latest.id, error);
    });
  }

  return {
    checked: campaigns.length,
    due: dueCampaigns.length,
    dispatched,
  };
}

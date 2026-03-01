const activeCampaigns = new Set<string>();
const activeByUser = new Map<string, number>();

function getLimit(name: string, fallback: number): number {
  const parsed = Number(process.env[name] || '');
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

const MAX_GLOBAL = getLimit('CALL_MAX_CONCURRENT_GLOBAL', 3);
const MAX_PER_USER = getLimit('CALL_MAX_CONCURRENT_PER_USER', 1);

export function acquireCampaignSlot(campaignId: string, userId: string): { ok: boolean; reason?: string; release?: () => void } {
  if (activeCampaigns.has(campaignId)) {
    return { ok: true, release: () => {} };
  }

  const perUser = activeByUser.get(userId) || 0;
  if (activeCampaigns.size >= MAX_GLOBAL) {
    return { ok: false, reason: `Global concurrency cap reached (${MAX_GLOBAL})` };
  }
  if (perUser >= MAX_PER_USER) {
    return { ok: false, reason: `Per-account concurrency cap reached (${MAX_PER_USER})` };
  }

  activeCampaigns.add(campaignId);
  activeByUser.set(userId, perUser + 1);

  return {
    ok: true,
    release: () => {
      if (!activeCampaigns.has(campaignId)) return;
      activeCampaigns.delete(campaignId);
      const current = activeByUser.get(userId) || 0;
      const next = Math.max(0, current - 1);
      if (next === 0) {
        activeByUser.delete(userId);
      } else {
        activeByUser.set(userId, next);
      }
    },
  };
}

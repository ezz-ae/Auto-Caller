export interface CallResultLike {
  id?: string;
  campaignId?: string;
  phoneNumber: string;
  status: string;
  timestamp: string | Date;
  callComment?: string;
  leadSummary?: string;
  leadRequest?: string;
  userComment?: string;
  targetComment?: string;
  followUpRequested?: boolean;
  followUpAt?: string | Date;
  followUpStatus?: string;
  followUpCampaignId?: string;
}

export interface CampaignLike {
  id: string;
  name: string;
  results?: CallResultLike[];
}

export interface LeadTimelineItem {
  campaignId: string;
  campaignName: string;
  timestamp: string;
  status: string;
  callComment?: string;
  leadSummary?: string;
  leadRequest?: string;
  userComment?: string;
  targetComment?: string;
  followUpAt?: string;
  followUpStatus?: string;
  followUpCampaignId?: string;
}

export interface LeadProfile {
  phoneNumber: string;
  totalCalls: number;
  connectedCalls: number;
  failedCalls: number;
  noAnswerCalls: number;
  firstSeenAt?: string;
  lastActivityAt?: string;
  latestUserComment?: string;
  latestTargetComment?: string;
  latestCallComment?: string;
  latestLeadSummary?: string;
  timeline: LeadTimelineItem[];
}

export interface CallbackTask {
  phoneNumber: string;
  callbackAt: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  parentCampaignId: string;
  parentCampaignName: string;
  followUpCampaignId?: string;
  reason?: string;
  userComment?: string;
  targetComment?: string;
  callComment?: string;
}

export interface DailyReport {
  date: string;
  totalCalls: number;
  connectedCalls: number;
  forwardedCalls: number;
  failedCalls: number;
  noAnswerCalls: number;
  followUpsScheduled: number;
  followUpsCompleted: number;
  followUpsCancelled: number;
  leadsTouched: number;
  highlights: string[];
  recommendations: string[];
}

function normalizePhoneKey(raw: string): string {
  return String(raw || '').replace(/[^\d+]/g, '');
}

function toIso(value: string | Date | undefined | null): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function toDate(value: string | Date | undefined | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function dateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function statusKey(status: string): string {
  const value = String(status || '').toLowerCase();
  if (value === 'connected') return 'connected';
  if (value === 'forwarded') return 'forwarded';
  if (value === 'failed') return 'failed';
  if (value === 'no-answer') return 'no-answer';
  if (value === 'calling') return 'calling';
  if (value === 'pending') return 'pending';
  if (value === 'voicemail') return 'voicemail';
  return 'other';
}

function extractResultTimestamp(result: CallResultLike): string {
  return toIso(result.timestamp) || new Date().toISOString();
}

export function buildLeadProfiles(campaigns: CampaignLike[]): LeadProfile[] {
  const leadMap = new Map<string, LeadProfile>();

  for (const campaign of campaigns) {
    for (const result of campaign.results || []) {
      const key = normalizePhoneKey(result.phoneNumber);
      if (!key) continue;

      const timestamp = extractResultTimestamp(result);
      const existing = leadMap.get(key) || {
        phoneNumber: result.phoneNumber,
        totalCalls: 0,
        connectedCalls: 0,
        failedCalls: 0,
        noAnswerCalls: 0,
        firstSeenAt: timestamp,
        lastActivityAt: timestamp,
        latestUserComment: result.userComment,
        latestTargetComment: result.targetComment,
        latestCallComment: result.callComment,
        latestLeadSummary: result.leadSummary,
        timeline: [],
      };

      existing.totalCalls += 1;
      const status = statusKey(result.status);
      if (status === 'connected' || status === 'forwarded') existing.connectedCalls += 1;
      if (status === 'failed') existing.failedCalls += 1;
      if (status === 'no-answer') existing.noAnswerCalls += 1;

      if (!existing.firstSeenAt || timestamp < existing.firstSeenAt) {
        existing.firstSeenAt = timestamp;
      }
      if (!existing.lastActivityAt || timestamp > existing.lastActivityAt) {
        existing.lastActivityAt = timestamp;
        existing.latestUserComment = result.userComment || existing.latestUserComment;
        existing.latestTargetComment = result.targetComment || existing.latestTargetComment;
        existing.latestCallComment = result.callComment || existing.latestCallComment;
        existing.latestLeadSummary = result.leadSummary || existing.latestLeadSummary;
      }

      existing.timeline.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        timestamp,
        status: result.status,
        callComment: result.callComment,
        leadSummary: result.leadSummary,
        leadRequest: result.leadRequest,
        userComment: result.userComment,
        targetComment: result.targetComment,
        followUpAt: toIso(result.followUpAt),
        followUpStatus: result.followUpStatus,
        followUpCampaignId: result.followUpCampaignId,
      });

      leadMap.set(key, existing);
    }
  }

  return Array.from(leadMap.values())
    .map(profile => ({
      ...profile,
      timeline: profile.timeline.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1)),
    }))
    .sort((a, b) => {
      const aTs = a.lastActivityAt || '';
      const bTs = b.lastActivityAt || '';
      return bTs.localeCompare(aTs);
    });
}

export function buildCallbackQueue(campaigns: CampaignLike[]): CallbackTask[] {
  const tasks: CallbackTask[] = [];

  for (const campaign of campaigns) {
    for (const result of campaign.results || []) {
      if (!result.followUpRequested || !result.followUpAt) continue;

      tasks.push({
        phoneNumber: result.phoneNumber,
        callbackAt: toIso(result.followUpAt) || new Date().toISOString(),
        status: (result.followUpStatus as CallbackTask['status']) || 'scheduled',
        parentCampaignId: campaign.id,
        parentCampaignName: campaign.name,
        followUpCampaignId: result.followUpCampaignId,
        reason: result.leadRequest,
        userComment: result.userComment,
        targetComment: result.targetComment,
        callComment: result.callComment,
      });
    }
  }

  return tasks.sort((a, b) => a.callbackAt.localeCompare(b.callbackAt));
}

export function buildDailyReport(campaigns: CampaignLike[], targetDate?: Date): DailyReport {
  const day = targetDate || new Date();
  const dayIso = dateKey(day);
  const dayResults: CallResultLike[] = [];

  for (const campaign of campaigns) {
    for (const result of campaign.results || []) {
      const timestamp = toDate(result.timestamp);
      if (!timestamp) continue;
      if (dateKey(timestamp) === dayIso) {
        dayResults.push(result);
      }
    }
  }

  const totalCalls = dayResults.length;
  const connectedCalls = dayResults.filter(result => ['connected', 'forwarded'].includes(String(result.status))).length;
  const forwardedCalls = dayResults.filter(result => String(result.status) === 'forwarded').length;
  const failedCalls = dayResults.filter(result => String(result.status) === 'failed').length;
  const noAnswerCalls = dayResults.filter(result => String(result.status) === 'no-answer').length;
  const followUpsScheduled = dayResults.filter(result => result.followUpStatus === 'scheduled').length;
  const followUpsCompleted = dayResults.filter(result => result.followUpStatus === 'completed').length;
  const followUpsCancelled = dayResults.filter(result => result.followUpStatus === 'cancelled').length;
  const leadsTouched = new Set(dayResults.map(result => normalizePhoneKey(result.phoneNumber))).size;

  const highlights = dayResults
    .sort((a, b) => {
      const aTs = extractResultTimestamp(a);
      const bTs = extractResultTimestamp(b);
      return bTs.localeCompare(aTs);
    })
    .filter(result => result.leadSummary || result.callComment)
    .slice(0, 6)
    .map(result => `${result.phoneNumber}: ${result.leadSummary || result.callComment || result.status}`);

  const recommendations: string[] = [];
  if (totalCalls === 0) {
    recommendations.push('No calls logged for this day. Queue a campaign or run scheduled follow-ups.');
  } else {
    const connectionRate = connectedCalls / totalCalls;
    if (connectionRate < 0.25) {
      recommendations.push('Connection rate is low. Test a different call window and tighten target qualification.');
    }
    if (noAnswerCalls > connectedCalls) {
      recommendations.push('No-answer volume is high. Trigger callback queue with staggered retry windows.');
    }
    if (failedCalls > 0) {
      recommendations.push('Review failed calls for carrier/number validity before the next batch.');
    }
    if (followUpsScheduled === 0 && connectedCalls > 0) {
      recommendations.push('Add follow-up prompts in conversations to increase scheduled callbacks.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Call operations are healthy. Keep follow-up queue active and expand high-performing segments.');
    }
  }

  return {
    date: dayIso,
    totalCalls,
    connectedCalls,
    forwardedCalls,
    failedCalls,
    noAnswerCalls,
    followUpsScheduled,
    followUpsCompleted,
    followUpsCancelled,
    leadsTouched,
    highlights,
    recommendations,
  };
}

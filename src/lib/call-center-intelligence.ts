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

export interface WorkspaceAction {
  id: string;
  title: string;
  detail: string;
  tab: 'overview' | 'agents' | 'call' | 'callers' | 'recordings' | 'leads' | 'callbacks' | 'history' | 'billing' | 'settings';
  priority: 'high' | 'medium' | 'low';
}

export interface WorkspaceIntelligence {
  healthScore: number;
  status: 'critical' | 'needs_attention' | 'ready' | 'high_performing';
  summary: string;
  risks: string[];
  wins: string[];
  coachingTips: string[];
  nextActions: WorkspaceAction[];
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

export function buildWorkspaceIntelligence(input: {
  campaigns: CampaignLike[];
  credits: number;
  preparedNumbers: number;
  callerIdentities: number;
  callerNumbersActive: number;
  managedMode: boolean;
  hasForwardingNumber: boolean;
  hasTargetBlueprint: boolean;
  scheduledCallbacks: number;
  callbacksDueNow: number;
  hasAgentSession: boolean;
}): WorkspaceIntelligence {
  const daily = buildDailyReport(input.campaigns, new Date());
  const totalCalls = input.campaigns.reduce((sum, campaign) => sum + (campaign.results?.length || 0), 0);
  const connectedCalls = input.campaigns.reduce(
    (sum, campaign) =>
      sum +
      (campaign.results || []).filter(result => {
        const status = String(result.status).toLowerCase();
        return status === 'connected' || status === 'forwarded';
      }).length,
    0
  );
  const connectionRate = totalCalls > 0 ? connectedCalls / totalCalls : 0;

  const readinessChecks = [
    input.hasForwardingNumber,
    input.callerIdentities > 0,
    input.hasTargetBlueprint,
    input.preparedNumbers > 0,
    input.credits > 0,
    input.managedMode ? input.callerNumbersActive > 0 : true,
    input.hasAgentSession,
  ];
  const readinessScore = Math.round((readinessChecks.filter(Boolean).length / readinessChecks.length) * 100);

  const operationsScore = (() => {
    if (totalCalls === 0) return input.preparedNumbers > 0 ? 45 : 35;
    const quality = Math.round(connectionRate * 100);
    const callbackBonus = Math.min(15, input.scheduledCallbacks * 2);
    const penalty = Math.min(20, daily.failedCalls * 2);
    return Math.max(25, Math.min(95, quality + callbackBonus - penalty + 20));
  })();

  const healthScore = Math.round(readinessScore * 0.55 + operationsScore * 0.45);
  const status: WorkspaceIntelligence['status'] =
    healthScore < 45 ? 'critical' : healthScore < 70 ? 'needs_attention' : healthScore < 88 ? 'ready' : 'high_performing';

  const risks: string[] = [];
  if (!input.hasForwardingNumber) risks.push('Forwarding number is missing. Warm leads cannot be transferred.');
  if (input.callerIdentities === 0) risks.push('No caller identity exists yet, so campaigns cannot launch.');
  if (input.preparedNumbers > 0 && input.credits < input.preparedNumbers) {
    risks.push(`Credit shortfall detected (${input.preparedNumbers - input.credits} more credits needed for queued numbers).`);
  }
  if (input.managedMode && input.callerNumbersActive === 0) {
    risks.push('No dedicated caller number is active in managed mode.');
  }
  if (input.callbacksDueNow > 0) {
    risks.push(`${input.callbacksDueNow} callbacks are due now and should be dispatched first.`);
  }
  if (totalCalls > 0 && connectionRate < 0.2) {
    risks.push('Connection rate is low. Improve lead quality and calling window.');
  }

  const wins: string[] = [];
  if (input.callerIdentities > 0) wins.push(`${input.callerIdentities} caller identities are configured.`);
  if (input.hasTargetBlueprint) wins.push('Target blueprint is present and ready for adaptive conversations.');
  if (daily.followUpsScheduled > 0) wins.push(`${daily.followUpsScheduled} follow-ups were scheduled today.`);
  if (totalCalls > 0 && connectionRate >= 0.35) wins.push(`Healthy connection rate (${Math.round(connectionRate * 100)}%).`);
  if (input.credits >= 60) wins.push('Credit runway is healthy for medium-sized batches.');
  if (wins.length === 0) wins.push('Workspace is initialized and ready for guided setup.');

  const coachingTips: string[] = [];
  if (!input.hasTargetBlueprint) coachingTips.push('Define a tighter offer + qualification + CTA before launching.');
  if (input.preparedNumbers > 0 && input.callerIdentities > 0) coachingTips.push('Run a 10-20 lead pilot batch before full list rollout.');
  if (totalCalls > 0 && daily.noAnswerCalls > daily.connectedCalls) coachingTips.push('Retry no-answer leads in a different time window.');
  if (input.callbacksDueNow > 0) coachingTips.push('Prioritize due callbacks first; these have the highest conversion intent.');
  if (coachingTips.length === 0) coachingTips.push('Current flow is healthy. Scale gradually and monitor callback completion.');

  const nextActions: WorkspaceAction[] = [];
  if (!input.hasForwardingNumber) {
    nextActions.push({
      id: 'set-forward',
      title: 'Set forwarding number',
      detail: 'Required to hand warm leads to your team.',
      tab: 'settings',
      priority: 'high',
    });
  }
  if (input.callerIdentities === 0) {
    nextActions.push({
      id: 'create-caller',
      title: 'Create first caller identity',
      detail: 'Set name, role, language, and voice before campaign launch.',
      tab: 'callers',
      priority: 'high',
    });
  }
  if (input.managedMode && input.callerNumbersActive === 0) {
    nextActions.push({
      id: 'buy-number',
      title: 'Activate caller number',
      detail: 'Each managed caller identity needs a dedicated number.',
      tab: 'billing',
      priority: 'high',
    });
  }
  if (input.preparedNumbers > 0 && input.credits < input.preparedNumbers) {
    nextActions.push({
      id: 'add-credits',
      title: 'Top up credits',
      detail: `Queue size is ${input.preparedNumbers}; current credits are ${input.credits}.`,
      tab: 'billing',
      priority: 'high',
    });
  }
  if (input.preparedNumbers === 0) {
    nextActions.push({
      id: 'upload-leads',
      title: 'Upload lead numbers',
      detail: 'Import CSV or paste numbers to build a campaign queue.',
      tab: 'call',
      priority: 'medium',
    });
  }
  if (input.callbacksDueNow > 0) {
    nextActions.push({
      id: 'run-callbacks',
      title: 'Dispatch due callbacks',
      detail: `${input.callbacksDueNow} leads asked to be called back now.`,
      tab: 'callbacks',
      priority: 'high',
    });
  }
  if (!input.hasAgentSession) {
    nextActions.push({
      id: 'start-agent',
      title: 'Start workspace agent',
      detail: 'Use an agent to collect strategy and generate campaign structure conversationally.',
      tab: 'agents',
      priority: 'medium',
    });
  }
  if (nextActions.length === 0) {
    nextActions.push({
      id: 'launch-batch',
      title: 'Launch next batch',
      detail: 'Run a controlled batch and monitor connection + callback rates.',
      tab: 'call',
      priority: 'low',
    });
  }

  const summary =
    status === 'critical'
      ? 'Workspace needs immediate setup attention before launch.'
      : status === 'needs_attention'
        ? 'Core setup exists, but key gaps are reducing conversion efficiency.'
        : status === 'ready'
          ? 'Workspace is ready for structured campaign execution.'
          : 'Workspace is performing strongly. Focus on scaling and callback discipline.';

  return {
    healthScore,
    status,
    summary,
    risks,
    wins,
    coachingTips,
    nextActions: nextActions.slice(0, 5),
  };
}

import type { CallResult } from '@/lib/types';

export type PursuitState = NonNullable<CallResult['pursuitState']>;

export function derivePursuitState(input: Partial<CallResult>): PursuitState {
  const status = String(input.status || '').toLowerCase();
  const callAttemptState = String(input.callAttemptState || '').toLowerCase();
  const leadRequest = String(input.leadRequest || '').toLowerCase();
  const callComment = String(input.callComment || '').toLowerCase();
  const followUpStatus = String(input.followUpStatus || '').toLowerCase();

  if (
    callAttemptState === 'suppressed' ||
    leadRequest.includes('opted out') ||
    leadRequest.includes('do not call') ||
    callComment.includes('suppression') ||
    callComment.includes('do not call')
  ) {
    return 'DNC';
  }

  if (status === 'failed' || callAttemptState === 'failed') {
    return 'FAILED';
  }

  if (followUpStatus === 'scheduled' || callAttemptState === 'deferred_quiet_hours') {
    return 'RETRY_SCHEDULED';
  }

  if (status === 'forwarded') {
    return 'SUCCESS';
  }

  if (status === 'no-answer') {
    return 'NO_ANSWER';
  }

  if (status === 'connected') {
    const qualifiedSignal =
      callComment.includes('qualified') ||
      callComment.includes('transferring') ||
      leadRequest.includes('qualified') ||
      leadRequest.includes('warm');
    return qualifiedSignal ? 'QUALIFIED' : 'ENGAGED';
  }

  if (status === 'calling' || ['dialing', 'retrying', 'initiated'].includes(callAttemptState)) {
    return 'ATTEMPTED';
  }

  return 'NEW';
}

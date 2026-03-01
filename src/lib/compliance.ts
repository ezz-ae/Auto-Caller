const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 21;

const OPT_OUT_PHRASES = [
  'do not call',
  "don't call",
  'dont call',
  'stop calling',
  'remove me',
  'unsubscribe',
  'opt out',
  'wrong number',
  'never call',
];

function toHour(value: string | undefined, fallback: number): number {
  const parsed = Number(value || '');
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(23, Math.floor(parsed)));
}

export function getCallWindowHours(): { startHour: number; endHour: number } {
  const startHour = toHour(process.env.CALL_WINDOW_START_HOUR, DEFAULT_START_HOUR);
  const endHour = toHour(process.env.CALL_WINDOW_END_HOUR, DEFAULT_END_HOUR);
  if (startHour === endHour) {
    return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  }
  return { startHour, endHour };
}

function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function resolveLeadTimeZone(value?: string): string {
  const requested = String(value || '').trim();
  if (requested && isValidTimeZone(requested)) return requested;

  const fallback = String(process.env.CALL_COMPLIANCE_DEFAULT_TIMEZONE || '').trim();
  if (fallback && isValidTimeZone(fallback)) return fallback;

  return 'Asia/Dubai';
}

function getLocalHour(date: Date, timeZone: string): number {
  const hourText = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
  }).format(date);
  const parsed = Number(hourText);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(23, parsed));
}

function isWithinWindow(hour: number, startHour: number, endHour: number): boolean {
  if (startHour < endHour) return hour >= startHour && hour < endHour;
  return hour >= startHour || hour < endHour;
}

function findNextAllowedTime(now: Date, timeZone: string, startHour: number, endHour: number): Date {
  let candidate = new Date(now.getTime() + 60 * 1000);
  for (let i = 0; i < 60 * 48; i += 1) {
    const localHour = getLocalHour(candidate, timeZone);
    if (isWithinWindow(localHour, startHour, endHour)) {
      return candidate;
    }
    candidate = new Date(candidate.getTime() + 60 * 1000);
  }
  return new Date(now.getTime() + 12 * 60 * 60 * 1000);
}

export function getQuietHoursDecision(params: {
  timeZone?: string;
  date?: Date;
}): {
  allowed: boolean;
  timeZone: string;
  localHour: number;
  startHour: number;
  endHour: number;
  nextAllowedAt?: Date;
} {
  const date = params.date || new Date();
  const timeZone = resolveLeadTimeZone(params.timeZone);
  const { startHour, endHour } = getCallWindowHours();
  const localHour = getLocalHour(date, timeZone);
  const allowed = isWithinWindow(localHour, startHour, endHour);
  if (allowed) {
    return { allowed: true, timeZone, localHour, startHour, endHour };
  }
  return {
    allowed: false,
    timeZone,
    localHour,
    startHour,
    endHour,
    nextAllowedAt: findNextAllowedTime(date, timeZone, startHour, endHour),
  };
}

export function detectOptOutRequest(text: string): { matched: boolean; phrase?: string } {
  const normalized = String(text || '').toLowerCase();
  if (!normalized.trim()) return { matched: false };
  for (const phrase of OPT_OUT_PHRASES) {
    if (normalized.includes(phrase)) {
      return { matched: true, phrase };
    }
  }
  return { matched: false };
}

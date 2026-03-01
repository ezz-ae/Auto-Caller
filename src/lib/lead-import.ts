export interface ParsedLead {
  phoneNumber: string;
  name?: string;
  email?: string;
  payload: Record<string, unknown>;
}

const PHONE_KEY_HINTS = [
  'phone',
  'phone_number',
  'mobile',
  'whatsapp',
  'tel',
  'contact',
];

const NAME_KEY_HINTS = [
  'name',
  'full_name',
  'fullname',
  'customer_name',
  'lead_name',
];

const EMAIL_KEY_HINTS = ['email', 'mail', 'e-mail'];

function normalizeCell(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizePhoneNumber(value: unknown): string {
  const raw = normalizeCell(value);
  if (!raw) return '';

  let cleaned = raw.replace(/[\s().-]+/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = `+${cleaned.slice(2)}`;
  }

  if (cleaned.startsWith('+')) {
    cleaned = `+${cleaned.slice(1).replace(/\D/g, '')}`;
  } else {
    cleaned = cleaned.replace(/\D/g, '');
  }

  const digitCount = cleaned.replace(/\D/g, '').length;
  if (digitCount < 8) return '';
  return cleaned;
}

function hasHint(key: string, hints: string[]): boolean {
  const normalized = key.trim().toLowerCase();
  return hints.some(hint => normalized === hint || normalized.includes(hint));
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function pickByHints(record: Record<string, unknown>, hints: string[]): string {
  for (const [key, value] of Object.entries(record)) {
    if (!hasHint(key, hints)) continue;
    const normalized = normalizeCell(value);
    if (normalized) return normalized;
  }
  return '';
}

function normalizeFacebookFieldData(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};

  const record = payload as Record<string, unknown>;
  const fieldData = Array.isArray(record.field_data) ? record.field_data : [];
  if (!fieldData.length) return record;

  const mapped: Record<string, unknown> = { ...record };
  for (const item of fieldData) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const name = normalizeCell(entry.name);
    if (!name) continue;

    const values = Array.isArray(entry.values) ? entry.values : [];
    mapped[name] = values.length > 0 ? values[0] : '';
  }

  return mapped;
}

function parseRecord(record: Record<string, unknown>): ParsedLead | null {
  const normalizedRecord = normalizeFacebookFieldData(record);

  const hintedPhone = pickByHints(normalizedRecord, PHONE_KEY_HINTS);
  let phoneNumber = normalizePhoneNumber(hintedPhone);

  if (!phoneNumber) {
    for (const value of Object.values(normalizedRecord)) {
      const candidate = normalizePhoneNumber(value);
      if (candidate) {
        phoneNumber = candidate;
        break;
      }
    }
  }

  if (!phoneNumber) return null;

  const hintedName = pickByHints(normalizedRecord, NAME_KEY_HINTS);
  const firstName = normalizeCell(normalizedRecord.first_name);
  const lastName = normalizeCell(normalizedRecord.last_name);
  const fallbackName = [firstName, lastName].filter(Boolean).join(' ').trim();

  const hintedEmail = pickByHints(normalizedRecord, EMAIL_KEY_HINTS);
  const fallbackEmail = Object.values(normalizedRecord)
    .map(value => normalizeCell(value))
    .find(value => looksLikeEmail(value)) || '';

  return {
    phoneNumber,
    name: hintedName || fallbackName || '',
    email: hintedEmail || fallbackEmail || '',
    payload: normalizedRecord,
  };
}

function collectCandidateRecords(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(item => item && typeof item === 'object') as Record<string, unknown>[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const root = payload as Record<string, unknown>;

  const listKeys = ['leads', 'records', 'items', 'data', 'contacts', 'submissions', 'results'];
  for (const key of listKeys) {
    const value = root[key];
    if (Array.isArray(value) && value.length > 0) {
      return value.filter(item => item && typeof item === 'object') as Record<string, unknown>[];
    }
  }

  // Facebook webhook style: entry[].changes[].value
  if (Array.isArray(root.entry)) {
    const records: Record<string, unknown>[] = [];
    for (const entry of root.entry) {
      if (!entry || typeof entry !== 'object') continue;
      const changes = Array.isArray((entry as Record<string, unknown>).changes)
        ? ((entry as Record<string, unknown>).changes as unknown[])
        : [];
      for (const change of changes) {
        if (!change || typeof change !== 'object') continue;
        const value = (change as Record<string, unknown>).value;
        if (value && typeof value === 'object') {
          records.push(value as Record<string, unknown>);
        }
      }
    }
    if (records.length > 0) return records;
  }

  return [root];
}

export function parseLeadsFromPayload(payload: unknown): ParsedLead[] {
  const records = collectCandidateRecords(payload);
  const leads: ParsedLead[] = [];
  const dedupe = new Set<string>();

  for (const record of records) {
    const parsed = parseRecord(record);
    if (!parsed) continue;
    if (dedupe.has(parsed.phoneNumber)) continue;

    dedupe.add(parsed.phoneNumber);
    leads.push(parsed);
  }

  return leads;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentCell = '';
  let currentRow: string[] = [];
  let inQuotes = false;

  const pushCell = () => {
    currentRow.push(currentCell);
    currentCell = '';
  };

  const pushRow = () => {
    if (currentRow.length === 0) return;
    rows.push(currentRow);
    currentRow = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ',') {
      pushCell();
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      pushCell();
      pushRow();
      continue;
    }

    currentCell += char;
  }

  pushCell();
  pushRow();

  return rows.filter(row => row.some(cell => normalizeCell(cell)));
}

function rowsToRecords(rows: string[][]): Record<string, unknown>[] {
  if (rows.length === 0) return [];
  if (rows.length === 1) {
    return rows[0].map(cell => ({ phone: cell }));
  }

  const headerCandidate = rows[0].map(cell => normalizeCell(cell).toLowerCase());
  const headerLooksValid = headerCandidate.some(cell =>
    hasHint(cell, PHONE_KEY_HINTS) || hasHint(cell, NAME_KEY_HINTS) || hasHint(cell, EMAIL_KEY_HINTS)
  );

  if (!headerLooksValid) {
    return rows.flatMap(row => row.map(cell => ({ phone: cell })));
  }

  const headers = rows[0].map((cell, index) => {
    const normalized = normalizeCell(cell);
    return normalized || `col_${index + 1}`;
  });

  return rows.slice(1).map(row => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      record[header] = normalizeCell(row[index] || '');
    });
    return record;
  });
}

export function parseLeadsFromCsvText(text: string): ParsedLead[] {
  const rows = parseCsvRows(String(text || ''));
  if (!rows.length) return [];
  const records = rowsToRecords(rows);
  return parseLeadsFromPayload(records);
}

export function toLeadNotesLine(lead: ParsedLead, source: string): string {
  const identity = lead.name || lead.email || source;
  return `${lead.phoneNumber} | ${identity} | source: ${source}`;
}

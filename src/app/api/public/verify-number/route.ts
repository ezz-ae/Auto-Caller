import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/auto-caller-data' : path.join(process.cwd(), 'data'));
const STORE_DRIVER = (process.env.STORE_DRIVER || '').toLowerCase();
const usePostgresStore =
  STORE_DRIVER === 'postgres' ||
  (STORE_DRIVER !== 'filesystem' && (process.env.DATABASE_URL || '').startsWith('postgres'));

function normalizePhoneNumber(input: string): string {
  let value = String(input || '').trim();
  if (!value) return '';
  value = value.replace(/[\s().-]+/g, '');
  if (value.startsWith('00')) value = `+${value.slice(2)}`;
  if (value.startsWith('+')) {
    value = `+${value.slice(1).replace(/\D/g, '')}`;
  } else {
    value = value.replace(/\D/g, '');
  }
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  return value.startsWith('+') ? value : `+${value}`;
}

function buildVerifiedResponse(number: string, companyName: string, supportNumber: string) {
  return {
    verified: true,
    number,
    companyName: companyName || 'Verified Callware customer',
    supportNumber: supportNumber || '',
    notice: 'This number is operated by Callware for automated outbound follow-up campaigns.',
    optOut: 'Say "do not call" during any call, or contact support to be added to DNC.',
  };
}

function getSupportFallback() {
  return String(process.env.PUBLIC_SUPPORT_NUMBER || process.env.NEXT_PUBLIC_SUPPORT_NUMBER || '').trim();
}

async function verifyFromPostgres(number: string) {
  const supportFallback = getSupportFallback();

  const byIdentity = await prisma.callerIdentity.findFirst({
    where: { dedicatedNumber: number },
    select: { userId: true },
  });

  if (byIdentity?.userId) {
    const settings = await prisma.appSettings.findUnique({
      where: { id: byIdentity.userId },
      select: { businessName: true, forwardToNumber: true },
    });
    return buildVerifiedResponse(number, settings?.businessName || '', settings?.forwardToNumber || supportFallback);
  }

  const byWorkspace = await prisma.appSettings.findFirst({
    where: {
      OR: [
        { twilioPhoneNumber: number },
        { assignedPhoneNumber: number },
      ],
    },
    select: { businessName: true, forwardToNumber: true },
  });

  if (byWorkspace) {
    return buildVerifiedResponse(number, byWorkspace.businessName || '', byWorkspace.forwardToNumber || supportFallback);
  }

  return { verified: false, number, message: 'Number is not in the Callware managed outbound registry.' };
}

function verifyFromFilesystem(number: string) {
  const supportFallback = getSupportFallback();
  if (!fs.existsSync(DATA_DIR)) {
    return { verified: false, number, message: 'Number is not in the Callware managed outbound registry.' };
  }

  const files = fs.readdirSync(DATA_DIR);

  let matchedUserId = '';
  for (const file of files) {
    if (!file.startsWith('caller-identities.') || !file.endsWith('.json')) continue;
    try {
      const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
      const entries = JSON.parse(raw) as Array<{ dedicatedNumber?: string; userId?: string }>;
      const found = entries.find(item => normalizePhoneNumber(String(item?.dedicatedNumber || '')) === number);
      if (found) {
        matchedUserId = String(found.userId || file.replace('caller-identities.', '').replace('.json', '')).trim();
        break;
      }
    } catch {
      // ignore malformed files
    }
  }

  for (const file of files) {
    if (!file.startsWith('settings.') || !file.endsWith('.json')) continue;
    const userId = file.replace('settings.', '').replace('.json', '');
    if (matchedUserId && userId !== matchedUserId) continue;

    try {
      const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
      const settings = JSON.parse(raw) as { businessName?: string; forwardToNumber?: string; twilioPhoneNumber?: string; assignedPhoneNumber?: string };

      const workspaceNumbers = [
        normalizePhoneNumber(String(settings.twilioPhoneNumber || '')),
        normalizePhoneNumber(String(settings.assignedPhoneNumber || '')),
      ].filter(Boolean);

      if (workspaceNumbers.includes(number) || matchedUserId === userId) {
        return buildVerifiedResponse(number, String(settings.businessName || ''), String(settings.forwardToNumber || supportFallback));
      }
    } catch {
      // ignore malformed files
    }
  }

  return { verified: false, number, message: 'Number is not in the Callware managed outbound registry.' };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = String(searchParams.get('number') || '').trim();
    const number = normalizePhoneNumber(raw);

    if (!number) {
      return NextResponse.json({ error: 'Valid E.164 number is required.' }, { status: 400 });
    }

    const result = usePostgresStore
      ? await verifyFromPostgres(number)
      : verifyFromFilesystem(number);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Public number verification failed:', error);
    return NextResponse.json({ error: 'Failed to verify number' }, { status: 500 });
  }
}

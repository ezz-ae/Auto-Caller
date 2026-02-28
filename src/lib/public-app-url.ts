import { NextRequest } from 'next/server';

function trimTrailingSlash(input: string): string {
  return input.replace(/\/+$/, '');
}

export function resolvePublicAppUrl(request?: NextRequest): string {
  const envUrl = trimTrailingSlash(String(process.env.NEXT_PUBLIC_APP_URL || '').trim());
  if (envUrl) return envUrl;

  if (request) {
    try {
      return trimTrailingSlash(new URL(request.url).origin);
    } catch {
      // fall through
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL is required in production');
  }

  return 'http://localhost:3000';
}

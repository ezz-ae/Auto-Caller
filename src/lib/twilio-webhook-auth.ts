import { NextRequest } from 'next/server';
import twilio from 'twilio';
import { getSettings } from '@/lib/store';

function uniqueTokens(tokens: string[]): string[] {
  return Array.from(new Set(tokens.map(token => token.trim()).filter(Boolean)));
}

export function formDataToParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      params[key] = value;
    }
  }
  return params;
}

export async function isValidTwilioWebhook(params: {
  request: NextRequest;
  formParams?: Record<string, string>;
  userId?: string;
  allowDemoToken?: boolean;
}): Promise<boolean> {
  if (String(process.env.SKIP_TWILIO_SIGNATURE_VALIDATION || '').trim().toLowerCase() === 'true') {
    return true;
  }

  const signature = params.request.headers.get('x-twilio-signature') || '';
  if (!signature) {
    return process.env.NODE_ENV !== 'production';
  }

  const tokenCandidates: string[] = [];
  const requestedUserId = String(params.userId || '').trim();
  if (requestedUserId) {
    try {
      const settings = await getSettings(requestedUserId);
      if (settings.twilioAuthToken) {
        tokenCandidates.push(settings.twilioAuthToken);
      }
    } catch {
      // Continue trying other managed/demo tokens.
    }
  }

  tokenCandidates.push(String(process.env.MANAGED_TWILIO_AUTH_TOKEN || '').trim());

  if (params.allowDemoToken) {
    tokenCandidates.push(String(process.env.DEMO_TWILIO_AUTH_TOKEN || '').trim());
  }

  const authTokens = uniqueTokens(tokenCandidates);
  if (authTokens.length === 0) {
    return process.env.NODE_ENV !== 'production';
  }

  const formParams = params.formParams || {};
  const url = params.request.url;
  for (const authToken of authTokens) {
    if (twilio.validateRequest(authToken, signature, url, formParams)) {
      return true;
    }
  }

  return false;
}

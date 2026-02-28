'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const CONSENT_KEY = 'acaller.cookieConsent.v1';

function setConsent(value: 'accepted' | 'declined') {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `ac_cookie_consent=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  window.localStorage.setItem(CONSENT_KEY, value);
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 md:inset-x-auto md:right-4 md:bottom-4 md:max-w-md rounded-xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-2xl shadow-black/50">
      <p className="text-sm text-zinc-100 font-medium">Cookie preferences</p>
      <p className="mt-1 text-xs text-zinc-400">
        We use essential cookies for login security, session management, and remember-device behavior.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          className="bg-emerald-500 hover:bg-emerald-600"
          onClick={() => {
            setConsent('accepted');
            setVisible(false);
          }}
        >
          Accept
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="bg-zinc-800 hover:bg-zinc-700"
          onClick={() => {
            setConsent('declined');
            setVisible(false);
          }}
        >
          Decline optional
        </Button>
      </div>
    </div>
  );
}

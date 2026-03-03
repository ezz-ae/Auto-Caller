# trren Platform

trren is a managed outbound calling platform for lead reactivation.

Users:
- hire agents
- buy number + credits
- upload leads
- run campaigns
- track outcomes

## Product Status

This repository is production-oriented and includes:
- account auth with per-user data isolation
- managed-mode billing and number activation
- outbound campaign runner + scheduling
- recording/transcript workflows
- lead sources (Zapier + Google Drive)
- compliance operations (suppression, delete lead, export logs)
- marketing site + dashboard (desktop + mobile)

## Runtime Topology

- Next.js app (this repo)
- Postgres (Neon recommended) via Prisma
- Telephony provider integration for calls/webhooks
- Voice provider integration for TTS
- Optional self-hosted CSM TTS service (`services/csm-tts`)

## Managed Mode (Default)

Managed mode is the default product path.

If `MANAGED_MODE` is unset, app behavior defaults to managed mode.

In managed mode:
- provider credentials remain server-side
- customer does not input provider keys
- customer workflow is only:
  1. set forwarding number
  2. hire agent
  3. buy dedicated number for agent
  4. buy credits
  5. upload and launch

## Quick Start

```bash
git clone https://github.com/ezz-ae/Auto-Caller.git
cd Auto-Caller
npm install
cp .env.example .env.local
```

Set env values in `.env.local`:
- `NEXT_PUBLIC_APP_URL`
- `STORE_DRIVER=postgres`
- `DATABASE_URL`
- session/auth vars
- managed telephony/voice vars
- PayPal vars

Then:

```bash
npm run db:generate
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Required Environment Variables

Core:
- `NEXT_PUBLIC_APP_URL`
- `AUTH_MODE=accounts`
- `APP_SESSION_SECRET`
- `STORE_DRIVER=postgres`
- `DATABASE_URL`

Managed platform:
- `MANAGED_MODE=true`
- `MANAGED_TWILIO_ACCOUNT_SID`
- `MANAGED_TWILIO_AUTH_TOKEN`
- `MANAGED_TWILIO_PHONE_NUMBER`
- `MANAGED_ELEVENLABS_API_KEY` (or equivalent voice provider key)
- `MANAGED_GOOGLE_AI_API_KEY` (if enabled in your stack)

Billing:
- `PAYPAL_MODE=live` (production)
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`

Reliability/compliance:
- `CRON_SECRET`
- `CALL_WINDOW_START_HOUR`
- `CALL_WINDOW_END_HOUR`
- `CALL_COMPLIANCE_DEFAULT_TIMEZONE`

## Deploy (Vercel)

1. Import repo to Vercel.
2. Add production env vars.
3. Deploy.
4. Run schema push one time against production DB.

```bash
npm run db:push
```

5. Configure telephony webhooks:
- `/api/calls/answer`
- `/api/calls/status`
- `/api/calls/recording-complete`

6. Ensure cron endpoint runs:
- `/api/cron/dispatch-scheduled`

## Launch Checklist

1. Landing page loads with working CTA.
2. Signup/login works.
3. Agent can be created.
4. Number activation purchase works.
5. Credit purchase works.
6. Test call to your own number works.
7. Campaign launch works.
8. Recording/transcript appears when enabled.
9. Billing events populate.
10. Suppression/export controls work.

## Tests / Validation

```bash
npm run lint
npm run build
npm run smoke:test
```

## Troubleshooting

If `/api/settings` or `/api/billing/events` fails after pulling new code:
- run `npm run db:push` on the production DB
- restart deployment

If payment capture fails:
- confirm PayPal order is approved
- confirm webhook/capture env vars are live and correct

If calls do not start:
- confirm dedicated number is assigned to selected agent
- confirm credits > 0
- confirm forwarding number is set

## Security Notes

- Never expose provider secrets in client code.
- Keep all credentials in server env vars only.
- Rotate keys immediately if exposed.


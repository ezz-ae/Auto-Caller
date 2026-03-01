# Auto Caller Platform

Production-ready outbound AI calling platform with:
- campaign orchestration
- AI conversation copilot
- call forwarding
- call recordings + transcription
- scheduled campaign dispatch
- credit billing + PayPal checkout
- managed mode (customers do not bring their own API keys)

## What Is Included

- Full multi-tab platform UI (`Overview`, `Agent Desk`, `Call Center`, `Sources`, `Callers`, `Recordings`, `Leads`, `Callbacks`, `History`, `Billing`, `Settings`)
- Guided onboarding wizard in `Overview` for first-launch setup
- Team accounts directory in `Settings` (owner/agent/manager operational records)
- Caller identities in dedicated `Callers` tab (name, position, voice, language, disclosure mode, conversation constraints, KPI counters)
- Number upload flow with direct caller assignment + optional schedule in `Call Center`
- Target blueprint-driven calling (goal, audience, offer, qualification, CTA) instead of fixed script reading
- Lead notes support (`number | user comment | target comment`) attached to per-call results
- Auto callback scheduling when lead says “call me later” (server-side scheduled follow-up campaign)
- Lead intelligence timeline workspace (per-number history, notes, outcomes, and follow-up context)
- Callback queue workspace (scheduled/completed/cancelled tasks with one-click load back to Call Center)
- Daily operations reporting (calls, connection metrics, callback performance, AI recommendations)
- Natural call voice delivery via ElevenLabs TTS for identity voices (with gender/language filtering in identity setup)
- Optional dashboard access protection with login (`/login`)
- Multi-tenant account auth (`/api/auth/register`, `/api/auth/login`) with per-user data isolation
- Managed billing flows (PayPal number activation + credit top-up)
- Agent Desk can warn when credits are not enough for queued contacts and route user to Billing
- Twilio callback handling (status, forwarding, recording, voicemail)
- Google AI conversation engine + transcription analysis (OpenAI fallback optional)
- Vercel cron dispatch endpoint for scheduled campaigns (`/api/cron/dispatch-scheduled`)
- Intelligence APIs for integrations:
  - `/api/leads`
  - `/api/callbacks`
  - `/api/reports/daily`
- Lead source ingestion APIs:
  - `/api/integrations/sources`
  - `/api/integrations/google-drive/sync`
  - `/api/integrations/inbox/consume`
  - `/api/integrations/zapier/lead`
- Data layer with dual drivers:
  - `postgres` (Neon/Postgres via Prisma, recommended for production)
  - `filesystem` (local JSON store for quick dev)

## Tech Stack

- Next.js 16
- TypeScript
- Prisma ORM
- Neon Postgres (production)
- Twilio (calling)
- Google AI + ElevenLabs (AI/voice)
- PayPal (checkout)

## Domain Recommendation

Both are good and currently available:
- `acall.ai` (short, premium feel)
- `acaller.ai` (clearer intent for cold traffic and SEO)

Recommended launch domain: **`acaller.ai`** for clarity and conversion on first visit.

## 1. Local Setup

```bash
git clone https://github.com/ezz-ae/Auto-Caller.git
cd Auto-Caller
npm install
cp .env.example .env.local
```

Edit `.env.local` and set at least:
- `NEXT_PUBLIC_APP_URL`
- `STORE_DRIVER`
- `DATABASE_URL` (if `STORE_DRIVER=postgres`)
- Twilio / Google AI / ElevenLabs / PayPal vars for your mode
- `AUTH_MODE=accounts` (recommended)
- `APP_SESSION_SECRET` (required in production for account sessions)
- `ALLOW_LEGACY_AUTH=false` (recommended)
- `APP_ACCESS_PASSWORD` (only for `AUTH_MODE=legacy`)
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (optional, enables forgot-password email delivery)

## 2. Neon DB Setup

1. Create a Neon project and database.
2. Copy the connection string (`postgresql://...sslmode=require`).
3. Put it in `DATABASE_URL`.
4. Generate Prisma client and push schema:

```bash
npm run db:generate
npm run db:push
```

This creates tables:
- `app_settings`
- `credit_balances`
- `campaigns`
- `recordings`
- `transcripts`
- `team_members`
- `caller_identities`
- `users`

After pulling the latest code, run `npm run db:push` again to apply multi-tenant schema updates.

## 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 4. Production Deploy (Vercel)

1. Push repo to GitHub.
2. Import project in Vercel.
3. Add all environment variables from `.env.example` in Vercel Project Settings.
4. Set `NEXT_PUBLIC_APP_URL` to your production domain.
5. Ensure `STORE_DRIVER=postgres` in production.
6. Deploy.
7. Run schema push once against production DB:

```bash
npm run db:push
```

Optional: seed demo workspace data after deployment:

```bash
npm run seed:demo
```

For exact copy-paste Vercel setup values, use:
- [VERCEL_LAUNCH_CHECKLIST.md](/Users/mahmoudezz/Downloads/Auto%20Caller/VERCEL_LAUNCH_CHECKLIST.md)

## 5. Twilio + PayPal Production Checklist

- Twilio phone number webhook URLs:
  - Voice: `https://YOUR_DOMAIN/api/calls/answer`
  - Status callback: `https://YOUR_DOMAIN/api/calls/status`
  - Recording callback: `https://YOUR_DOMAIN/api/calls/recording-complete`
- PayPal app set to `live` mode for production:
  - `PAYPAL_MODE=live`
  - live `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`
- Vercel cron:
  - `vercel.json` already includes `* * * * *` cron for `/api/cron/dispatch-scheduled`
  - set `CRON_SECRET` in Vercel env (Production + Preview)

## 6. Managed Mode (Sell As a Platform)

Set:
- `MANAGED_MODE=true`
- `MANAGED_TWILIO_*`
- `MANAGED_GOOGLE_AI_API_KEY`
- `MANAGED_ELEVENLABS_API_KEY`

In this mode customers only need to:
- add forwarding number
- create caller identities
- buy one number per caller identity
- top up credits
- run campaigns from UI

No customer API keys required.

Authentication modes:
- `AUTH_MODE=accounts` (recommended): per-user accounts and isolated workspaces.
- `AUTH_MODE=legacy`: single shared login via `APP_ACCESS_USERNAME` / `APP_ACCESS_PASSWORD`.
- `ALLOW_LEGACY_AUTH=false` (recommended): blocks shared legacy cookie fallback when using `AUTH_MODE=accounts`.
- `APP_SESSION_SECRET`: strong random secret for signing account session cookies.
- Remember device:
  - checked: persistent auth cookie (30 days)
  - unchecked: session cookie (expires when browser session ends)
- Forgot password:
  - `/forgot-password` requests a reset link
  - `/reset-password?token=...` sets a new password
  - configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and optional `RESEND_REPLY_TO` for email delivery

Automatic number provisioning:
- Set `MANAGED_AUTO_PROVISION_NUMBER=true` to auto-buy a Twilio number after successful number checkout.
- Configure search with:
  - `MANAGED_NUMBER_COUNTRY` (default `US`)
  - `MANAGED_NUMBER_AREA_CODE` (optional)
  - `MANAGED_NUMBER_CONTAINS` (optional)
- `MANAGED_NUMBER_POOL` remains fallback if auto-provisioning fails.
- Keep `MANAGED_ASSIGN_NUMBER_ON_REGISTRATION=false` (recommended) so users explicitly buy number per caller identity.

Lead sources (Zapier / Facebook / Google Drive):
- Open Dashboard -> `Sources`.
- Save your source settings once.
- Copy your Zapier webhook URL and use it in Zapier actions.
- For Facebook Lead Ads, send new leads into that Zapier webhook action.
- Add a public Google Sheet/Drive CSV URL and click `Sync Now`.
- Click `Load Leads Into Call Center` to move inbox leads into the call composer.

Credit pricing with margin:
- `TWILIO_ESTIMATED_COST_PER_CALL_USD` (example `0.02`)
- `CREDIT_MARGIN_MULTIPLIER` (example `2.0` for 100% markup)
- Fixed credit packs are `30`, `60`, `90`, `140`, and `200`.
- Product prices are computed server-side from these values.

Natural voices (ElevenLabs):
- Caller identities now filter voices by gender and language.
- Non-Twilio voices are rendered with ElevenLabs TTS during live calls via `/api/calls/tts`.
- Optional: set `ELEVENLABS_MODEL_ID` (default `eleven_multilingual_v2`).
- For more human-like phone delivery, tune:
  - `ELEVENLABS_VOICE_STABILITY`
  - `ELEVENLABS_VOICE_SIMILARITY_BOOST`
  - `ELEVENLABS_VOICE_STYLE`
  - `ELEVENLABS_VOICE_SPEED`
  - `ELEVENLABS_USE_SPEAKER_BOOST`
  - `ELEVENLABS_OPTIMIZE_STREAMING_LATENCY`

AI provider:
- Google AI is primary for live call conversation, copilot, and transcript analysis.
- Calls are target-driven by default (no rigid script reader flow).
- Set `GOOGLE_AI_API_KEY` (and optional `GOOGLE_AI_MODEL`).
- Live calls run in conversational mode (listen/respond per turn) by default.
- Optional overrides:
  - `AI_CALL_MODEL` to use a dedicated Gemini model for live calls
  - `AI_CONVERSATION_MODE=false` to force legacy one-shot script playback
- Humanization controls:
  - `AI_CALL_HUMANIZATION_LEVEL=high` for stronger human-like style
  - `AI_CALL_EXPRESSIVE_MODE=true` to allow natural cues (yeah, aha, mm-hmm)
  - `AI_CALL_ALLOW_LAUGH=true` to permit occasional light laughter cues when context is positive
- Optional fallback: `OPENAI_API_KEY`.
- Optional OpenAI live-call model override: `OPENAI_CALL_MODEL`.

## 7. Useful Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npm run db:generate
npm run db:push
npm run seed:demo
npm run smoke:test
```

## 8. Smoke Test

Run the API smoke test against local or deployed app:

```bash
# local
APP_URL=http://localhost:3000 \
SMOKE_EMAIL=admin@acaller.ai \
SMOKE_PASSWORD='YOUR_PASSWORD' \
npm run smoke:test

# production
APP_URL=https://YOUR_DOMAIN \
SMOKE_EMAIL=admin@acaller.ai \
SMOKE_PASSWORD='YOUR_PASSWORD' \
npm run smoke:test
```

## Notes

- If you want zero external DB for local testing, set `STORE_DRIVER=filesystem`.
- For multi-user production, always use `STORE_DRIVER=postgres`.
- Keep secrets only in `.env.local` / Vercel env settings.

# Vercel Launch Checklist (Copy-Paste Ready)

Use this to launch Auto Caller Platform on Vercel with Neon and managed mode.

## 1. Domains

Recommended setup:
- Primary app domain: `acaller.ai`
- Redirect domain: `acall.ai` -> `https://acaller.ai`

In Vercel:
1. Add both domains to the same project.
2. Set `acaller.ai` as primary.
3. Add redirect rule from `acall.ai/*` to `https://acaller.ai/:path*` (308).

## 2. Vercel Project Settings

Set in Vercel Project -> Settings -> General:
- Framework Preset: `Next.js`
- Node.js Version: `20.x`
- Build Command: `npm run build`
- Install Command: `npm install`

## 3. Environment Variables (Production)

Add exactly these in Vercel Project -> Settings -> Environment Variables (`Production` scope):

```env
NEXT_PUBLIC_APP_URL=https://acaller.ai

APP_ACCESS_USERNAME=admin
APP_ACCESS_PASSWORD=CHANGE_TO_STRONG_PASSWORD
AUTH_MODE=accounts
ALLOW_LEGACY_AUTH=false
APP_SESSION_SECRET=LONG_RANDOM_SESSION_SECRET

STORE_DRIVER=postgres
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require

PAYPAL_MODE=live
PAYPAL_CLIENT_ID=LIVE_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=LIVE_PAYPAL_CLIENT_SECRET

MANAGED_MODE=true
MANAGED_TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MANAGED_TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN
MANAGED_TWILIO_PHONE_NUMBER=+12025550111
MANAGED_DEFAULT_NUMBER=+12025550111
MANAGED_NUMBER_POOL=+12025550111,+12025550112,+12025550113
MANAGED_AUTO_PROVISION_NUMBER=true
MANAGED_NUMBER_COUNTRY=US
MANAGED_NUMBER_AREA_CODE=
MANAGED_NUMBER_CONTAINS=
MANAGED_NUMBER_ACTIVATION_PRICE=39
MANAGED_ASSIGN_NUMBER_ON_REGISTRATION=false

MANAGED_GOOGLE_AI_API_KEY=AIza...
MANAGED_ELEVENLABS_API_KEY=xi-...
ELEVENLABS_MODEL_ID=eleven_multilingual_v2

GOOGLE_AI_API_KEY=AIza...
GOOGLE_AI_MODEL=gemini-1.5-flash
OPENAI_API_KEY=sk-...
CRON_SECRET=LONG_RANDOM_SECRET

TWILIO_ESTIMATED_COST_PER_CALL_USD=0.02
CREDIT_MARGIN_MULTIPLIER=2.0
```

Notes:
- `DATABASE_URL` should be your Neon production connection string.
- `GOOGLE_AI_API_KEY` (or `MANAGED_GOOGLE_AI_API_KEY`) is the primary AI provider.
- `OPENAI_API_KEY` is optional fallback only.
- Keep all secret values in Vercel only, never in git.
- Credit packs are fixed at `30/60/90/140/200` and priced from your cost+margin env vars.
- Keep `MANAGED_ASSIGN_NUMBER_ON_REGISTRATION=false` so each caller identity buys its own number.

## 4. Environment Variables (Preview)

Add same keys for `Preview`, but with safer values:

```env
NEXT_PUBLIC_APP_URL=https://YOUR_PREVIEW_DOMAIN
APP_ACCESS_USERNAME=admin
APP_ACCESS_PASSWORD=PREVIEW_PASSWORD
AUTH_MODE=accounts
ALLOW_LEGACY_AUTH=false
APP_SESSION_SECRET=LONG_RANDOM_SESSION_SECRET
STORE_DRIVER=postgres
DATABASE_URL=postgresql://USER:PASSWORD@HOST/PREVIEW_DB?sslmode=require
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=SANDBOX_CLIENT_ID
PAYPAL_CLIENT_SECRET=SANDBOX_CLIENT_SECRET
MANAGED_MODE=true
MANAGED_TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MANAGED_TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN
MANAGED_TWILIO_PHONE_NUMBER=+12025550111
MANAGED_DEFAULT_NUMBER=+12025550111
MANAGED_NUMBER_POOL=+12025550111,+12025550112
MANAGED_AUTO_PROVISION_NUMBER=true
MANAGED_NUMBER_COUNTRY=US
MANAGED_NUMBER_AREA_CODE=
MANAGED_NUMBER_CONTAINS=
MANAGED_NUMBER_ACTIVATION_PRICE=39
MANAGED_ASSIGN_NUMBER_ON_REGISTRATION=false
MANAGED_GOOGLE_AI_API_KEY=AIza...
MANAGED_ELEVENLABS_API_KEY=xi-...
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
GOOGLE_AI_API_KEY=AIza...
GOOGLE_AI_MODEL=gemini-1.5-flash
OPENAI_API_KEY=sk-...
CRON_SECRET=LONG_RANDOM_SECRET
TWILIO_ESTIMATED_COST_PER_CALL_USD=0.02
CREDIT_MARGIN_MULTIPLIER=2.0
```

## 5. One-Time Database Setup

Run once against your production Neon DB:

```bash
DATABASE_URL='postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require' npm run db:push
```

Optional demo seed:

```bash
STORE_DRIVER=postgres DATABASE_URL='postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require' npm run seed:demo
```

## 6. Twilio Production Webhooks

Configure your Twilio number:
- Voice URL: `https://acaller.ai/api/calls/answer`
- Status Callback: `https://acaller.ai/api/calls/status`
- Recording Callback: `https://acaller.ai/api/calls/recording-complete`

## 7. Scheduled Campaign Cron

`vercel.json` already schedules:
- `GET /api/cron/dispatch-scheduled` every minute

Set `CRON_SECRET` in Vercel and keep it secret.

Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` for cron requests.

## 8. Post-Deploy Smoke Test

After deployment:

```bash
APP_URL=https://acaller.ai npm run smoke:test
```

Expected result:
- script prints `Smoke test passed.`

## 9. Go-Live Checks

Before accepting customers:
1. Verify account login works (`/login`) with email/password and that logout clears session.
2. Verify caller identities can buy number (one number per caller identity).
3. Verify calls can start and callbacks update campaign status.
4. Verify recordings appear and transcription analysis runs with Google AI.
5. Verify credits decrement and top-up flow updates balance.

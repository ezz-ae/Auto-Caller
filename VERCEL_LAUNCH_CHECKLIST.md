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

MANAGED_OPENAI_API_KEY=sk-...
MANAGED_ELEVENLABS_API_KEY=xi-...

OPENAI_API_KEY=sk-...
```

Notes:
- `DATABASE_URL` should be your Neon production connection string.
- `OPENAI_API_KEY` is fallback only.
- Keep all secret values in Vercel only, never in git.

## 4. Environment Variables (Preview)

Add same keys for `Preview`, but with safer values:

```env
NEXT_PUBLIC_APP_URL=https://YOUR_PREVIEW_DOMAIN
APP_ACCESS_USERNAME=admin
APP_ACCESS_PASSWORD=PREVIEW_PASSWORD
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
MANAGED_OPENAI_API_KEY=sk-...
MANAGED_ELEVENLABS_API_KEY=xi-...
OPENAI_API_KEY=sk-...
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

## 7. Post-Deploy Smoke Test

After deployment:

```bash
APP_URL=https://acaller.ai npm run smoke:test
```

Expected result:
- script prints `Smoke test passed.`

## 8. Go-Live Checks

Before accepting customers:
1. Verify login gate works (`/login`) with `APP_ACCESS_PASSWORD`.
2. Verify billing tab starts PayPal checkout.
3. Verify calls can start and callbacks update campaign status.
4. Verify recordings appear and transcription can run.
5. Verify credits decrement and top-up flow updates balance.

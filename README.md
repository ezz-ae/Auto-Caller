# Auto Caller Platform

Production-ready outbound AI calling platform with:
- campaign orchestration
- AI script copilot
- call forwarding
- call recordings + transcription
- credit billing + PayPal checkout
- managed mode (customers do not bring their own API keys)

## What Is Included

- Full multi-tab platform UI (`Overview`, `Call Center`, `Recordings`, `History`, `Billing`, `Settings`)
- Guided onboarding wizard in `Overview` for first-launch setup
- Team accounts directory in `Settings` (owner/agent/manager operational records)
- Caller identities in `Settings` (name, position, voice, language, disclosure mode, script constraints, KPI counters)
- Optional dashboard access protection with login (`/login`)
- Managed billing flows (PayPal number activation + credit top-up)
- Twilio callback handling (status, forwarding, recording, voicemail)
- OpenAI transcription + analysis pipeline
- Data layer with dual drivers:
  - `postgres` (Neon/Postgres via Prisma, recommended for production)
  - `filesystem` (local JSON store for quick dev)

## Tech Stack

- Next.js 16
- TypeScript
- Prisma ORM
- Neon Postgres (production)
- Twilio (calling)
- OpenAI + ElevenLabs (AI)
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
- Twilio / OpenAI / ElevenLabs / PayPal vars for your mode
- `APP_ACCESS_PASSWORD` (optional, but recommended in production)

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

## 6. Managed Mode (Sell As a Platform)

Set:
- `MANAGED_MODE=true`
- `MANAGED_TWILIO_*`
- `MANAGED_OPENAI_API_KEY`
- `MANAGED_ELEVENLABS_API_KEY`

In this mode customers only need to:
- add forwarding number
- buy number + credits
- run campaigns from UI

No customer API keys required.

Automatic number provisioning:
- Set `MANAGED_AUTO_PROVISION_NUMBER=true` to auto-buy a Twilio number after successful number checkout.
- Configure search with:
  - `MANAGED_NUMBER_COUNTRY` (default `US`)
  - `MANAGED_NUMBER_AREA_CODE` (optional)
  - `MANAGED_NUMBER_CONTAINS` (optional)
- `MANAGED_NUMBER_POOL` remains fallback if auto-provisioning fails.
- Optional: set `MANAGED_ASSIGN_NUMBER_ON_REGISTRATION=true` to auto-assign at first setup save (before number checkout).

Credit pricing with margin:
- `TWILIO_ESTIMATED_COST_PER_CALL_USD` (example `0.02`)
- `CREDIT_MARGIN_MULTIPLIER` (example `2.0` for 100% markup)
- Product prices are now computed server-side from these values.

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
APP_URL=http://localhost:3000 npm run smoke:test

# production
APP_URL=https://YOUR_DOMAIN npm run smoke:test
```

## Notes

- If you want zero external DB for local testing, set `STORE_DRIVER=filesystem`.
- For multi-user production, always use `STORE_DRIVER=postgres`.
- Keep secrets only in `.env.local` / Vercel env settings.

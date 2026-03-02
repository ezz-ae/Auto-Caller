import Link from 'next/link'
import { CheckCircle2, Database, KeyRound, PhoneCall, Rocket, ShieldCheck, Wallet, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'

const setupSteps = [
  {
    title: 'Configure core environment',
    icon: KeyRound,
    points: [
      'Set NEXT_PUBLIC_APP_URL, STORE_DRIVER=postgres, and DATABASE_URL.',
      'Enable MANAGED_MODE=true to hide provider setup from customers.',
      'Add APP_ACCESS_USERNAME and APP_ACCESS_PASSWORD for workspace protection.',
    ],
  },
  {
    title: 'Connect telephony and voice',
    icon: PhoneCall,
    points: [
      'Set TELEPHONY_ACCOUNT_SID, TELEPHONY_AUTH_TOKEN, and TELEPHONY_PHONE_NUMBER.',
      'Set VOICE_ENGINE_API_KEY for natural voice quality.',
      'Add telephony webhooks: /api/calls/answer, /api/calls/status, /api/calls/recording-complete.',
    ],
  },
  {
    title: 'Enable billing + AI',
    icon: Wallet,
    points: [
      'Set PAYPAL_MODE, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET.',
      'Caller numbers are purchased per caller identity; credit packs are 30/60/90/140/200.',
      'Set GOOGLE_AI_API_KEY (or MANAGED_GOOGLE_AI_API_KEY) and optional GOOGLE_AI_MODEL.',
      'Set CRON_SECRET to secure scheduled campaign dispatch endpoint.',
    ],
  },
  {
    title: 'Connect lead sources',
    icon: Download,
    points: [
      'Open Dashboard -> Sources and copy your webhook URL.',
      'In Zapier, send Facebook Lead Ads (or any form source) to /api/integrations/zapier/lead.',
      'Add Google Drive/Sheet CSV URL and run Sync Now, then load inbox leads into Call Center.',
    ],
  },
  {
    title: 'Push database and deploy',
    icon: Database,
    points: [
      'Run npm run db:push once against production DATABASE_URL.',
      'Deploy to your production environment with npm run build.',
      'System cron in vercel.json auto-runs /api/cron/dispatch-scheduled every minute.',
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="cw-editor-marketing min-h-screen text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16 space-y-10">
        <section className="space-y-4">
          <p className="text-orange-400 text-sm font-semibold">Docs</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Production Launch Guide</h1>
          <p className="text-zinc-400 max-w-3xl text-lg">
            Use this page as the quick runbook. For full variable list, keep `.env.example`,
            `README.md`, and `VERCEL_LAUNCH_CHECKLIST.md` aligned in your repo.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {setupSteps.map(step => (
            <Card key={step.title} className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950/80 border-orange-500/15">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center mb-2">
                  <step.icon className="w-5 h-5" />
                </div>
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {step.points.map(point => (
                  <p key={point} className="text-sm text-zinc-300 flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-emerald-500/5 to-transparent p-6 space-y-3">
          <p className="text-lg font-semibold">Operational security baseline</p>
          <p className="text-sm text-zinc-300 flex gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            Keep all provider secrets only in secure environment variables.
          </p>
          <p className="text-sm text-zinc-300 flex gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            Never expose API keys in frontend code or customer settings screens.
          </p>
          <p className="text-sm text-zinc-300 flex gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            Rotate provider and AI keys immediately if leaked.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <Button asChild className="bg-orange-500 hover:bg-orange-600 font-semibold">
              <Link href="/login">
                Start free trial
                <Rocket className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/faq">Open FAQ</Link>
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

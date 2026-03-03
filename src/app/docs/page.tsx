import Link from 'next/link'
import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FolderClock,
  PhoneCall,
  ShieldCheck,
  Wallet,
  Workflow,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'

const customerFlow = [
  'Sign in and set your forwarding number.',
  'Hire one calling agent.',
  'Buy one dedicated number for that agent.',
  'Top up credits.',
  'Upload leads and launch campaign.',
]

const operatorChecks = [
  {
    title: 'Managed workspace defaults',
    icon: Workflow,
    points: [
      'Managed mode is the default product path.',
      'Provider credentials stay server-side only.',
      'Customers operate through agents, numbers, and credits.',
    ],
  },
  {
    title: 'Billing and wallet',
    icon: Wallet,
    points: [
      'Credit packs are fixed: 30, 60, 90, 140, 200.',
      'Dedicated number purchase is tied to a caller agent.',
      'Billing events are recorded and visible in Billing history.',
    ],
  },
  {
    title: 'Call operations',
    icon: PhoneCall,
    points: [
      'Campaigns run with queue and status tracking.',
      'Callbacks are auto-scheduled when requested by the lead.',
      'Recordings and transcripts are logged per call when enabled.',
    ],
  },
  {
    title: 'Compliance controls',
    icon: ShieldCheck,
    points: [
      'Opt-out and suppression handling are built in.',
      'Quiet-hours controls prevent late-night dial attempts.',
      'Compliance export/delete tools are available in Settings.',
    ],
  },
]

const troubleshooting = [
  {
    issue: 'No call is starting',
    fix: 'Check that agent has a dedicated number, credits are available, and forwarding number is set.',
  },
  {
    issue: 'Voice test fails',
    fix: 'Open Settings and verify TTS health status. If unavailable, keep default provider enabled.',
  },
  {
    issue: 'Payment completed but credits not visible',
    fix: 'Refresh Billing tab and verify payment capture status in order history.',
  },
  {
    issue: 'Scheduled campaign did not dispatch',
    fix: 'Confirm cron endpoint is active and CRON_SECRET is configured in deployment env.',
  },
]

export default function DocsPage() {
  return (
    <div className="cw-editor-marketing min-h-screen text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16 space-y-10">
        <section className="space-y-4">
          <p className="text-sky-300 text-sm font-semibold">Docs</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">trren Operator Runbook</h1>
          <p className="text-zinc-300 max-w-3xl text-lg">
            This page is the production playbook for customer onboarding, operations, and go-live checks.
          </p>
        </section>

        <section className="rounded-2xl border border-sky-400/20 bg-zinc-950/55 p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 text-sky-300">
            <BookOpenCheck className="w-5 h-5" />
            <p className="font-semibold">Customer onboarding in under 10 minutes</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {customerFlow.map((step, index) => (
              <div key={step} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Step {index + 1}</p>
                <p className="text-sm text-zinc-200 mt-1">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {operatorChecks.map(block => (
            <Card key={block.title} className="bg-zinc-900/65 border-sky-400/20">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center mb-2">
                  <block.icon className="w-5 h-5" />
                </div>
                <CardTitle>{block.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {block.points.map(point => (
                  <p key={point} className="text-sm text-zinc-300 flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-300 mt-0.5 shrink-0" />
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <FolderClock className="w-5 h-5 text-sky-300" />
            <p className="text-lg font-semibold">Troubleshooting</p>
          </div>
          <div className="space-y-3">
            {troubleshooting.map(item => (
              <div key={item.issue} className="rounded-xl border border-zinc-800 bg-zinc-900/35 p-4">
                <p className="text-sm font-semibold text-zinc-100">{item.issue}</p>
                <p className="text-sm text-zinc-400 mt-1">{item.fix}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-sky-400/25 bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Final launch check</p>
            <p className="text-sm text-zinc-300 mt-1 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-sky-300" />
              Confirm: auth, credits, number activation, test call, and callback scheduling.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/faq">Open FAQ</Link>
            </Button>
            <Button asChild className="bg-sky-500 hover:bg-sky-400 font-semibold">
              <Link href="/login">Open workspace</Link>
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

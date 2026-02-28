import Link from 'next/link'
import { ArrowRight, CalendarClock, CheckCircle2, ListChecks, Mic, PhoneForwarded, UserRoundCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'

const flow = [
  {
    step: '01',
    title: 'Create caller identities',
    description: 'Define each AI caller with name, role, voice, language, and disclosure behavior, then activate its dedicated number.',
    icon: UserRoundCog,
  },
  {
    step: '02',
    title: 'Prepare campaign inputs',
    description: 'Upload phone numbers, assign caller identity, and set script/call constraints.',
    icon: ListChecks,
  },
  {
    step: '03',
    title: 'Schedule or start immediately',
    description: 'Run now or schedule launch time. Scheduled campaigns auto-dispatch in production.',
    icon: CalendarClock,
  },
  {
    step: '04',
    title: 'Forward engaged leads',
    description: 'When prospects engage, calls route to your configured team forwarding number.',
    icon: PhoneForwarded,
  },
  {
    step: '05',
    title: 'Review recordings and optimize',
    description: 'Analyze transcripts and campaign outcomes to improve scripts and conversion.',
    icon: Mic,
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#152a24_0%,#0a0d0f_50%,#09090b_100%)] text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16 space-y-10">
        <section className="space-y-4">
          <p className="text-emerald-400 text-sm font-semibold">How It Works</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">From Lead File To Revenue Calls</h1>
          <p className="text-zinc-400 max-w-3xl text-lg">
            The platform is built around one operational path: caller identity, campaign launch, lead connection,
            and optimization feedback loops.
          </p>
        </section>

        <section className="grid gap-4">
          {flow.map(item => (
            <Card key={item.step} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-emerald-400 font-semibold">STEP {item.step}</p>
                    <CardTitle>{item.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 md:p-6 space-y-3">
          <p className="text-lg font-semibold">Go-live standard</p>
          <p className="text-sm text-zinc-200">
            Before onboarding customers, verify Twilio callbacks, PayPal capture, scheduled dispatch, and transcript processing.
          </p>
          <p className="text-sm text-zinc-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            Use `/docs` + `/faq` for exact setup and operations guidance.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/docs">Open Docs</Link>
            </Button>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
              <Link href="/login">
                Start Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

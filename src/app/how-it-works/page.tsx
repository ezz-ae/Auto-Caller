import Link from 'next/link'
import { ArrowRight, CalendarClock, CheckCircle2, ListChecks, Mic, PhoneForwarded, UserRoundCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'

const flow = [
  {
    step: '01',
    title: 'Design your AI agents',
    description: 'Give each voice agent a name, personality, and specialized voice. We provide natural, human-like speech for every agent.',
    icon: UserRoundCog,
  },
  {
    step: '02',
    title: 'Prepare your outreach',
    description: 'Upload your contact lists and assign an agent. Simply describe your goal, and our AI helps you draft the perfect approach.',
    icon: ListChecks,
  },
  {
    step: '03',
    title: 'Launch or schedule',
    description: 'Start reaching out immediately or schedule for the perfect time. Our system handles the rest automatically.',
    icon: CalendarClock,
  },
  {
    step: '04',
    title: 'Engage with qualified leads',
    description: 'When a lead is ready to talk, the call is instantly forwarded to your team for a live conversation.',
    icon: PhoneForwarded,
  },
  {
    step: '05',
    title: 'Review and scale',
    description: 'Listen to recordings, read smart transcripts, and use our AI insights to optimize your results over time.',
    icon: Mic,
  },
]

export default function HowItWorksPage() {
  return (
    <div className="cw-editor-marketing min-h-screen text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-6xl px-4 py-20 md:py-28 space-y-16">
        <section className="space-y-4 text-center">
          <p className="text-orange-300 text-sm font-semibold tracking-widest uppercase">Process</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">How it works.</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-xl leading-relaxed">
            Our intelligent voice platform simplifies outreach into a few simple steps, focusing on what matters most: connecting you with qualified leads.
          </p>
        </section>

        <section className="grid gap-4">
          {flow.map(item => (
            <Card key={item.step} className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950/80 border-orange-400/15">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-400/20 text-orange-300 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-orange-300 font-semibold">STEP {item.step}</p>
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

        <section className="rounded-xl border border-orange-400/30 bg-gradient-to-r from-orange-400/10 via-emerald-500/5 to-transparent p-5 md:p-6 space-y-3">
          <p className="text-lg font-semibold">Go-live standard</p>
          <p className="text-sm text-zinc-200">
            Before onboarding customers, verify call webhooks, billing capture, scheduled dispatch, and transcript processing.
          </p>
          <p className="text-sm text-zinc-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-orange-300" />
            Use `/docs` + `/faq` for exact setup and operations guidance.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/docs">Open Docs</Link>
            </Button>
            <Button asChild className="bg-orange-400 hover:bg-orange-500 font-semibold">
              <Link href="/login">
                Start free trial
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

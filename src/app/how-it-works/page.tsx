import Link from 'next/link'
import { ArrowRight, CalendarClock, CheckCircle2, ListChecks, Mic, PhoneForwarded, UserRoundCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'

const flow = [
  {
    step: '01',
    title: 'Hire your first agent',
    description: 'Pick an agent role and set your business context. The workspace applies a ready calling profile automatically.',
    icon: UserRoundCog,
  },
  {
    step: '02',
    title: 'Prepare the campaign',
    description: 'Upload your lead list, assign the agent, and define the goal. Maya turns your objective into an execution plan.',
    icon: ListChecks,
  },
  {
    step: '03',
    title: 'Launch or schedule',
    description: 'Start now or schedule for the right window. Callware runs the campaign and tracks each lead state.',
    icon: CalendarClock,
  },
  {
    step: '04',
    title: 'Transfer qualified leads',
    description: 'When a lead is ready, the call transfers to your team or a callback is scheduled instantly.',
    icon: PhoneForwarded,
  },
  {
    step: '05',
    title: 'Review and scale',
    description: 'Review outcomes, recordings, and follow-up tasks. Improve scripts and rerun faster on the next list.',
    icon: Mic,
  },
]

export default function HowItWorksPage() {
  return (
    <div className="cw-editor-marketing min-h-screen text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-6xl px-4 py-14 md:py-24 space-y-12 md:space-y-16">
        <section className="space-y-4 text-center">
          <p className="text-blue-200 text-xs md:text-sm font-semibold tracking-widest uppercase">Process</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">How it works.</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-base md:text-xl leading-relaxed">
            A simple execution flow built for outbound teams: set objective, run calls, and convert qualified conversations.
          </p>
        </section>

        <section className="grid gap-4">
          {flow.map(item => (
            <Card key={item.step} className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950/80 border-blue-400/15">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-200 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-blue-200 font-semibold">STEP {item.step}</p>
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

        <section className="rounded-xl border border-blue-400/30 bg-gradient-to-r from-blue-700/20 via-blue-700/10 to-transparent p-5 md:p-6 space-y-3">
          <p className="text-lg font-semibold">Go-live standard</p>
          <p className="text-sm text-zinc-200">
            Before onboarding customers, verify call webhooks, billing capture, scheduled dispatch, and transcript processing.
          </p>
          <p className="text-sm text-zinc-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-200" />
            Use `/docs` + `/faq` for exact setup and operations guidance.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/docs">Open Docs</Link>
            </Button>
            <Button asChild className="bg-blue-700 hover:bg-blue-600 font-semibold">
              <Link href="/login">
                Get started
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

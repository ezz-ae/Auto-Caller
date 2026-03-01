import Link from 'next/link'
import { ArrowRight, Clock3, Headphones, Phone, ShieldCheck, Sparkles, TrendingUp, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'
import { DemoCallHero } from '@/components/marketing/demo-call-hero'

const scenarios = [
  {
    title: 'Qualify Data into leads.',
    description: 'Turn raw contact lists into qualified opportunities with structured qualification calls.',
    icon: Phone,
  },
  {
    title: 'Reconnect old lead.',
    description: 'Re-open old pipelines and reconnect with contacts that went cold.',
    icon: Clock3,
  },
  {
    title: 'Qualify Social Media lead.',
    description: 'Follow up instantly on social leads before they lose intent.',
    icon: TrendingUp,
  },
  {
    title: 'Run a professional Followup',
    description: 'Execute consistent callback campaigns with clear lead context and next actions.',
    icon: Headphones,
  },
]

const faqs = [
  {
    q: 'Can I launch calls without technical setup?',
    a: 'Yes. You only need your workflow inside the dashboard: callers, leads, and campaigns.',
  },
  {
    q: 'Can I create multiple callers for one account?',
    a: 'Yes. Each caller identity has its own script behavior, voice, language, and KPI tracking.',
  },
  {
    q: 'Can campaigns be scheduled ahead of time?',
    a: 'Yes. You can schedule campaigns and run callbacks automatically from one workspace.',
  },
]

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#19342a_0%,#0c1110_45%,#09090b_100%)] text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-7xl px-4 py-12 md:py-20 space-y-16">
        <section className="space-y-8">
          <div className="space-y-4">
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Call center, simplified
            </Badge>
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight tracking-tight">
              Who would you like to call today?
            </h1>
            <p className="text-zinc-300 text-lg leading-relaxed max-w-3xl">
              Choose your call objective, run a live demo call, then launch your real campaign from the dashboard.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl shadow-black/30">
              <CardHeader>
                <CardTitle className="text-lg">Call Goal Box</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 min-h-[96px]">
                  <p className="text-sm text-zinc-300">
                    Example: “Call new real-estate leads from this week and qualify budget + timeline before transfer.”
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="lg" asChild className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                    <Link href="/login">
                      Start Free
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
                    <Link href="/how-it-works">See the Workflow</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <DemoCallHero />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {scenarios.map(item => (
              <Card key={item.title} className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-xl leading-snug">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">What Makes It Reliable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-emerald-500/20 flex items-center justify-center">
                  <UserRound className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <p className="font-medium text-zinc-100">Identity-first campaign design</p>
                  <p className="text-sm text-zinc-400">Each caller keeps its own voice, language, script, and KPI metrics.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-emerald-500/20 flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <p className="font-medium text-zinc-100">Natural voice playback controls</p>
                  <p className="text-sm text-zinc-400">Test and lock voices before launch to protect brand quality.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <p className="font-medium text-zinc-100">One clear operating workflow</p>
                  <p className="text-sm text-zinc-400">Setup callers, launch campaigns, and track follow-up outcomes in one place.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Quick Answers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map(item => (
                <div key={item.q} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                  <p className="font-medium text-zinc-100">{item.q}</p>
                  <p className="text-sm text-zinc-400 mt-1">{item.a}</p>
                </div>
              ))}
              <Button variant="secondary" asChild className="w-full bg-zinc-800 hover:bg-zinc-700">
                <Link href="/faq">View Full FAQ</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Ready To Start?</h3>
            <p className="text-zinc-300 mt-2">Open the dashboard and launch your first campaign.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
              <Link href="/docs">Open Launch Docs</Link>
            </Button>
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/login">Open Dashboard</Link>
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

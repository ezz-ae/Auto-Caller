import Link from 'next/link'
import { Phone, TrendingUp, Clock3, CheckCircle2, ArrowRight, Sparkles, Headphones, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const metrics = [
  { label: 'Calls handled per day', value: '10,000+' },
  { label: 'Avg setup time', value: '15 min' },
  { label: 'Launch-ready workflows', value: '100%' },
]

const outcomes = [
  {
    title: 'More Live Conversations',
    description: 'Reach more leads consistently with automated outbound call flows and smart forwarding.',
    icon: Phone,
  },
  {
    title: 'Faster Follow-Up',
    description: 'Keep speed-to-lead high with always-on calling scripts built for your exact offer.',
    icon: Clock3,
  },
  {
    title: 'Revenue Visibility',
    description: 'Track call outcomes, team performance, and campaign momentum in one dashboard.',
    icon: TrendingUp,
  },
]

const steps = [
  {
    title: 'Create Caller Profiles',
    description: 'Define each caller identity with voice, language, script style, and talk-track rules.',
  },
  {
    title: 'Upload Numbers + Launch',
    description: 'Start campaign calls in minutes and send connected leads directly to your team line.',
  },
  {
    title: 'Review + Optimize',
    description: 'Use transcripts and call results to refine messaging and improve conversion rate.',
  },
]

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#19342a_0%,#0c1110_45%,#09090b_100%)] text-white">
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 ring-1 ring-emerald-300/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Acaller</p>
              <p className="text-xs text-zinc-400">AI Outbound Calling Platform</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
            <Link href="/features" className="hover:text-emerald-300 transition">Features</Link>
            <Link href="/how-it-works" className="hover:text-emerald-300 transition">How It Works</Link>
            <Link href="/pricing" className="hover:text-emerald-300 transition">Pricing</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-zinc-300 hover:text-white">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
              <Link href="/pricing">Start Now</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 md:py-20 space-y-14">
        <section className="grid gap-8 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              Built to drive qualified phone conversations
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
              Turn Lead Lists Into
              <span className="text-emerald-400"> Daily Calls</span>
            </h1>
            <p className="text-zinc-300 text-lg leading-relaxed max-w-xl">
              Run high-volume outbound campaigns with natural AI callers, scripted consistency, and full call control from one platform.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                <Link href="/pricing">
                  Launch Your First Campaign
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
                <Link href="/how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>

          <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl shadow-black/30">
            <CardHeader>
              <CardTitle className="text-lg">Call Operations Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {metrics.map(metric => (
                  <div key={metric.label} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                    <p className="text-lg font-semibold text-emerald-400">{metric.value}</p>
                    <p className="text-xs text-zinc-400 mt-1">{metric.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-sm">
                <p className="flex items-center gap-2 text-zinc-200"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Multi-caller identity setup</p>
                <p className="flex items-center gap-2 text-zinc-200"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Live call forwarding flow</p>
                <p className="flex items-center gap-2 text-zinc-200"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Recording + transcript analysis</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {outcomes.map(item => (
            <Card key={item.title} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2">
                  <item.icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Simple Launch Flow</h2>
          <p className="text-zinc-400 mt-2">Everything focused on one outcome: more connected calls.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-xs text-emerald-400 font-semibold">Step {index + 1}</p>
                <p className="mt-2 font-medium text-zinc-100">{step.title}</p>
                <p className="mt-2 text-sm text-zinc-400">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <Headphones className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="font-medium">Natural Voice Quality</p>
              <p className="text-sm text-zinc-400 mt-1">Test voice quality before launch and keep call tone consistent.</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="font-medium">Controlled Messaging</p>
              <p className="text-sm text-zinc-400 mt-1">Set clear “say this” and “avoid this” rules for every caller profile.</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <TrendingUp className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="font-medium">KPI Tracking</p>
              <p className="text-sm text-zinc-400 mt-1">Monitor caller-level performance with calls, connection rate, and usage metrics.</p>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">Ready to Start Calling Today?</h3>
            <p className="text-zinc-300 mt-2">Set up your caller identities, import your lead list, and launch in minutes.</p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
              <Link href="/pricing">Get Started</Link>
            </Button>
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/login">Open Dashboard</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}

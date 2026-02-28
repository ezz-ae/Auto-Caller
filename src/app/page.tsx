import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, Headphones, Phone, ShieldCheck, Sparkles, TrendingUp, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'

const outcomes = [
  {
    title: 'More Qualified Conversations',
    description: 'Call faster with structured AI agents that keep every outreach aligned to your message.',
    icon: Phone,
  },
  {
    title: 'Faster Follow-Up Cycles',
    description: 'Assign callers, upload numbers, and schedule campaigns in minutes instead of days.',
    icon: Clock3,
  },
  {
    title: 'Clear Revenue Operations',
    description: 'Track outcomes per campaign and per caller identity to improve conversion and margin.',
    icon: TrendingUp,
  },
]

const checkpoints = [
  'Caller identity cards with voice/language selection',
  'Number upload, caller assignment, and campaign scheduling',
  'Live forwarding to your team number when leads engage',
  'Recording + transcript intelligence for every call',
]

const faqs = [
  {
    q: 'Do customers need Twilio, ElevenLabs, or AI accounts?',
    a: 'No. Acaller runs in managed mode. Customers only use the dashboard.',
  },
  {
    q: 'Can I create multiple callers for one account?',
    a: 'Yes. Each caller identity has its own script behavior, voice, language, and KPI tracking.',
  },
  {
    q: 'Can campaigns be scheduled ahead of time?',
    a: 'Yes. Scheduled campaigns auto-dispatch with the built-in cron runner on Vercel.',
  },
]

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#19342a_0%,#0c1110_45%,#09090b_100%)] text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-7xl px-4 py-12 md:py-20 space-y-16">
        <section className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Built for outbound teams that need calls today
            </Badge>
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight tracking-tight">
              Convert Lead Lists Into
              <span className="block text-emerald-400">Booked Conversations</span>
            </h1>
            <p className="text-zinc-300 text-lg leading-relaxed max-w-xl">
              Acaller gives you a full calling platform: AI caller identities, script control, scheduled campaigns,
              and conversion tracking in one place.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                <Link href="/pricing">
                  Start Selling Calls
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
                <Link href="/how-it-works">See the Workflow</Link>
              </Button>
            </div>
          </div>

          <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl shadow-black/30">
            <CardHeader>
              <CardTitle className="text-lg">Go-Live Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checkpoints.map(item => (
                <p key={item} className="flex items-start gap-2 text-sm text-zinc-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  {item}
                </p>
              ))}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 mt-4 text-xs text-zinc-400">
                Best for real estate, financing, insurance, clinics, and appointment-heavy teams.
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
                  <p className="font-medium text-zinc-100">Managed infrastructure model</p>
                  <p className="text-sm text-zinc-400">Customers do not touch provider APIs, you control service quality and margin.</p>
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
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Ready To Go Live This Week?</h3>
            <p className="text-zinc-300 mt-2">Set your APIs once, deploy on Vercel, and onboard your first customers.</p>
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

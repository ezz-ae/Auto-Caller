import Link from 'next/link'
import { Bot, ClipboardList, Gauge, Mic, PhoneCall, ShieldCheck, Sparkles, Users, Wallet, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'

const items = [
  {
    title: 'Campaign Calling Engine',
    description: 'Launch and monitor outbound batches with deterministic call states and result tracking.',
    icon: PhoneCall,
  },
  {
    title: 'Caller Identity Hub',
    description: 'Hire multiple calling agents with role, language, script profile, and dedicated execution goals.',
    icon: Users,
  },
  {
    title: 'Script Rules Control',
    description: 'Apply global and caller-level “say this” / “avoid this” constraints for consistent messaging.',
    icon: ClipboardList,
  },
  {
    title: 'Maya Planning Assistant',
    description: 'Turn business context into a structured campaign plan with focus, target, and success event.',
    icon: Bot,
  },
  {
    title: 'Recording Intelligence',
    description: 'Review transcripts, summaries, sentiment, and action items to improve campaign quality fast.',
    icon: Mic,
  },
  {
    title: 'Caller-Level KPIs',
    description: 'Track launched campaigns, connected calls, failed calls, and credits consumed per identity.',
    icon: Gauge,
  },
  {
    title: 'Managed Billing Flow',
    description: 'Sell numbers and call credits through PayPal with your pricing and margin controls.',
    icon: Wallet,
  },
  {
    title: 'Lead Source Integrations',
    description: 'Connect Zapier/Facebook and Google Drive, then load inbox leads straight into Call Center.',
    icon: Download,
  },
  {
    title: 'Security Gate',
    description: 'Protect workspace access with credential login and environment-only provider credentials.',
    icon: ShieldCheck,
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,#172b22_0%,#0c1110_40%,#09090b_100%)] text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-7xl px-4 py-12 md:py-16 space-y-10">
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" />
            Full Platform Capability
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Everything Needed To Run A Calling Business</h1>
          <p className="text-zinc-400 max-w-3xl text-lg">
            Callware is structured for operators, not demo screens: hire agents, launch campaigns,
            capture outcomes, and monetize usage.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map(item => (
            <Card key={item.title} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2">
                  <item.icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription className="text-zinc-400">{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Want the full setup process?</p>
            <p className="text-sm text-zinc-400 mt-1">Use the launch docs for exact environment variables, DB setup, and webhook mapping.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/docs">Open Docs</Link>
            </Button>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600 font-semibold">
              <Link href="/login">Start free trial</Link>
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

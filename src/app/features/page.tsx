import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PhoneCall, Bot, Gauge, Mic, ClipboardList, Users } from 'lucide-react'

const items = [
  {
    title: 'Campaign Calling Engine',
    description: 'Run call batches, track live status, and keep every outreach sequence organized.',
    icon: PhoneCall,
  },
  {
    title: 'Caller Identities',
    description: 'Set caller name, role, voice, language, and script behavior for each campaign profile.',
    icon: Users,
  },
  {
    title: 'Script Control',
    description: 'Use mandatory and restricted wording rules to keep each call aligned to your standards.',
    icon: ClipboardList,
  },
  {
    title: 'AI Script Copilot',
    description: 'Generate and refine scripts from company profile, industry context, and campaign objective.',
    icon: Bot,
  },
  {
    title: 'Recording Intelligence',
    description: 'Review calls, scan summaries, and extract action items to improve next campaigns.',
    icon: Mic,
  },
  {
    title: 'Performance KPIs',
    description: 'Track call volumes, connection rates, and identity-level results in one workspace.',
    icon: Gauge,
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <main className="mx-auto max-w-7xl px-4 py-14 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-emerald-400 text-sm font-semibold">Platform Features</p>
            <h1 className="text-4xl font-semibold tracking-tight mt-1">Everything You Need To Run Outbound Calls</h1>
            <p className="text-zinc-400 mt-3 max-w-2xl">A simple system focused on one job: helping your team start more high-quality phone conversations.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/">Back Home</Link>
            </Button>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
              <Link href="/pricing">Start Now</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.title} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2">
                  <item.icon className="w-5 h-5" />
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

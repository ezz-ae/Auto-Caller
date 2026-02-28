import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const flow = [
  {
    step: '01',
    title: 'Configure Your Calling Profiles',
    description: 'Create caller identities with voice, language, and script behavior for each use case.',
  },
  {
    step: '02',
    title: 'Load Leads And Launch',
    description: 'Upload phone numbers, choose your identity, and start campaigns with one click.',
  },
  {
    step: '03',
    title: 'Connect Leads To Your Team',
    description: 'When a lead engages, calls are forwarded instantly to your configured destination number.',
  },
  {
    step: '04',
    title: 'Analyze And Improve',
    description: 'Use transcripts, outcomes, and KPI trends to improve script quality and team conversion.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <main className="mx-auto max-w-5xl px-4 py-14 space-y-8">
        <div className="space-y-3">
          <p className="text-emerald-400 text-sm font-semibold">How It Works</p>
          <h1 className="text-4xl font-semibold tracking-tight">From Lead List To Live Calls In Minutes</h1>
          <p className="text-zinc-400 max-w-3xl">The workflow is intentionally simple so you can move fast while keeping call quality and messaging controlled.</p>
        </div>

        <div className="grid gap-4">
          {flow.map((item) => (
            <Card key={item.step} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <p className="text-emerald-400 text-xs font-semibold">STEP {item.step}</p>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
            <Link href="/">Back Home</Link>
          </Button>
          <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
            <Link href="/pricing">Open Pricing</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}

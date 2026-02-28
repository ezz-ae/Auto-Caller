import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'

const faqs = [
  {
    question: 'Do customers need Twilio, ElevenLabs, PayPal, or AI provider accounts?',
    answer:
      'No. In managed mode, provider credentials are controlled by the platform owner and kept in server environment variables.',
  },
  {
    question: 'What does a customer do inside the dashboard?',
    answer:
      'They set account profile and forwarding number, create caller identities, upload numbers, assign caller, and launch or schedule campaigns.',
  },
  {
    question: 'Can one account have multiple caller identities?',
    answer:
      'Yes. Each identity has its own voice, language, script, and KPI counters (calls, connected, failed, credits used).',
  },
  {
    question: 'How does scheduled calling work?',
    answer:
      'Scheduled campaigns are saved with status "scheduled" and auto-dispatched by a Vercel cron endpoint every minute.',
  },
  {
    question: 'How are credits priced?',
    answer:
      'Credit packs are computed from estimated Twilio call cost and your configured margin multiplier, then sold through PayPal checkout.',
  },
  {
    question: 'How do I secure workspace access?',
    answer:
      'Set APP_ACCESS_USERNAME and APP_ACCESS_PASSWORD. Users must sign in at /login before accessing the dashboard.',
  },
  {
    question: 'What AI provider is used?',
    answer:
      'Google AI (Gemini) is primary for script copilot and transcript analysis. OpenAI can remain as optional fallback.',
  },
  {
    question: 'Can I deploy to Vercel + Neon and go live today?',
    answer:
      'Yes. Set production env vars, run db push once, configure Twilio webhooks, and deploy. The project is built for this setup.',
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#142922_0%,#0b0f10_45%,#09090b_100%)] text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16 space-y-8">
        <section className="space-y-3">
          <p className="text-emerald-400 text-sm font-semibold">FAQ</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Frequently Asked Questions</h1>
          <p className="text-zinc-400 text-lg">
            Common launch, billing, operations, and deployment questions from platform owners.
          </p>
        </section>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-4">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((item, index) => (
                <AccordionItem key={item.question} value={`item-${index + 1}`} className="border-zinc-800">
                  <AccordionTrigger className="text-left text-zinc-100 hover:text-emerald-300">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-300">Need implementation steps?</p>
          <div className="flex gap-2">
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/docs">Open Docs</Link>
            </Button>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
              <Link href="/pricing">Open Pricing</Link>
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'

const faqs = [
  {
    question: 'Do customers need separate telephony, voice, billing, or AI accounts?',
    answer:
      'No. In managed mode, all infrastructure credentials are controlled by the platform owner and kept in server environment variables.',
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
      'Scheduled campaigns are saved with status "scheduled" and auto-dispatched by a system cron endpoint every minute.',
  },
  {
    question: 'How are credits priced?',
    answer:
      'Credit packs are fixed at 30/60/90/140/200 credits, priced from your estimated call cost and margin multiplier, then sold through checkout.',
  },
  {
    question: 'Can I connect Facebook forms, Google Drive, or Zapier?',
    answer:
      'Yes. Use Dashboard -> Sources. You get a secure webhook URL for Zapier/Facebook lead flow, plus Google Drive CSV sync. Imported leads go into Lead Inbox, then one click moves them to Call Center.',
  },
  {
    question: 'How do I secure workspace access?',
    answer:
      'Set APP_ACCESS_USERNAME and APP_ACCESS_PASSWORD. Users must sign in at /login before accessing the dashboard.',
  },
  {
    question: 'What AI provider is used?',
    answer:
      'The platform uses a managed AI layer for script copilot, conversation guidance, and transcript analysis.',
  },
  {
    question: 'Can I deploy to production and go live today?',
    answer:
      'Yes. Set production env vars, run db push once, configure call webhooks, and deploy. The project is built for rapid deployment.',
  },
]

export default function FaqPage() {
  return (
    <div className="cw-editor-marketing min-h-screen text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-3xl px-4 py-20 md:py-28 space-y-12">
        <section className="text-center space-y-4">
          <p className="text-orange-300 text-xs font-bold uppercase tracking-widest">FAQ</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Frequently asked questions</h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Common questions about launch, billing, integrations, and operations.
          </p>
        </section>

        <div className="rounded-2xl border border-orange-400/15 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950/80 overflow-hidden">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`item-${index + 1}`}
                className="border-b border-zinc-800/60 last:border-0 px-6"
              >
                <AccordionTrigger className="text-left text-zinc-100 hover:text-orange-300 py-5 text-base font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed pb-5">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="font-semibold text-zinc-100">Still have questions?</p>
            <p className="text-sm text-zinc-400 mt-1">The docs have step-by-step setup guidance for every config.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/docs">Read the docs</Link>
            </Button>
            <Button asChild className="bg-orange-400 hover:bg-orange-500 font-semibold">
              <Link href="/login">Start free trial</Link>
            </Button>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}

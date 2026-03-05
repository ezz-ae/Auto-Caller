'use client'

import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Headphones,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'
import { OnboardingChat } from '@/components/marketing/onboarding-chat'
import { DemoCallHero } from '@/components/marketing/demo-call-hero'

const howItWorks = [
  {
    title: 'Create your caller agent',
    detail: 'Pick an agent profile, add your offer, and set your follow-up objective.',
  },
  {
    title: 'Upload old leads CSV',
    detail: 'Import your list, assign it to the agent, and set call timing.',
  },
  {
    title: 'Launch and track outcomes',
    detail: 'See answered calls, outcomes, callbacks, recordings, and transcripts in one dashboard.',
  },
]

const features = [
  {
    title: 'Assigned caller number',
    description: 'Each active caller agent can run from a dedicated line.',
    icon: Phone,
  },
  {
    title: 'Recording + transcripts',
    description: 'Review conversations, intent, and follow-up notes instantly.',
    icon: Headphones,
  },
  {
    title: 'Campaign scripts + targets',
    description: 'Start with defaults, then refine with your own business rules.',
    icon: CalendarClock,
  },
  {
    title: 'Managed human-like voices',
    description: 'trren assigns production-ready voice profiles automatically per hired agent.',
    icon: TrendingUp,
  },
  {
    title: 'AI objection handling',
    description: 'Keeps conversations natural, handles pushback, and routes warm leads to your team.',
    icon: Sparkles,
  },
  {
    title: 'Compliance-safe defaults',
    description: 'Automated-call disclosure, opt-out handling, and quiet-hours guardrails.',
    icon: ShieldCheck,
  },
]

const faqs = [
  {
    q: 'Will it sound robotic?',
    a: 'No. Each hired agent uses a tuned voice profile selected by trren for natural delivery. You can run a live test call before launch.',
  },
  {
    q: 'Can I use my own number?',
    a: 'Managed mode assigns numbers through the platform. Dedicated number per active caller is supported.',
  },
  {
    q: 'What if someone wants no more calls?',
    a: 'The platform supports opt-out handling and suppression lists, so numbers requesting stop are automatically excluded.',
  },
]

const trustItems = [
  'Transparent automated-call disclosure',
  'Opt-out handling included',
  'No setup required',
]

const icpCards = [
  { title: 'Qualify Data Into Leads', icon: TrendingUp },
  { title: 'Reconnect Old Leads', icon: Clock3 },
  { title: 'Qualify Social Media Leads', icon: Sparkles },
  { title: 'Run Professional Follow-up', icon: CalendarClock },
]

export default function MarketingHomePage() {
  return (
    <div className="cw-editor-marketing min-h-screen text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-7xl px-4">
        <section className="py-20 md:py-24 grid gap-10 lg:grid-cols-[1fr_460px] items-start">
          <div className="space-y-7">
            <Badge className="bg-blue-500/15 text-blue-200 border-blue-400/30 text-xs font-semibold tracking-widest uppercase px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Outbound Follow-up For UAE Teams
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold leading-[1.08] tracking-tight">
                Reactivate 200 old leads in 30 minutes.
              </h1>
              <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-xl">
                Hire a calling agent, upload leads, and launch. Your team gets qualified conversations instead of manual chasing.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-13 px-7 rounded-2xl text-base font-bold bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 shadow-xl shadow-blue-900/40">
                <Link href="/login">
                  Get started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild className="h-13 px-6 rounded-2xl text-base text-zinc-300 hover:text-white border border-zinc-700/60 hover:border-zinc-600 hover:bg-zinc-800/50">
                <Link href="#live-test">
                  Test it now
                </Link>
              </Button>
            </div>

            <div className="hidden md:grid gap-2 sm:grid-cols-2">
              {icpCards.map(card => (
                <div key={card.title} className="rounded-xl border border-zinc-700/70 bg-zinc-900/45 px-4 py-3 text-sm text-zinc-200 flex items-center gap-2">
                  <card.icon className="w-4 h-4 text-blue-200" />
                  {card.title}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-5 pt-1">
              {trustItems.map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-24 space-y-4">
            <OnboardingChat />
            <p className="text-center text-[11px] text-zinc-600">
              Ask what to launch today and get a guided setup path in chat.
            </p>
          </div>
        </section>

        <section className="py-16 border-t border-zinc-800/60 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">From old list to live campaign in minutes</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Step {index + 1}</p>
                <h3 className="text-lg font-semibold mt-2 text-zinc-100">{step.title}</h3>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 border-t border-zinc-800/60 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything needed to get first revenue fast</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(item => (
              <div key={item.title} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-200 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-zinc-100 mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="live-test" className="py-16 border-t border-zinc-800/60">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Live Demo</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Try it now on your own phone</h2>
              </div>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Add your number and receive a live automated call. No slides, no waiting list.
              </p>
              <div className="space-y-2">
                {[
                  'Natural voice response in real time',
                  'Handles objections and follow-up requests',
                  'Dashboard logs outcome immediately',
                ].map(point => (
                  <div key={point} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-200 shrink-0" />
                    {point}
                  </div>
                ))}
              </div>
            </div>
            <DemoCallHero />
          </div>
        </section>

        <section className="py-16 border-t border-zinc-800/60 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What teams ask before launching</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {faqs.map(item => (
              <div key={item.q} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                <p className="font-semibold text-zinc-100">{item.q}</p>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 border-t border-zinc-800/60">
          <div className="rounded-2xl border border-blue-400/25 bg-gradient-to-br from-blue-700/20 via-blue-700/10 to-transparent p-8 md:p-12 text-center space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ready to recover your old pipeline?</h2>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                Start free, run your first campaign today, and move qualified leads directly to your team.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" className="h-14 px-8 rounded-2xl text-base font-bold bg-blue-700 hover:bg-blue-600 shadow-xl shadow-blue-900/45">
                <Link href="/login">
                  Get started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

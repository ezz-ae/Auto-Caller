'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Headphones,
  Phone,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'
import { OnboardingChat } from '@/components/marketing/onboarding-chat'
import { DemoCallHero } from '@/components/marketing/demo-call-hero'

const useCases = [
  {
    title: 'Lead qualification at scale',
    description:
      'Run structured discovery calls across your full contact list. Flag hot leads the moment intent is confirmed.',
    icon: Phone,
  },
  {
    title: 'Pipeline re-engagement',
    description:
      'Automatically reach contacts that went cold. Reconnect before they choose a competitor.',
    icon: Clock3,
  },
  {
    title: 'Social media follow-up',
    description:
      'Connect with inbound leads within seconds of form submission — when intent is at its highest.',
    icon: TrendingUp,
  },
  {
    title: 'Scheduled callback campaigns',
    description:
      'Keep every follow-up promise. Automated callbacks with full context from the previous conversation.',
    icon: CalendarClock,
  },
  {
    title: 'Appointment reminders',
    description:
      'Reduce no-shows with proactive outreach. AI callers confirm, reschedule, and follow up automatically.',
    icon: Headphones,
  },
  {
    title: 'Post-purchase upsells',
    description:
      'Reach customers at the right moment after a purchase. Warm, contextual conversations that convert.',
    icon: Sparkles,
  },
]

const trustItems = [
  { label: '30 free calls included', icon: CheckCircle2 },
  { label: 'No credit card required', icon: CheckCircle2 },
  { label: 'Live in under 10 minutes', icon: CheckCircle2 },
]

export default function MarketingHomePage() {
  const demoRef = useRef<HTMLDivElement>(null)
  const [demoVisible, setDemoVisible] = useState(false)

  const handleDemoRequested = () => {
    setDemoVisible(true)
    setTimeout(() => {
      demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,#172b22_0%,#0c1110_40%,#09090b_100%)] text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-7xl px-4">

        {/* ── Hero ── */}
        <section className="py-20 md:py-28 grid gap-12 lg:grid-cols-[1fr_480px] items-start">

          {/* Left: copy + CTAs */}
          <div className="space-y-8 lg:pt-4">
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs font-semibold tracking-widest uppercase px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1.5" />
              AI Outbound Calling
            </Badge>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight">
                Your leads are waiting{' '}
                <span className="text-emerald-400">for the right call.</span>
              </h1>
              <p className="text-zinc-400 text-xl leading-relaxed max-w-lg font-medium">
                AI voice agents that qualify, follow up, and book on your behalf — while you focus on closing.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-13 px-7 rounded-2xl text-base font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-xl shadow-emerald-500/20"
              >
                <Link href="/login">
                  Start free — 30 calls included
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                asChild
                className="h-13 px-6 rounded-2xl text-base text-zinc-300 hover:text-white border border-zinc-700/60 hover:border-zinc-600 hover:bg-zinc-800/50"
              >
                <Link href="/how-it-works">How it works</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-5 pt-2">
              {trustItems.map(item => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-zinc-400">
                  <item.icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {item.label}
                </div>
              ))}
            </div>

            {/* Industry quick-select chips — decorative context */}
            <div className="pt-2 space-y-2">
              <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold">Works for</p>
              <div className="flex flex-wrap gap-2">
                {['Real Estate', 'Insurance', 'SaaS', 'Healthcare', 'Finance', 'E-commerce'].map(
                  industry => (
                    <span
                      key={industry}
                      className="px-3 py-1 rounded-full border border-zinc-800 text-xs text-zinc-500 bg-zinc-900/50"
                    >
                      {industry}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Right: chat widget */}
          <div className="lg:sticky lg:top-24">
            <OnboardingChat onDemoRequested={handleDemoRequested} />
            <p className="text-center text-[11px] text-zinc-600 mt-3">
              Not a chatbot — this is exactly how your AI caller will sound and respond.
            </p>
          </div>
        </section>

        {/* ── Use cases ── */}
        <section className="py-16 border-t border-zinc-800/60 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Use cases</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for every outreach scenario</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              One platform, any industry. Acaller adapts to your workflow in minutes.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map(item => (
              <div
                key={item.title}
                className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 hover:border-emerald-500/30 hover:bg-zinc-900/70 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Demo call section ── */}
        <section
          ref={demoRef}
          className={`py-16 border-t border-zinc-800/60 transition-all duration-500 ${
            demoVisible ? 'opacity-100 translate-y-0' : 'opacity-70'
          }`}
        >
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Live demo</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Hear what your AI caller sounds like.
                </h2>
              </div>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Enter your number and one of our AI voice agents will call you right now. No scripts, no slides — just a real conversation.
              </p>
              <div className="space-y-2">
                {[
                  'Natural, human-like voice',
                  'Handles objections and questions',
                  'Full transcript after the call',
                ].map(point => (
                  <div key={point} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <DemoCallHero />
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 border-t border-zinc-800/60">
          <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-8 md:p-12 text-center space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Ready to launch your first campaign?
              </h2>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                Set up in under 10 minutes. 30 calls included free. No credit card until you scale.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 rounded-2xl text-base font-bold bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20"
              >
                <Link href="/login">
                  Start free workspace
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                asChild
                className="h-14 px-8 rounded-2xl text-base border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50"
              >
                <Link href="/docs">Read the docs</Link>
              </Button>
            </div>
            <p className="text-xs text-zinc-600">
              No credit card · No setup fee · Cancel anytime
            </p>
          </div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  )
}

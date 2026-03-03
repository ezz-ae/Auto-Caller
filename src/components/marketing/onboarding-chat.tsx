'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Bot, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Role = 'assistant' | 'user'
type Message = { id: string; role: Role; content: string }
type Phase = 'goal' | 'industry' | 'done'

const GOALS = [
  'Qualify new leads',
  'Follow up on cold lists',
  'Book more appointments',
  'Re-engage past clients',
]

const INDUSTRIES = [
  'Real Estate',
  'Insurance',
  'SaaS / Tech',
  'Healthcare',
  'Finance',
  'E-commerce',
]

const GOAL_RESPONSES: Record<string, string> = {
  'Qualify new leads':
    "Perfect — your hired agent runs structured qualification flows 24/7 and flags hot leads the moment intent is confirmed.",
  'Follow up on cold lists':
    "Smart call. Most pipelines fail in the follow-up gap. trren handles persistence without fatigue or drop-off.",
  'Book more appointments':
    "Booking campaigns are a high-ROI use case. trren confirms intent and offers time slots automatically.",
  'Re-engage past clients':
    "Reactivation often converts best — the lead already knows you. trren warms them back up without manual effort.",
}

const INDUSTRY_RESPONSES: Record<string, string> = {
  'Real Estate':
    "Real estate teams on trren reach 3–5× more leads per hour, with transcripts that surface buyer budget and timeline automatically.",
  'Insurance':
    "Insurance agents use trren to follow up on quote requests and reactivate lapsed policies — all while they focus on closing.",
  'SaaS / Tech':
    "SaaS teams qualify inbound signups, re-engage trial drop-offs, and convert demo requests into booked meetings — automatically.",
  'Healthcare':
    "Healthcare practices use trren for appointment follow-ups, missed-visit outreach, and patient reactivation campaigns.",
  'Finance':
    "Finance teams qualify pre-approved leads and reach out on rate alerts while intent is at its peak.",
  'E-commerce':
    "E-commerce brands use trren for cart recovery, VIP winbacks, and post-purchase upsells with voices that match brand tone.",
}

interface Props {
  onDemoRequested?: () => void
}

export function OnboardingChat({ onDemoRequested }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        "Hey! I can help set up your first calling campaign in minutes.\n\nWhat's your main outreach goal?",
    },
  ])
  const [phase, setPhase] = useState<Phase>('goal')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const addMessage = (role: Role, content: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setMessages(prev => [...prev, { id, role, content }])
  }

  const handleGoal = (goal: string) => {
    addMessage('user', goal)
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const response =
        GOAL_RESPONSES[goal] ??
        'Got it — trren handles that at scale without manual effort.'
      addMessage(
        'assistant',
        `${response}\n\nWhat industry are you in?`,
      )
      setPhase('industry')
    }, 750)
  }

  const handleIndustry = (industry: string) => {
    addMessage('user', industry)
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const response =
        INDUSTRY_RESPONSES[industry] ??
        'Teams like yours use trren to run consistent outreach without growing headcount.'
      addMessage(
        'assistant',
        `${response}\n\nYou can set up your workspace for free — no credit card needed until you launch your first campaign.`,
      )
      setPhase('done')
    }, 900)
  }

  const chips = phase === 'goal' ? GOALS : phase === 'industry' ? INDUSTRIES : []

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-sm shadow-2xl shadow-black/50 overflow-hidden flex flex-col h-[460px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center gap-3 bg-zinc-900/90 shrink-0">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-400/20">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-300 border-2 border-zinc-900" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Maya @ trren</p>
          <p className="text-[10px] text-zinc-400 tracking-wide">Online · Responds instantly</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-orange-400/20 text-orange-50 border border-orange-400/25 rounded-tr-sm'
                  : 'bg-zinc-800/70 text-zinc-200 border border-zinc-700/50 rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-800/70 border border-zinc-700/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-3 border-t border-zinc-800/50 bg-zinc-900/60 shrink-0">
        {phase === 'done' ? (
          <div className="flex flex-col gap-2">
            <Button
              asChild
              className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 font-semibold shadow-lg shadow-orange-400/20 text-white"
            >
              <Link href="/login">
                Start free workspace
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <button
              type="button"
              className="text-[11px] text-zinc-500 hover:text-orange-300 transition text-center py-1 flex items-center justify-center gap-1.5"
              onClick={onDemoRequested}
            >
              <Phone className="w-3 h-3" />
              Or hear a live call demo first
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {!isTyping &&
              chips.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    phase === 'goal' ? handleGoal(chip) : handleIndustry(chip)
                  }
                  className="px-3 py-1.5 rounded-full border border-zinc-700/80 bg-zinc-800/50 text-xs font-medium text-zinc-300 hover:border-orange-400/60 hover:text-orange-300 hover:bg-orange-400/8 transition-all duration-150"
                >
                  {chip}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

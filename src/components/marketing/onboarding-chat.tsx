'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bot, Phone, SendHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Role = 'assistant' | 'user'
type Message = { id: string; role: Role; content: string }

interface Props {
  onDemoRequested?: () => void
}

function buildId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function OnboardingChat({ onDemoRequested }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        'Hi, I am Maya. I help sales teams launch better outbound follow-up.\n\nWhat sales outcome do you want first?',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const addMessage = (role: Role, content: string) => {
    setMessages(prev => [...prev, { id: buildId(), role, content }])
  }

  const sendPrompt = async (value: string) => {
    const prompt = value.trim()
    if (!prompt || isTyping) return

    const historyForApi = [...messages, { id: 'pending', role: 'user' as const, content: prompt }]
      .slice(-10)
      .map(item => ({ role: item.role, content: item.content }))

    addMessage('user', prompt)
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/marketing-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, messages: historyForApi }),
      })
      const data = await response.json().catch(() => ({}))
      const reply = String(data?.reply || '').trim() || 'Good direction. Tell me your industry and lead source, and I will map your first campaign.'
      addMessage('assistant', reply)
    } catch {
      addMessage(
        'assistant',
        'Good direction. Tell me your industry and lead source, and I will map your first campaign.',
      )
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="h-[480px] overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/70 shadow-2xl shadow-black/50 backdrop-blur-sm">
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800/60 bg-zinc-900/90 px-5 py-4">
        <div className="relative shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-400/20">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-orange-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Maya @ Callware</p>
          <p className="text-[10px] tracking-wide text-zinc-400">Sales strategy chat</p>
        </div>
      </div>

      <div className="scrollbar-thin h-[305px] space-y-3 overflow-y-auto px-4 py-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[84%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'rounded-tr-sm border border-orange-400/25 bg-orange-400/20 text-orange-50'
                  : 'rounded-tl-sm border border-zinc-700/50 bg-zinc-800/70 text-zinc-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-zinc-700/50 bg-zinc-800/70 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-zinc-800/50 bg-zinc-900/60 px-4 pb-4 pt-3">
        <form
          className="flex gap-2"
          onSubmit={event => {
            event.preventDefault()
            sendPrompt(inputValue)
          }}
        >
          <input
            value={inputValue}
            onChange={event => setInputValue(event.target.value)}
            placeholder="Ask about your sales workflow..."
            className="h-10 flex-1 rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-orange-400/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            aria-label="Send"
            className="h-10 w-10 rounded-xl border border-zinc-700/80 bg-zinc-800/70 text-zinc-300 transition hover:border-orange-400/60 hover:text-orange-200 disabled:opacity-50"
          >
            <SendHorizontal className="mx-auto h-4 w-4" />
          </button>
        </form>

        <div className="mt-3 flex flex-col gap-2">
          <Button
            asChild
            className="h-10 w-full rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 font-semibold text-white shadow-lg shadow-orange-400/20 hover:from-orange-500 hover:to-orange-600"
          >
            <Link href="/login">
              Start sales workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 py-1 text-center text-[11px] text-zinc-500 transition hover:text-orange-300"
            onClick={onDemoRequested}
          >
            <Phone className="h-3 w-3" />
            Or hear a live sales call demo first
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { FormEvent, useState } from 'react'
import { Phone, PhoneCall, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function DemoCallHero() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [consented, setConsented] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setResult(null)

    if (!phoneNumber.trim()) {
      setResult({ type: 'error', message: 'Enter your phone number with country code.' })
      return
    }

    if (!consented) {
      setConsented(true)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/demo-call/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          phoneNumber: phoneNumber.trim(),
          consent: true,
          website,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.success) {
        setResult({
          type: 'error',
          message: String(payload?.error || 'Unable to start demo call right now.'),
        })
        return
      }

      setResult({
        type: 'success',
        message: String(payload?.message || 'Call started — keep your phone nearby.'),
      })
      setPhoneNumber('')
      setConsented(false)
    } catch {
      setResult({ type: 'error', message: 'Unable to start demo call right now.' })
    } finally {
      setLoading(false)
    }
  }

  /* honeypot */
  const isSpam = website.length > 0

  if (result?.type === 'success') {
    return (
      <div className="rounded-2xl border border-orange-400/30 bg-orange-400/10 p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-orange-400/20 flex items-center justify-center mx-auto">
          <PhoneCall className="w-7 h-7 text-orange-300" />
        </div>
        <div>
          <p className="font-semibold text-orange-200 text-lg">Call incoming</p>
          <p className="text-sm text-zinc-400 mt-1">{result.message}</p>
        </div>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition"
        >
          Try a different number
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm overflow-hidden">
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-400/15 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-orange-300" />
          </div>
          <div>
            <p className="font-semibold text-white">Call me now</p>
            <p className="text-xs text-zinc-500">One number. One tap. Real AI voice.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* honeypot */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />

          <div className="flex gap-2">
            <Input
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="+1 555 123 4567"
              className="bg-zinc-800/80 border-zinc-700/60 h-12 text-base rounded-xl flex-1 placeholder:text-zinc-600"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || isSpam || !phoneNumber.trim()}
              className="h-12 px-5 rounded-xl bg-orange-400 hover:bg-orange-500 font-semibold shadow-lg shadow-orange-400/20 shrink-0"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Calling
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4" />
                  Call me
                </span>
              )}
            </Button>
          </div>

          {/* Consent step — appears only after first submit attempt */}
          {consented && (
            <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/40 p-4 space-y-3 animate-in fade-in-50 duration-200">
              <p className="text-sm text-zinc-200">
                By clicking <strong>Confirm call</strong>, you agree to receive one automated AI demo call at the number above. The call may be recorded for quality.
              </p>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-orange-400 hover:bg-orange-500 font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Starting...' : 'Confirm call'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 px-4 rounded-xl border border-zinc-700/60 text-zinc-400 hover:text-zinc-200"
                  onClick={() => setConsented(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {result?.type === 'error' && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {result.message}
            </p>
          )}
        </form>
      </div>

      <div className="px-6 py-3 border-t border-zinc-800/60 bg-zinc-900/40 flex items-center gap-1.5 text-[11px] text-zinc-600">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        Rate-limited · One call per number · Consent required
      </div>
    </div>
  )
}

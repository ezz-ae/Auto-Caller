'use client'

import { FormEvent, useState } from 'react'
import { PhoneCall, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DemoCallHero() {
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setResult(null)

    if (!phoneNumber.trim()) {
      setResult({ type: 'error', message: 'Enter your phone number with country code.' })
      return
    }

    if (!consent) {
      setResult({ type: 'error', message: 'You must accept demo call consent to continue.' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/demo-call/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          consent,
          website,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.success) {
        setResult({ type: 'error', message: String(payload?.error || 'Unable to start demo call right now.') })
        return
      }

      setResult({
        type: 'success',
        message: String(payload?.message || 'Demo call started. Keep your phone nearby.'),
      })
      setPhoneNumber('')
    } catch {
      setResult({ type: 'error', message: 'Unable to start demo call right now.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl shadow-black/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-emerald-400" />
          Try Live AI Call Demo
        </CardTitle>
        <CardDescription>
          Enter your number and receive a short AI conversation demo call now.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="demo-name">Name (optional)</Label>
            <Input
              id="demo-name"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Your name"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="demo-phone">Phone Number</Label>
            <Input
              id="demo-phone"
              value={phoneNumber}
              onChange={event => setPhoneNumber(event.target.value)}
              placeholder="+1 555 123 4567"
              required
              className="bg-zinc-800 border-zinc-700"
            />
            <p className="text-xs text-zinc-500">Use country code for fastest connection.</p>
          </div>

          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={event => setWebsite(event.target.value)}
            className="hidden"
            aria-hidden="true"
          />

          <div className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
            <Checkbox id="demo-consent" checked={consent} onCheckedChange={checked => setConsent(checked === true)} />
            <div className="space-y-1">
              <Label htmlFor="demo-consent" className="text-sm text-zinc-200">
                I agree to receive one automated demo call.
              </Label>
              <p className="text-xs text-zinc-500">
                This is a short product demo call and may be recorded for quality.
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={loading}>
            {loading ? 'Starting Demo Call...' : 'Call Me Now'}
          </Button>

          {result && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                result.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-red-500/30 bg-red-500/10 text-red-200'
              }`}
            >
              {result.message}
            </div>
          )}

          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            Rate-limited and consent-gated for abuse protection.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface VerifyResult {
  verified?: boolean
  number?: string
  companyName?: string
  supportNumber?: string
  notice?: string
  optOut?: string
  message?: string
  error?: string
}

export default function VerifyNumberPage() {
  const [number, setNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)

  const onVerify = async () => {
    if (!number.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/public/verify-number?number=${encodeURIComponent(number.trim())}`)
      const data = await res.json().catch(() => ({}))
      setResult(data)
    } catch {
      setResult({ error: 'Verification failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Callware Number Verification</h1>
          <p className="text-zinc-400 text-sm">
            Verify whether a number is a Callware-managed outbound line.
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Search Number</CardTitle>
            <CardDescription>Use international format (example: +971501234567)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={number}
              onChange={e => setNumber(e.target.value)}
              placeholder="+971501234567"
              className="bg-zinc-800 border-zinc-700"
            />
            <Button onClick={onVerify} disabled={loading || !number.trim()} className="bg-cyan-500 hover:bg-cyan-600">
              {loading ? 'Verifying...' : 'Verify Number'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 space-y-2 text-sm">
              {result.error ? (
                <p className="text-red-300">{result.error}</p>
              ) : result.verified ? (
                <>
                  <p className="text-cyan-300 font-semibold">Verified managed number</p>
                  <p><span className="text-zinc-500">Company:</span> {result.companyName || 'Verified customer'}</p>
                  <p><span className="text-zinc-500">Support:</span> {result.supportNumber || 'Not provided'}</p>
                  <p className="text-zinc-400">{result.notice}</p>
                  <p className="text-zinc-400">{result.optOut}</p>
                </>
              ) : (
                <p className="text-zinc-300">{result.message || 'Number not found in managed registry.'}</p>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-zinc-500">
          This page does not expose personal owner details. It only confirms if a number is managed by Callware for outbound operations.
        </p>

        <Link href="/" className="text-sm text-cyan-400 hover:text-cyan-300">Back to homepage</Link>
      </div>
    </div>
  )
}

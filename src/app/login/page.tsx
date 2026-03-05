'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { BrandLogo } from '@/components/brand-logo'

export default function LoginPage() {
  const router = useRouter()
  const [accountMode, setAccountMode] = useState(true)
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberDevice, setRememberDevice] = useState(true)
  const [loading, setLoading] = useState(false)
  const [nextPath, setNextPath] = useState('/dashboard')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get('next')
    if (next && next.startsWith('/')) setNextPath(next)

    fetch('/api/auth/session')
      .then(async res => {
        if (!res.ok) return null
        const data = await res.json()
        if (typeof data?.accountMode === 'boolean') setAccountMode(data.accountMode)
        if (data?.authenticated) router.replace(next || '/dashboard')
      })
      .catch(() => null)
  }, [router])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const payload = isRegister
        ? { name, email: username, password, rememberDevice }
        : accountMode
          ? { email: username, password, rememberDevice }
          : { username, password, rememberDevice }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Invalid credentials')
        return
      }

      toast.success(isRegister ? 'Account created' : 'Welcome back')
      router.push(nextPath)
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cw-editor-marketing min-h-screen flex flex-col items-center justify-center px-4 py-10 md:py-12 text-white">

      {/* Back link */}
      <div className="w-full max-w-sm mb-5 md:mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-blue-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to trren
        </Link>
      </div>

      <div className="w-full max-w-sm space-y-5 md:space-y-6">

        {/* Logo + heading */}
        <div className="text-center space-y-3">
          <BrandLogo className="justify-center" showTagline />
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {isRegister ? 'Create your workspace' : 'Sign in to trren'}
            </h1>
            <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
              {isRegister ? 'Start your free outreach workspace' : 'Access your outreach workspace'}
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-blue-400/20 bg-gradient-to-br from-zinc-900/90 via-zinc-900/75 to-zinc-950/85 backdrop-blur-sm p-5 md:p-6 shadow-xl shadow-black/30">
          <form className="space-y-4" onSubmit={onSubmit}>
            {accountMode && isRegister && (
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Full name</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-zinc-800/80 border-zinc-700/60 h-11 rounded-xl"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">
                {accountMode ? 'Email' : 'Username'}
              </Label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="bg-zinc-800/80 border-zinc-700/60 h-11 rounded-xl"
                placeholder={accountMode ? 'you@company.com' : 'admin'}
                required
                type={accountMode ? 'email' : 'text'}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 text-sm">Password</Label>
                {accountMode && !isRegister && (
                  <Link
                    href="/forgot-password"
                    className="text-xs text-zinc-500 hover:text-blue-200 transition"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-zinc-800/80 border-zinc-700/60 h-11 rounded-xl"
                placeholder="••••••••"
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={e => setRememberDevice(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-blue-700"
              />
              Remember this device
            </label>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-semibold bg-blue-700 hover:bg-blue-600 shadow-lg shadow-blue-900/40 text-white"
            >
              {loading
                ? isRegister ? 'Creating account…' : 'Signing in…'
                : isRegister ? 'Create free workspace' : 'Sign in'}
            </Button>
          </form>
        </div>

        {/* Toggle register / login */}
        {accountMode && (
          <p className="text-center text-sm text-zinc-500">
            {isRegister ? 'Already have a workspace?' : "Don't have a workspace yet?"}{' '}
            <button
              type="button"
              onClick={() => setIsRegister(prev => !prev)}
              className="text-blue-200 hover:text-blue-100 font-medium transition"
            >
              {isRegister ? 'Sign in' : 'Start free'}
            </button>
          </p>
        )}

        <p className="text-center text-xs text-zinc-700">
          No credit card required · Cancel anytime
        </p>
      </div>
    </div>
  )
}

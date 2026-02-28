'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, LockKeyhole, Phone, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [accountMode, setAccountMode] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [nextPath, setNextPath] = useState('/dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next && next.startsWith('/')) {
      setNextPath(next);
    }

    fetch('/api/auth/session')
      .then(async res => {
        if (!res.ok) return null;
        const data = await res.json();
        if (typeof data?.accountMode === 'boolean') {
          setAccountMode(data.accountMode);
        }
        if (data?.authenticated) {
          router.replace(next || '/dashboard');
        }
      })
      .catch(() => null);
  }, [router]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? { name, email: username, password, rememberDevice }
        : (accountMode ? { email: username, password, rememberDevice } : { username, password, rememberDevice });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Invalid credentials');
        return;
      }

      toast.success(isRegister ? 'Account created' : 'Access granted');
      router.push(nextPath);
      router.refresh();
    } catch {
      toast.error('Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1a2b24_0%,#0b0e10_45%,#09090b_100%)] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-300 transition text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to website
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-zinc-900/80 border-zinc-800 text-white">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 ring-1 ring-emerald-300/30 flex items-center justify-center mb-3">
                <Phone className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl">Acaller Workspace Login</CardTitle>
              <CardDescription className="text-zinc-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Protected workspace access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                {accountMode && isRegister && (
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="Your name"
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{accountMode ? 'Email' : 'Username'}</Label>
                  <Input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                    placeholder={accountMode ? 'you@company.com' : 'admin'}
                    required
                    type={accountMode ? 'email' : 'text'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <label className="flex items-center gap-2 text-zinc-300">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={e => setRememberDevice(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-800"
                    />
                    Remember this device
                  </label>
                  {accountMode && !isRegister && (
                    <Link href="/forgot-password" className="text-zinc-400 hover:text-emerald-300 transition">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={loading}>
                  {loading ? (isRegister ? 'Creating account...' : 'Signing in...') : (isRegister ? 'Create account' : 'Sign in')}
                </Button>
                {accountMode && (
                  <button
                    type="button"
                    onClick={() => setIsRegister(prev => !prev)}
                    className="w-full text-sm text-zinc-400 hover:text-emerald-300 transition"
                  >
                    {isRegister ? 'Already have an account? Sign in' : 'New user? Create account'}
                  </button>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/70 border-zinc-800 text-white">
            <CardHeader>
              <Badge className="w-fit bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                <LockKeyhole className="w-3.5 h-3.5 mr-1" />
                Secure Access
              </Badge>
              <CardTitle className="text-xl">Welcome Back</CardTitle>
              <CardDescription className="text-zinc-400">
                {accountMode ? 'Sign in or create an account to access your isolated workspace.' : 'Sign in to continue to your workspace.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p>Manage callers, campaigns, billing, and recordings in one place.</p>
              <p>If you are new, start from the dashboard overview tab.</p>
              <div className="pt-2 flex gap-2">
                <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
                  <Link href="/docs">Open Docs</Link>
                </Button>
                <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
                  <Link href="/faq">Open FAQ</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

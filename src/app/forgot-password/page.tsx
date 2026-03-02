'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to send reset request');
        return;
      }
      setSent(true);
      if (typeof data.devResetUrl === 'string') {
        setDevResetUrl(data.devResetUrl);
      }
      toast.success('If the account exists, reset instructions were sent.');
    } catch {
      toast.error('Failed to send reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cw-editor-marketing min-h-screen px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-300 transition text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
        <Card className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/75 to-zinc-950/85 border-orange-400/20 text-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Mail className="w-5 h-5 text-orange-300" />
              Forgot Password
            </CardTitle>
            <CardDescription className="text-zinc-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Request a secure password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="bg-zinc-800 border-zinc-700"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-orange-400 hover:bg-orange-500" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
              {sent && (
                <p className="text-sm text-zinc-300">
                  Check your email for a reset link. If nothing arrives, check spam and try again.
                </p>
              )}
              {devResetUrl && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-xs text-amber-200">
                    Dev reset link:
                    {' '}
                    <a href={devResetUrl} className="underline underline-offset-2">
                      {devResetUrl}
                    </a>
                  </p>
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                className="w-full bg-zinc-800 hover:bg-zinc-700"
                onClick={() => router.push('/login')}
              >
                Return to login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

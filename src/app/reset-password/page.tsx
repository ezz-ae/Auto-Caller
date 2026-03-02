'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') || '');
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.error('Missing reset token');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, rememberDevice }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to reset password');
        return;
      }
      toast.success('Password reset successful');
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Failed to reset password');
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
              <KeyRound className="w-5 h-5 text-orange-300" />
              Reset Password
            </CardTitle>
            <CardDescription className="text-zinc-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Set a new password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="bg-zinc-800 border-zinc-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="bg-zinc-800 border-zinc-700"
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={e => setRememberDevice(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800"
                />
                Remember this device
              </label>
              <Button type="submit" className="w-full bg-orange-400 hover:bg-orange-500" disabled={loading}>
                {loading ? 'Updating password...' : 'Update password'}
              </Button>
              {!token && (
                <p className="text-sm text-amber-300">
                  Invalid link: token is missing. Request a new reset link.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

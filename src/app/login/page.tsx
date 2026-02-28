'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [nextPath, setNextPath] = useState('/dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next && next.startsWith('/')) {
      setNextPath(next);
    }
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Invalid credentials');
        return;
      }

      toast.success('Access granted');
      router.push(nextPath);
      router.refresh();
    } catch {
      toast.error('Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,#1a2b24_0%,#0a0a0b_40%,#09090b_100%)] px-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 ring-1 ring-emerald-300/30 flex items-center justify-center mb-3">
            <Phone className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl">Auto Caller Platform</CardTitle>
          <CardDescription className="text-zinc-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Protected workspace access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
                placeholder="admin"
                required
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
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import Link from 'next/link'
import { Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/docs', label: 'Docs' },
  { href: '/faq', label: 'FAQ' },
]

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-orange-300/20 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-emerald-500 ring-1 ring-orange-300/30 flex items-center justify-center shadow-lg shadow-orange-400/30">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">Callware</p>
            <p className="text-xs text-zinc-400">Outbound Execution Platform</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm text-zinc-300">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="hover:text-orange-300 transition">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="text-zinc-300 hover:text-white">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-orange-400 to-emerald-500 hover:from-orange-300 hover:to-emerald-400 font-semibold">
            <Link href="/login">Start free trial</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-orange-300/15 bg-zinc-950/60">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">Callware</p>
          <p className="text-sm text-zinc-400">
            Run automated follow-up campaigns with hired calling agents, scheduled execution, and conversion analytics.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-3">Platform</p>
          <div className="space-y-2 text-sm text-zinc-400">
            <Link href="/features" className="block hover:text-orange-300 transition">Features</Link>
            <Link href="/how-it-works" className="block hover:text-orange-300 transition">How It Works</Link>
            <Link href="/login" className="block hover:text-orange-300 transition">Start Free</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-3">Resources</p>
          <div className="space-y-2 text-sm text-zinc-400">
            <Link href="/docs" className="block hover:text-orange-300 transition">Docs</Link>
            <Link href="/faq" className="block hover:text-orange-300 transition">FAQ</Link>
            <Link href="/login" className="block hover:text-orange-300 transition">Workspace Login</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-3">Support</p>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>Production support window: Mon-Fri</p>
            <a href="mailto:support@callware.ai" className="block hover:text-orange-300 transition">
              support@callware.ai
            </a>
            <p>Status: <span className="text-orange-300">Operational</span></p>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800/80">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-zinc-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p>© {new Date().getFullYear()} Callware. All rights reserved.</p>
          <p>Built for fast, measurable outbound calling.</p>
        </div>
      </div>
    </footer>
  )
}

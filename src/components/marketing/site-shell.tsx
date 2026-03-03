import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'

const navItems = [
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/docs', label: 'Docs' },
  { href: '/faq', label: 'FAQ' },
]

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-sky-300/20 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-4">
        <BrandLogo showTagline />

        <nav className="hidden lg:flex items-center gap-6 text-sm text-zinc-300">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="hover:text-sky-300 transition">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="text-zinc-300 hover:text-white">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 font-semibold">
            <Link href="/login">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-sky-300/15 bg-zinc-950/60">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-4">
        <div className="space-y-2">
          <BrandLogo className="pointer-events-none" />
          <p className="text-sm text-zinc-400">
            Run automated follow-up campaigns with hired calling agents, scheduled execution, and conversion analytics.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-3">Platform</p>
          <div className="space-y-2 text-sm text-zinc-400">
            <Link href="/features" className="block hover:text-sky-300 transition">Features</Link>
            <Link href="/how-it-works" className="block hover:text-sky-300 transition">How It Works</Link>
            <Link href="/login" className="block hover:text-sky-300 transition">Start now</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-3">Resources</p>
          <div className="space-y-2 text-sm text-zinc-400">
            <Link href="/docs" className="block hover:text-sky-300 transition">Docs</Link>
            <Link href="/faq" className="block hover:text-sky-300 transition">FAQ</Link>
            <Link href="/login" className="block hover:text-sky-300 transition">Workspace Login</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-3">Support</p>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>Production support window: Mon-Fri</p>
            <a href="mailto:support@trren.com" className="block hover:text-sky-300 transition">
              support@trren.com
            </a>
            <p>Status: <span className="text-sky-300">Operational</span></p>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800/80">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-zinc-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p>© {new Date().getFullYear()} trren. All rights reserved.</p>
          <p>Built for fast, measurable outbound calling.</p>
        </div>
      </div>
    </footer>
  )
}

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Check, Crown, Phone, Sparkles, Wallet, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'

interface BillingProduct {
  id: string
  name: string
  price: number
  kind: 'credits' | 'number'
  credits?: number
}

const DEFAULT_PRODUCTS: BillingProduct[] = [
  { id: 'number_activation', name: 'Dedicated Phone Number', price: 39, kind: 'number' },
  { id: 'credits_500', name: '500 Credits Pack', price: 20, kind: 'credits', credits: 500 },
  { id: 'credits_1500', name: '1,500 Credits Pack', price: 60, kind: 'credits', credits: 1500 },
  { id: 'credits_5000', name: '5,000 Credits Pack', price: 200, kind: 'credits', credits: 5000 },
]

function getProductIcon(product: BillingProduct) {
  if (product.kind === 'number') return <Phone className="w-6 h-6" />
  if ((product.credits || 0) <= 500) return <Zap className="w-6 h-6" />
  if ((product.credits || 0) <= 1500) return <Crown className="w-6 h-6" />
  return <Wallet className="w-6 h-6" />
}

function getProductFeatures(product: BillingProduct): string[] {
  if (product.kind === 'number') {
    return [
      'Dedicated caller number for the customer workspace',
      'Used across all campaign callers and scripts',
      'Provisioned and managed by platform operations',
      'No provider account needed for customer',
    ]
  }

  const credits = product.credits || 0
  return [
    `${credits.toLocaleString()} outbound call credits`,
    'Credits applied immediately after successful checkout',
    'Compatible with scheduled and live campaigns',
    'Full reporting and caller KPI visibility in dashboard',
  ]
}

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const [products, setProducts] = useState<BillingProduct[]>(DEFAULT_PRODUCTS)

  useEffect(() => {
    if (!redirectUrl) return
    window.location.href = redirectUrl
  }, [redirectUrl])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch('/api/paypal/create-order')
        if (!res.ok) throw new Error('Failed to load products')
        const data = await res.json()
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products)
        }
      } catch {
        console.error('Failed to load pricing products; using defaults')
      }
    }

    loadProducts()
  }, [])

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      if (a.kind === 'number' && b.kind !== 'number') return -1
      if (a.kind !== 'number' && b.kind === 'number') return 1
      return (a.credits || 0) - (b.credits || 0)
    })
  }, [products])

  const handlePurchase = useCallback(async (productId: string) => {
    setLoading(productId)

    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      const data = await res.json()
      if (data.approvalUrl) {
        setRedirectUrl(data.approvalUrl)
        return
      }

      toast.error(data.error || 'Failed to create order')
    } catch {
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#172e26_0%,#0c1010_45%,#09090b_100%)] text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-7xl px-4 py-12 md:py-16 space-y-12">
        <section className="text-center space-y-4 max-w-4xl mx-auto">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Managed Platform Billing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Sell Number + Credits, Start Calls Fast</h1>
          <p className="text-zinc-300 text-lg">
            This page is customer-facing checkout: activate a dedicated number, top up credits, and run campaigns
            without external provider setup.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-4">
          {sortedProducts.map(product => {
            const isPopular = product.kind === 'credits' && (product.credits || 0) >= 1500 && (product.credits || 0) < 5000
            const title = product.kind === 'number' ? 'Dedicated Number' : `${(product.credits || 0).toLocaleString()} Credits`

            return (
              <Card key={product.id} className={`relative bg-zinc-900 border-zinc-800 ${isPopular ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">Best Value</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={`w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                    isPopular ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {getProductIcon(product)}
                  </div>
                  <CardTitle className="text-2xl">{title}</CardTitle>
                  <CardDescription className="text-zinc-400">{product.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold">${product.price.toFixed(2)}</p>
                    <p className="text-zinc-400 mt-1 text-sm">one-time purchase</p>
                  </div>
                  <ul className="space-y-3">
                    {getProductFeatures(product).map(feature => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-zinc-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handlePurchase(product.id)}
                    disabled={loading !== null}
                    className={`w-full h-12 text-base ${
                      isPopular
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                  >
                    {loading === product.id ? 'Processing...' : `Buy Now - $${product.price.toFixed(2)}`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Do customers need external accounts?</CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400 text-sm">
              No. In managed mode, all provider credentials stay in your environment. Customers only use your app.
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">How are credit prices set?</CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400 text-sm">
              Prices are calculated server-side using your estimated call cost and markup multiplier values.
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Can number assignment be automatic?</CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400 text-sm">
              Yes. You can auto-provision from Twilio and auto-assign on registration using managed mode env settings.
            </CardContent>
          </Card>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-zinc-300">Need setup guidance before launch?</p>
          <div className="flex gap-2">
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/docs">Read Docs</Link>
            </Button>
            <Button variant="secondary" asChild className="bg-zinc-800 hover:bg-zinc-700">
              <Link href="/faq">Open FAQ</Link>
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Check, Crown, Sparkles, Wallet, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingFooter, MarketingHeader } from '@/components/marketing/site-shell'
import { PayPalCheckoutModal, type PurchaseResult } from '@/components/paypal/paypal-checkout-modal'

interface BillingProduct {
  id: string
  name: string
  price: number
  kind: 'credits' | 'number'
  credits?: number
}

const DEFAULT_PRODUCTS: BillingProduct[] = [
  { id: 'credits_30', name: '30 Credits Pack', price: 1.2, kind: 'credits', credits: 30 },
  { id: 'credits_60', name: '60 Credits Pack', price: 2.4, kind: 'credits', credits: 60 },
  { id: 'credits_90', name: '90 Credits Pack', price: 3.6, kind: 'credits', credits: 90 },
  { id: 'credits_140', name: '140 Credits Pack', price: 5.6, kind: 'credits', credits: 140 },
  { id: 'credits_200', name: '200 Credits Pack', price: 8, kind: 'credits', credits: 200 },
]

function getProductIcon(product: BillingProduct) {
  if ((product.credits || 0) <= 60) return <Zap className="w-6 h-6" />
  if ((product.credits || 0) <= 140) return <Crown className="w-6 h-6" />
  return <Wallet className="w-6 h-6" />
}

function getProductFeatures(product: BillingProduct): string[] {
  const credits = product.credits || 0
  return [
    `${credits.toLocaleString()} outbound call credits`,
    'Credits applied immediately after checkout',
    'Compatible with scheduled and live campaigns',
    'Full reporting and caller KPI visibility in dashboard',
  ]
}

export default function PricingPage() {
  const [products, setProducts] = useState<BillingProduct[]>(DEFAULT_PRODUCTS)
  const [selectedProduct, setSelectedProduct] = useState<BillingProduct | null>(null)

  useEffect(() => {
    fetch('/api/paypal/create-order')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.products) && d.products.length > 0) setProducts(d.products)
      })
      .catch(() => {})
  }, [])

  const sortedProducts = useMemo(
    () => [...products].filter(p => p.kind === 'credits').sort((a, b) => (a.credits || 0) - (b.credits || 0)),
    [products],
  )

  return (
    <div className="cw-editor-marketing min-h-screen text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-7xl px-4 py-12 md:py-16 space-y-12">
        <section className="text-center space-y-4 max-w-4xl mx-auto">
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Managed Platform Billing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Top Up Credits, Keep Calls Running</h1>
          <p className="text-zinc-300 text-lg">
            Dedicated numbers are purchased inside the dashboard per caller identity. Use this page for credit top-ups.
          </p>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {sortedProducts.map(product => {
            const isPopular = (product.credits || 0) >= 90 && (product.credits || 0) <= 140
            const title = `${(product.credits || 0).toLocaleString()} Credits`

            return (
              <Card key={product.id} className={`relative bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950/80 border-cyan-500/15 ${isPopular ? 'border-cyan-500/60 shadow-lg shadow-cyan-500/10' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-cyan-500 text-white">Best Value</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={`w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                    isPopular ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-400'
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
                        <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                        <span className="text-zinc-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full h-12 text-base ${
                      isPopular
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                  >
                    Buy Now — ${product.price.toFixed(2)}
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
              <CardTitle className="text-lg">Where do I buy a caller number?</CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400 text-sm">
              In the dashboard, go to Callers tab and buy number for each caller identity.
            </CardContent>
          </Card>
        </section>

        <section className="rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-violet-500/5 to-transparent p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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

      {selectedProduct && (
        <PayPalCheckoutModal
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          price={selectedProduct.price}
          credits={selectedProduct.credits}
        />
      )}
    </div>
  )
}

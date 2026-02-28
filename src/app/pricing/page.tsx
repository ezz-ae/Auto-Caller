'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Crown, Building2, Phone, ArrowLeft, Wallet } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

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
  return <Building2 className="w-6 h-6" />
}

function getProductFeatures(product: BillingProduct): string[] {
  if (product.kind === 'number') {
    return [
      'Dedicated caller number for your workspace',
      'Auto-provisioned instantly after activation',
      'Used across all outbound campaigns',
      'No technical setup required from end users',
    ]
  }

  const credits = product.credits || 0
  return [
    `${credits.toLocaleString()} outbound call credits`,
    'Credits added instantly after payment capture',
    'Managed call delivery included',
    'No external account setup required from customers',
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
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Auto Caller Platform</h1>
              <p className="text-xs text-zinc-400">by 1hundred.ai</p>
            </div>
          </Link>

          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            Managed Platform Billing
          </Badge>
          <h2 className="text-4xl font-bold mb-4">Activate Number + Buy Credits</h2>
          <p className="text-zinc-400 max-w-3xl mx-auto text-lg">
            Customers pay you directly. Number provisioning and call infrastructure are managed by your platform.
            No customer API keys required.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4 max-w-7xl mx-auto">
          {sortedProducts.map((product) => {
            const isPopular = product.kind === 'credits' && (product.credits || 0) >= 1500 && (product.credits || 0) < 5000
            const title = product.kind === 'number' ? 'Dedicated Number' : `${(product.credits || 0).toLocaleString()} Credits`

            return (
              <Card
                key={product.id}
                className={`relative bg-zinc-900 border-zinc-800 ${isPopular ? 'border-emerald-500 scale-[1.02]' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">Recommended</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                    isPopular ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {getProductIcon(product)}
                  </div>
                  <CardTitle className="text-2xl">{title}</CardTitle>
                  <CardDescription>{product.name}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold">${product.price.toFixed(2)}</div>
                    <div className="text-zinc-400 mt-1">one-time purchase</div>
                  </div>

                  <ul className="space-y-3">
                    {getProductFeatures(product).map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePurchase(product.id)}
                    disabled={loading !== null}
                    className={`w-full h-12 text-lg ${
                      isPopular
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                  >
                    {loading === product.id ? 'Processing...' : `Buy Now - $${product.price.toFixed(2)}`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                    <Wallet className="w-4 h-4" />
                    Secure checkout
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-20 max-w-3xl mx-auto space-y-4">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Do customers need extra provider accounts?</CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              No. This is a fully managed platform model. You control account infrastructure and billing while customers only
              manage forwarding number, scripts, and campaigns.
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">How are credits priced?</CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              Credit pricing is calculated server-side from your estimated per-call operating cost plus your margin multiplier
              (for example, `2.0` = 100% markup).
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">When is the phone number purchased?</CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              The platform provisions the number automatically after successful checkout, so you do not need to pre-buy and hold inventory.
            </CardContent>
          </Card>
        </div>

        <footer className="mt-20 text-center text-zinc-500 text-sm">
          <p>© 2026 1hundred.ai - All rights reserved</p>
          <p className="mt-2">
            Questions? Email us at{' '}
            <a href="mailto:support@1hundred.ai" className="text-emerald-400 hover:underline">
              support@1hundred.ai
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}

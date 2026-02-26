'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Crown, Building2, Phone, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface PricingTier {
  id: string
  name: string
  price: number
  credits: number
  description: string
  features: string[]
  popular?: boolean
  icon: React.ReactNode
}

const tiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 97,
    credits: 500,
    description: 'Perfect for individual agents getting started',
    features: [
      'Full Auto Caller Pro app',
      'Chrome extension included',
      '500 call credits',
      'Basic email support',
      'Lifetime access',
    ],
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 197,
    credits: 1500,
    description: 'For serious agents who want more power',
    features: [
      'Everything in Starter',
      '1,500 call credits',
      'Priority support',
      'Free updates for life',
      'MCP server access',
      'Custom voice training',
    ],
    popular: true,
    icon: <Crown className="w-6 h-6" />,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 397,
    credits: 5000,
    description: 'For teams and agencies who want to scale',
    features: [
      'Everything in Pro',
      '5,000 call credits',
      'White-label rights',
      'Resell to clients',
      'Dedicated support',
      'Custom integrations',
      'Team management',
    ],
    icon: <Building2 className="w-6 h-6" />,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  // Handle redirect in effect to avoid ESLint error
  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl
    }
  }, [redirectUrl])

  const handlePurchase = useCallback(async (tier: PricingTier) => {
    setLoading(tier.id)
    
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tierId: tier.id,
          price: tier.price,
          credits: tier.credits,
        }),
      })
      
      const data = await res.json()
      
      if (data.approvalUrl) {
        // Trigger redirect via effect
        setRedirectUrl(data.approvalUrl)
      } else {
        toast.error('Failed to create order')
        setLoading(null)
      }
    } catch {
      toast.error('Payment failed. Please try again.')
      setLoading(null)
    }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Auto Caller Pro</h1>
              <p className="text-xs text-zinc-400">by 1hundred.ai</p>
            </div>
          </Link>
          
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            One-Time Payment
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Choose Your Plan
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            No subscriptions. No monthly fees. One payment, lifetime access.
            <br />
            All plans include the full app + Chrome extension.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <Card 
              key={tier.id}
              className={`relative bg-zinc-900 border-zinc-800 ${
                tier.popular ? 'border-emerald-500 scale-105' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-emerald-500 text-white">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                  tier.popular 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {tier.icon}
                </div>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="text-5xl font-bold">${tier.price}</div>
                  <div className="text-zinc-400 mt-1">one-time</div>
                  <div className="text-emerald-400 font-medium mt-2">
                    {tier.credits.toLocaleString()} credits included
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => handlePurchase(tier)}
                  disabled={loading !== null}
                  className={`w-full h-12 text-lg ${
                    tier.popular
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                      : 'bg-zinc-700 hover:bg-zinc-600'
                  }`}
                >
                  {loading === tier.id ? (
                    'Processing...'
                  ) : (
                    <>
                      Buy Now - ${tier.price}
                    </>
                  )}
                </Button>

                {/* PayPal Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.654h6.89c2.317 0 4.134.473 5.203 1.357.93.77 1.317 1.902 1.15 3.368-.284 2.497-1.698 4.216-4.204 5.11-.914.326-2.012.49-3.267.49H8.397a.77.77 0 0 0-.76.654l-.56 3.581zm10.89-13.567c.088-.618-.004-1.09-.277-1.403-.41-.47-1.23-.654-2.507-.654H9.77l-1.14 7.344h3.047c2.582 0 4.323-.877 5.054-2.536.252-.572.406-1.217.496-1.935l-.264.184z"/>
                  </svg>
                  Secure payment via PayPal
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-8 text-zinc-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Instant Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Money-Back Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Lifetime Updates</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">What are credits?</CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                Credits represent potential calls. Each call attempt uses 1 credit. 
                Your credits never expire - use them whenever you want.
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Do I need a PayPal account?</CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                No! PayPal also accepts credit/debit cards. You can pay as a guest 
                without creating a PayPal account.
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Can I add more credits later?</CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                Yes! You can purchase additional credits anytime from your dashboard.
                Credits are added instantly after payment.
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">What about API costs?</CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                You&apos;ll need your own Twilio account (pay-as-you-go, ~$0.01-0.02/min) 
                and optionally ElevenLabs (free tier available). We don&apos;t markup 
                any costs - you pay directly to providers.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center text-zinc-500 text-sm">
          <p>© 2024 1hundred.ai - All rights reserved</p>
          <p className="mt-2">
            Questions? Email us at <a href="mailto:support@1hundred.ai" className="text-emerald-400 hover:underline">support@1hundred.ai</a>
          </p>
        </footer>
      </main>
    </div>
  )
}

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, Info, Sparkles, Phone, CheckCircle, AlertTriangle } from "lucide-react"
import { PayPalCheckoutModal, type PurchaseResult } from '@/components/paypal/paypal-checkout-modal'
import { Slider } from '@/components/ui/slider'

interface BillingTabProps {
  managedMode: boolean
  setActiveTab: (tab: string) => void
  callerIdentities: any[]
  callerNumbersActive: number
  credits: number
  creditProducts: any[]
  billingEvents: Array<{ id: string; kind: string; amount: number; status: string; createdAt: string }>
  estimatedCostPer100: number | null
  lowCreditThreshold: number
  onPurchaseSuccess?: (result: PurchaseResult) => void
}

export function BillingTab({
  managedMode,
  setActiveTab,
  callerIdentities,
  callerNumbersActive,
  credits,
  creditProducts,
  billingEvents,
  estimatedCostPer100,
  lowCreditThreshold,
  onPurchaseSuccess,
}: BillingTabProps) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [customAedAmount, setCustomAedAmount] = useState(300)
  const usdPerCredit = React.useMemo(() => {
    if (typeof estimatedCostPer100 === 'number' && Number.isFinite(estimatedCostPer100) && estimatedCostPer100 > 0) {
      return estimatedCostPer100 / 100
    }
    const valid = creditProducts
      .filter((product: any) => Number(product?.credits) > 0 && Number(product?.price) > 0)
      .map((product: any) => Number(product.price) / Number(product.credits))
      .filter((value: number) => Number.isFinite(value) && value > 0)
    if (valid.length === 0) return 0.04
    return valid.reduce((sum: number, value: number) => sum + value, 0) / valid.length
  }, [creditProducts, estimatedCostPer100])

  if (!managedMode) {
    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in-50 duration-200">
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
          <CardHeader className="pb-5 md:pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl font-bold">Billing Architecture</CardTitle>
                <CardDescription className="text-zinc-400 mt-1">Configure your workspace for commercial outreach.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 md:p-8 text-center space-y-5 md:space-y-6">
            <div className="max-w-md mx-auto space-y-4">
              <p className="text-sm text-zinc-400 leading-relaxed">
                Managed Billing is currently disabled for this workspace. To unlock credit top-ups, number purchasing, and PayPal integration, please update your platform settings.
              </p>
              <Button
                size="lg"
                className="h-14 px-10 rounded-2xl font-bold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                onClick={() => setActiveTab('settings')}
              >
                Go to Workspace Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in-50 duration-200">
      <div className="grid gap-6 md:gap-8 xl:grid-cols-3">
        <Card className="xl:col-span-2 bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
          <CardHeader className="pb-5 md:pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-orange-400/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 md:w-6 md:h-6 text-orange-300" />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl font-bold">Recharge & Balance</CardTitle>
                <CardDescription className="text-zinc-400 mt-1">Securely manage your outreach credits and active lines via PayPal.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 md:p-8 space-y-8 md:space-y-12">
            {credits <= lowCreditThreshold && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-200">
                  Low credits: you currently have {credits}. Buy a pack to avoid campaign interruptions.
                </p>
              </div>
            )}
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-5 md:p-8 space-y-5 md:space-y-6 group hover:border-blue-500/20 transition-all duration-500">
                <div className="flex items-center justify-between">
                   <p className="text-sm font-bold text-zinc-300">Agent Line Activation</p>
                   <Phone className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Voice Agents</p>
                    <p className="text-2xl font-bold text-zinc-100">{callerIdentities.length}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Active Lines</p>
                    <p className="text-2xl font-bold text-sky-300">{callerNumbersActive}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveTab('callers')}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 font-bold"
                >
                  Manage Active Lines
                </Button>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-5 md:p-8 space-y-4 group hover:border-orange-400/20 transition-all duration-500">
                 <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-zinc-300">Credit Balance</p>
                    <Sparkles className="w-5 h-5 text-sky-300 group-hover:rotate-12 transition-transform" />
                 </div>
                 <div className="space-y-1 py-2">
                    <p className="text-4xl md:text-5xl font-black text-white tracking-tighter">{credits.toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold pt-2">Available outreach attempts</p>
                 </div>
                 <div className="pt-2 border-t border-zinc-800/70">
                    <p className="text-[11px] text-zinc-500">
                      Estimated cost per 100 calls: {estimatedCostPer100 !== null ? `$${estimatedCostPer100.toFixed(2)}` : 'N/A'}
                    </p>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-sky-300" />
                 <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Recharge Budget</h3>
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-5 md:p-8 space-y-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Budget (AED)</p>
                    <p className="text-4xl font-black text-sky-300 leading-none">{customAedAmount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Approx USD</p>
                    <p className="text-xl font-bold text-zinc-100">${(customAedAmount / 3.6725).toFixed(2)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Slider
                    value={[customAedAmount]}
                    onValueChange={(value) => setCustomAedAmount(value[0] ?? 300)}
                    min={100}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>100 AED</span>
                    <span>1000 AED</span>
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/35 p-3">
                    <p className="text-sm text-zinc-300">
                      Estimated credits:
                      <span className="ml-2 font-bold text-sky-300">
                      {Math.max(1, Math.floor((customAedAmount / 3.6725) / Math.max(0.001, usdPerCredit))).toLocaleString()}
                      </span>
                    </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Final credits are calculated server-side from your live pricing configuration.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const estimatedCredits = Math.max(1, Math.floor((customAedAmount / 3.6725) / Math.max(0.001, usdPerCredit)))
                    setSelectedProduct({
                      id: 'credits_custom',
                      name: `${customAedAmount} AED Recharge`,
                      price: customAedAmount / 3.6725,
                      credits: estimatedCredits,
                      kind: 'credits',
                      customAedAmount,
                    })
                  }}
                  className="w-full h-12 rounded-xl bg-sky-500 hover:bg-sky-400 font-bold"
                >
                  Recharge {customAedAmount} AED
                </Button>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                 <Info className="w-4 h-4 text-zinc-500" />
                 <p className="text-[10px] text-zinc-500 font-medium italic">Payments are processed instantly. Credits are applied to your balance upon successful checkout.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Last Charges</h3>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{billingEvents.length} events</span>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 divide-y divide-zinc-800/70">
                {billingEvents.length === 0 ? (
                  <div className="p-4 text-xs text-zinc-500">No billing events yet.</div>
                ) : (
                  billingEvents.slice(0, 8).map(event => (
                    <div key={event.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                      <div>
                        <p className="text-sm text-zinc-200 font-medium">
                          {event.kind.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${event.amount < 0 ? 'text-amber-400' : 'text-sky-300'}`}>
                          {event.amount > 0 ? '+' : ''}{event.amount}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{event.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden border-orange-400/5">
          <CardHeader className="pb-5 md:pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
            <CardTitle className="text-lg font-bold">Workspace Standard</CardTitle>
          </CardHeader>
          <CardContent className="p-5 md:p-8 space-y-6 md:space-y-8">
            <div className="space-y-6">
               <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-orange-400/10 flex items-center justify-center shrink-0 mt-0.5">
                     <CheckCircle className="w-3.5 h-3.5 text-sky-300" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-sm font-bold text-zinc-200">Priority Processing</p>
                     <p className="text-xs text-zinc-500 leading-relaxed">Your outreach attempts are processed via our high-tier voice engine infrastructure.</p>
                  </div>
               </div>
               <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-orange-400/10 flex items-center justify-center shrink-0 mt-0.5">
                     <CheckCircle className="w-3.5 h-3.5 text-sky-300" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-sm font-bold text-zinc-200">Active Monitoring</p>
                     <p className="text-xs text-zinc-500 leading-relaxed">Full access to live campaign monitoring, recording history, and AI transcripts.</p>
                  </div>
               </div>
            </div>

            <div className="pt-8 border-t border-zinc-800 space-y-4 text-sm">
              <div className="flex justify-between items-center group">
                <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">Billing Provider</span>
                <span className="font-bold text-zinc-200">PayPal</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">Currency</span>
                <span className="font-bold text-zinc-200">USD</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">Active Lines</span>
                <span className="font-bold text-zinc-200">{callerNumbersActive}</span>
              </div>
              <div className="pt-4">
                <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                  Need a custom credit volume or enterprise active line management? Reach out to support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedProduct && (
        <PayPalCheckoutModal
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          price={selectedProduct.price}
          credits={selectedProduct.credits}
          customAedAmount={selectedProduct.customAedAmount}
          onSuccess={result => {
            setSelectedProduct(null)
            onPurchaseSuccess?.(result)
          }}
        />
      )}
    </div>
  )
}

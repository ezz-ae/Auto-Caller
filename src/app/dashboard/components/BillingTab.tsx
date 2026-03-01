import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, Info, Sparkles, Phone, CheckCircle } from "lucide-react"
import { PayPalCheckoutModal, type PurchaseResult } from '@/components/paypal/paypal-checkout-modal'

interface BillingTabProps {
  managedMode: boolean
  setActiveTab: (tab: string) => void
  callerIdentities: any[]
  callerNumbersActive: number
  credits: number
  creditProducts: any[]
  onPurchaseSuccess?: (result: PurchaseResult) => void
}

export function BillingTab({
  managedMode,
  setActiveTab,
  callerIdentities,
  callerNumbersActive,
  credits,
  creditProducts,
  onPurchaseSuccess,
}: BillingTabProps) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

  if (!managedMode) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-200">
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
          <CardHeader className="pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Billing Architecture</CardTitle>
                <CardDescription className="text-zinc-400 mt-1">Configure your workspace for commercial outreach.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-6">
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
    <div className="space-y-10 animate-in fade-in-50 duration-200">
      <div className="grid gap-8 xl:grid-cols-3">
        <Card className="xl:col-span-2 bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
          <CardHeader className="pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Recharge & Balance</CardTitle>
                <CardDescription className="text-zinc-400 mt-1">Securely manage your outreach credits and active lines via PayPal.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-12">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[32px] border border-zinc-800 bg-zinc-950/40 p-8 space-y-6 group hover:border-blue-500/20 transition-all duration-500">
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
                    <p className="text-2xl font-bold text-emerald-400">{callerNumbersActive}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveTab('callers')}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 font-bold"
                >
                  Manage Active Lines
                </Button>
              </div>

              <div className="rounded-[32px] border border-zinc-800 bg-zinc-950/40 p-8 space-y-4 group hover:border-emerald-500/20 transition-all duration-500">
                 <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-zinc-300">Credit Balance</p>
                    <Sparkles className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                 </div>
                 <div className="space-y-1 py-2">
                    <p className="text-5xl font-black text-white tracking-tighter">{credits.toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold pt-2">Available outreach attempts</p>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                 <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Select Credit Package</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {creditProducts.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="group relative rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 text-left hover:border-emerald-500/40 hover:bg-zinc-900 transition-all duration-300 overflow-hidden"
                  >
                    <div className="space-y-1 relative z-10">
                       <p className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors">{(product.credits || 0).toLocaleString()}</p>
                       <p className="text-sm text-zinc-500 font-medium">Credits</p>
                    </div>
                    <div className="mt-8 relative z-10">
                       <p className="text-xl font-bold text-zinc-100">${product.price.toFixed(2)}</p>
                       <div className="flex items-center justify-between mt-3">
                          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">PayPal Secure</p>
                          <ArrowRightIcon className="w-4 h-4 text-zinc-700 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
                       </div>
                    </div>

                    {index === 1 && (
                       <div className="absolute top-0 right-0 p-2">
                          <Badge className="bg-emerald-500 text-zinc-950 font-black text-[9px] uppercase tracking-tighter border-none rounded-lg">Popular</Badge>
                       </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                 <Info className="w-4 h-4 text-zinc-500" />
                 <p className="text-[10px] text-zinc-500 font-medium italic">Payments are processed instantly. Credits are applied to your balance upon successful checkout.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden border-emerald-500/5">
          <CardHeader className="pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
            <CardTitle className="text-lg font-bold">Workspace Standard</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
               <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                     <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-sm font-bold text-zinc-200">Priority Processing</p>
                     <p className="text-xs text-zinc-500 leading-relaxed">Your outreach attempts are processed via our high-tier voice engine infrastructure.</p>
                  </div>
               </div>
               <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                     <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
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
          onSuccess={result => {
            setSelectedProduct(null)
            onPurchaseSuccess?.(result)
          }}
        />
      )}
    </div>
  )
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CheckCircle2, AlertCircle, Loader2, CreditCard, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface PurchaseResult {
  credits?: number
  assignedPhoneNumber?: string
  message: string
}

interface PayPalCheckoutModalProps {
  open: boolean
  onClose: () => void
  productId: string
  productName: string
  price: number
  credits?: number
  callerIdentityId?: string
  onSuccess?: (result: PurchaseResult) => void
}

type ModalState = 'loading' | 'ready' | 'processing' | 'success' | 'error'

function CheckoutContent({
  productId,
  productName,
  price,
  credits,
  callerIdentityId,
  onSuccess,
  onClose,
}: Omit<PayPalCheckoutModalProps, 'open'>) {
  const [state, setState] = useState<ModalState>('ready')
  const [result, setResult] = useState<PurchaseResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const isNumber = productId === 'number_activation'

  const handleCreateOrder = async () => {
    setState('processing')
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, callerIdentityId }),
      })
      const data = await res.json()
      if (!res.ok || !data.orderId) {
        throw new Error(data.error || 'Failed to create order')
      }
      return data.orderId as string
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create order')
      throw err
    }
  }

  const handleApprove = async (data: { orderID: string }) => {
    setState('processing')
    try {
      const res = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      })
      const payload = await res.json()
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Payment capture failed')
      }
      const purchaseResult: PurchaseResult = {
        credits: payload.credits,
        assignedPhoneNumber: payload.assignedPhoneNumber,
        message: payload.message,
      }
      setResult(purchaseResult)
      setState('success')
      onSuccess?.(purchaseResult)
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Payment capture failed')
    }
  }

  if (state === 'success' && result) {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="w-16 h-16 rounded-full bg-cyan-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-cyan-400" />
        </div>
        <div className="space-y-1.5">
          <p className="text-lg font-semibold text-white">Payment successful</p>
          {result.assignedPhoneNumber ? (
            <p className="text-sm text-zinc-400">
              Your number <span className="text-cyan-400 font-mono">{result.assignedPhoneNumber}</span> is now active.
            </p>
          ) : (
            <p className="text-sm text-zinc-400">
              <span className="text-cyan-400 font-bold">{result.credits?.toLocaleString()}</span> credits added to your balance.
            </p>
          )}
        </div>
        <Button
          onClick={onClose}
          className="w-full max-w-xs h-11 rounded-xl bg-cyan-500 hover:bg-cyan-600 font-semibold"
        >
          Done
        </Button>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div className="space-y-1.5">
          <p className="text-lg font-semibold text-white">Payment failed</p>
          <p className="text-sm text-zinc-400">{errorMsg || 'Something went wrong. Please try again.'}</p>
        </div>
        <div className="flex gap-2 w-full max-w-xs">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-zinc-700/60 text-zinc-400 hover:text-zinc-100"
          >
            Cancel
          </Button>
          <Button
            onClick={() => { setState('ready'); setErrorMsg('') }}
            className="flex-1 h-11 rounded-xl bg-zinc-700 hover:bg-zinc-600 font-semibold"
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Product summary */}
      <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/50 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0">
          {isNumber ? (
            <Phone className="w-5 h-5 text-cyan-400" />
          ) : (
            <CreditCard className="w-5 h-5 text-cyan-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{productName}</p>
          {credits ? (
            <p className="text-xs text-zinc-500">{credits.toLocaleString()} outbound call credits</p>
          ) : (
            <p className="text-xs text-zinc-500">Dedicated caller number</p>
          )}
        </div>
        <p className="text-lg font-bold text-white shrink-0">${price.toFixed(2)}</p>
      </div>

      {/* PayPal buttons */}
      <div className="space-y-3">
        {state === 'processing' ? (
          <div className="flex items-center justify-center gap-2 h-12 rounded-xl bg-zinc-800 text-zinc-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing payment…
          </div>
        ) : (
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'pay',
              height: 48,
            }}
            forceReRender={[productId, callerIdentityId]}
            createOrder={handleCreateOrder}
            onApprove={handleApprove}
            onCancel={() => setState('ready')}
            onError={() => {
              setState('error')
              setErrorMsg('Payment was cancelled or failed. Please try again.')
            }}
          />
        )}
      </div>

      <p className="text-center text-[11px] text-zinc-600">
        Secured by PayPal · One-time charge · Credits applied instantly
      </p>
    </div>
  )
}

export function PayPalCheckoutModal({
  open,
  onClose,
  productId,
  productName,
  price,
  credits,
  callerIdentityId,
  onSuccess,
}: PayPalCheckoutModalProps) {
  const [clientId, setClientId] = useState<string | null>(null)
  const [configError, setConfigError] = useState(false)

  useEffect(() => {
    if (!open || clientId) return
    fetch('/api/paypal/config')
      .then(r => r.json())
      .then(d => {
        if (d.clientId) setClientId(d.clientId)
        else setConfigError(true)
      })
      .catch(() => setConfigError(true))
  }, [open, clientId])

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Complete purchase</DialogTitle>
          <DialogDescription className="text-zinc-500 text-sm">
            Pay securely via PayPal — no redirect required.
          </DialogDescription>
        </DialogHeader>

        {configError ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            PayPal is not configured. Contact the workspace owner.
          </div>
        ) : !clientId ? (
          <div className="flex items-center justify-center gap-2 py-8 text-zinc-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading payment…
          </div>
        ) : (
          <PayPalScriptProvider options={{ clientId, currency: 'USD', intent: 'capture' }}>
            <CheckoutContent
              productId={productId}
              productName={productName}
              price={price}
              credits={credits}
              callerIdentityId={callerIdentityId}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </PayPalScriptProvider>
        )}
      </DialogContent>
    </Dialog>
  )
}

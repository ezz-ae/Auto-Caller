'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [credits, setCredits] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [assignedPhoneNumber, setAssignedPhoneNumber] = useState('')
  const initRef = useRef(false)
  
  useEffect(() => {
    // Prevent double execution
    if (initRef.current) return
    initRef.current = true
    
    const orderId = searchParams.get('token')
    
    if (!orderId) {
      // Use setTimeout to defer setState outside effect
      const timer = setTimeout(() => {
        setStatus('error')
      }, 0)
      return () => clearTimeout(timer)
    }
    
    // Capture the payment
    let cancelled = false
    
    const capturePayment = async () => {
      try {
        const res = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        })
        
        if (cancelled) return
        
        const data = await res.json()
        
        if (data.success) {
          setCredits(data.credits)
          setMessage(data.message || '')
          setAssignedPhoneNumber(data.assignedPhoneNumber || '')
          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch {
        if (!cancelled) {
          setStatus('error')
        }
      }
    }
    
    capturePayment()
    
    return () => {
      cancelled = true
    }
  }, [searchParams])
  
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#142a24_0%,#0a0f10_50%,#09090b_100%)] text-white flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-emerald-400 animate-spin" />
              <CardTitle>Processing Payment</CardTitle>
              <CardDescription>Please wait while we confirm your payment...</CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
              <CardTitle className="text-emerald-400">Payment Successful!</CardTitle>
              <CardDescription>
                {assignedPhoneNumber
                  ? `Your dedicated number is ready: ${assignedPhoneNumber}`
                  : (message || (credits ? `You now have ${credits.toLocaleString()} credits.` : 'Your credits have been added.'))}
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <CardTitle className="text-red-400">Payment Error</CardTitle>
              <CardDescription>
                Something went wrong. Please contact support if you were charged.
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          {status !== 'loading' && (
            <div className="space-y-2">
              <Link href="/dashboard">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                  Open Workspace
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="secondary" className="w-full bg-zinc-800 hover:bg-zinc-700">
                  Need Help? Open FAQ
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

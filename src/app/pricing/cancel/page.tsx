'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle } from 'lucide-react'

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#142a24_0%,#0a0f10_50%,#09090b_100%)] text-white flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full">
        <CardHeader className="text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
          <CardTitle>Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Link href="/dashboard">
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
              Back to Billing
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline" className="w-full border-zinc-700">
              Back to Website
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

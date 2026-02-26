'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle } from 'lucide-react'

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full">
        <CardHeader className="text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
          <CardTitle>Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Link href="/pricing">
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
              Try Again
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline" className="w-full border-zinc-700">
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

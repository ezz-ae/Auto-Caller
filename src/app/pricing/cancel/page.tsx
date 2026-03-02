'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle } from 'lucide-react'

export default function CancelPage() {
  return (
    <div className="cw-editor-marketing min-h-screen text-white flex items-center justify-center p-4">
      <Card className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/75 to-zinc-950/85 border-cyan-500/20 max-w-md w-full">
        <CardHeader className="text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
          <CardTitle>Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Link href="/dashboard">
            <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
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

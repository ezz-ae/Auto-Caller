import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.PAYPAL_CLIENT_ID || ''
  const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox'

  if (!clientId) {
    return NextResponse.json({ error: 'PayPal not configured' }, { status: 503 })
  }

  return NextResponse.json({ clientId, mode })
}

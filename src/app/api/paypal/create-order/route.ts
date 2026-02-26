import { NextRequest, NextResponse } from 'next/server'

// PayPal API base URL (sandbox or live)
const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

// PayPal credentials
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''

// Tier definitions
const TIERS: Record<string, { price: number; credits: number; name: string }> = {
  starter: { price: 97, credits: 500, name: 'Starter Plan' },
  pro: { price: 197, credits: 1500, name: 'Pro Plan' },
  agency: { price: 397, credits: 5000, name: 'Agency Plan' },
}

// Get PayPal access token
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  
  const data = await res.json()
  
  if (!res.ok) {
    throw new Error('Failed to get PayPal access token')
  }
  
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tierId, price, credits } = body
    
    // Validate tier
    const tier = TIERS[tierId]
    if (!tier) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }
    
    // Validate price matches
    if (tier.price !== price || tier.credits !== credits) {
      return NextResponse.json({ error: 'Price mismatch' }, { status: 400 })
    }
    
    // Get access token
    const accessToken = await getAccessToken()
    
    // Create PayPal order
    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: tierId,
          description: `Auto Caller Pro - ${tier.name}`,
          amount: {
            currency_code: 'USD',
            value: price.toFixed(2),
          },
          custom_id: JSON.stringify({ tierId, credits }),
        }],
        application_context: {
          brand_name: '1hundred.ai - Auto Caller Pro',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing/cancel`,
        },
      }),
    })
    
    const orderData = await orderRes.json()
    
    if (!orderRes.ok) {
      console.error('PayPal order error:', orderData)
      return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 })
    }
    
    // Find the approval URL
    const approvalUrl = orderData.links?.find(
      (link: { rel: string; href: string }) => link.rel === 'approve'
    )?.href
    
    return NextResponse.json({
      orderId: orderData.id,
      approvalUrl,
    })
    
  } catch (error) {
    console.error('PayPal create order error:', error)
    return NextResponse.json({ 
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

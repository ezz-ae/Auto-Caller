import { NextRequest, NextResponse } from 'next/server'

// PayPal API base URL (sandbox or live)
const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

// PayPal credentials
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''

type Product = {
  id: string
  name: string
  price: number
  kind: 'credits' | 'number'
  credits?: number
}

// Product catalog for managed mode sales
const PRODUCTS: Record<string, Product> = {
  credits_500: { id: 'credits_500', name: '500 Credits Pack', price: 49, kind: 'credits', credits: 500 },
  credits_1500: { id: 'credits_1500', name: '1,500 Credits Pack', price: 129, kind: 'credits', credits: 1500 },
  credits_5000: { id: 'credits_5000', name: '5,000 Credits Pack', price: 349, kind: 'credits', credits: 5000 },
  number_activation: { id: 'number_activation', name: 'Dedicated Phone Number', price: 39, kind: 'number' },
}

// Backward compatibility with old tier API contract
const LEGACY_TIERS: Record<string, { price: number; credits: number; name: string }> = {
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
    const { productId, tierId, price, credits } = body

    let product: Product | null = null

    if (productId) {
      product = PRODUCTS[productId] || null
      if (!product) {
        return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
      }
      if (product.price !== price) {
        return NextResponse.json({ error: 'Price mismatch' }, { status: 400 })
      }
      if (product.kind === 'credits' && product.credits !== credits) {
        return NextResponse.json({ error: 'Credit amount mismatch' }, { status: 400 })
      }
    } else if (tierId) {
      const tier = LEGACY_TIERS[tierId]
      if (!tier) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
      }
      if (tier.price !== price || tier.credits !== credits) {
        return NextResponse.json({ error: 'Price mismatch' }, { status: 400 })
      }
      product = {
        id: tierId,
        name: tier.name,
        price: tier.price,
        kind: 'credits',
        credits: tier.credits,
      }
    } else {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
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
          reference_id: product.id,
          description: `Auto Caller Pro - ${product.name}`,
          amount: {
            currency_code: 'USD',
            value: product.price.toFixed(2),
          },
          custom_id: JSON.stringify({
            productId: product.id,
            kind: product.kind,
            credits: product.credits || 0,
          }),
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

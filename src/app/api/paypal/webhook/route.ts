import { NextRequest, NextResponse } from 'next/server'

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
const WEBHOOK_ID = String(process.env.PAYPAL_WEBHOOK_ID || '').trim()

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.access_token) {
    throw new Error('Failed to get PayPal access token for webhook verification')
  }
  return data.access_token as string
}

async function isValidPayPalWebhook(request: NextRequest, event: Record<string, unknown>): Promise<boolean> {
  if (String(process.env.SKIP_PAYPAL_WEBHOOK_VERIFICATION || '').trim().toLowerCase() === 'true') {
    return true
  }

  if (!WEBHOOK_ID) {
    return process.env.NODE_ENV !== 'production'
  }

  const transmissionId = request.headers.get('paypal-transmission-id') || ''
  const transmissionTime = request.headers.get('paypal-transmission-time') || ''
  const transmissionSig = request.headers.get('paypal-transmission-sig') || ''
  const certUrl = request.headers.get('paypal-cert-url') || ''
  const authAlgo = request.headers.get('paypal-auth-algo') || ''

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    return false
  }

  const accessToken = await getAccessToken()
  const verifyRes = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: WEBHOOK_ID,
      webhook_event: event,
    }),
  })

  const verifyData = await verifyRes.json().catch(() => ({}))
  if (!verifyRes.ok) return false
  return String(verifyData?.verification_status || '').toUpperCase() === 'SUCCESS'
}

// PayPal webhook handler for automated payment notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validWebhook = await isValidPayPalWebhook(request, body)
    if (!validWebhook) {
      return NextResponse.json({ error: 'Invalid PayPal webhook signature' }, { status: 401 })
    }

    const eventType = body.event_type
    
    // Handle different event types
    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED': {
        // Order approved by buyer, capture it
        const orderId = body.resource?.id
        console.log(`Order ${orderId} approved, ready for capture`)
        break
      }
      
      case 'PAYMENT.CAPTURE.COMPLETED': {
        // Credits are granted in /api/paypal/capture-order after explicit capture.
        // Keeping webhook read-only avoids duplicate credits and unverified-credit abuse.
        console.log('PAYMENT.CAPTURE.COMPLETED received')
        break
      }
      
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED': {
        // Handle refunds or denied payments if needed
        console.log(`Payment event: ${eventType}`)
        break
      }
      
      default:
        console.log(`Unhandled PayPal event: ${eventType}`)
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('PayPal webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

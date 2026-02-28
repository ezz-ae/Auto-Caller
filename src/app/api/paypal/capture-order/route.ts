import { NextRequest, NextResponse } from 'next/server'
import { updateCredits } from '@/lib/store'
import { assignManagedNumber } from '@/lib/store'
import { assignDedicatedNumberToCallerIdentity } from '@/lib/caller-identity-store'
import { requireUserIdFromRequest } from '@/lib/request-user'

// PayPal API base URL
const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''

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
    const userId = requireUserIdFromRequest(request)
    const body = await request.json()
    const { orderId } = body
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }
    
    // Get access token
    const accessToken = await getAccessToken()
    
    // Capture the PayPal order
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    const captureData = await captureRes.json()
    
    if (!captureRes.ok) {
      console.error('PayPal capture error:', captureData)
      return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 })
    }
    
    // Extract purchase info
    const purchaseUnit = captureData.purchase_units?.[0]
    const customId = purchaseUnit?.custom_id
    
    if (customId) {
      try {
        const parsed = JSON.parse(customId)
        const kind = parsed.kind as 'credits' | 'number' | undefined
        const credits = Number(parsed.credits || 0)
        const productId = parsed.productId || parsed.tierId
        const paymentUserId = String(parsed.userId || '').trim()
        if (paymentUserId && paymentUserId !== userId) {
          return NextResponse.json({ error: 'Order does not belong to current user' }, { status: 403 })
        }
        const callerIdentityId =
          typeof parsed.callerIdentityId === 'string' && parsed.callerIdentityId.trim()
            ? parsed.callerIdentityId.trim()
            : ''

        if (kind === 'number') {
          if (callerIdentityId) {
            const identity = await assignDedicatedNumberToCallerIdentity(callerIdentityId, userId)
            if (!identity?.dedicatedNumber) {
              return NextResponse.json({ error: 'Failed to assign dedicated number to caller identity' }, { status: 500 })
            }

            return NextResponse.json({
              success: true,
              message: `Payment successful! ${identity.name} now has number ${identity.dedicatedNumber}`,
              assignedPhoneNumber: identity.dedicatedNumber,
              callerIdentityId: identity.id,
              callerIdentityName: identity.name,
              productId,
              credits: await updateCredits(0, userId),
            })
          }

          const assignedPhoneNumber = await assignManagedNumber(userId)
          return NextResponse.json({
            success: true,
            message: `Payment successful! Your dedicated number is ready: ${assignedPhoneNumber}`,
            assignedPhoneNumber,
            productId,
            credits: await updateCredits(0, userId),
          })
        }

        // Default behavior: add credits
        const newCredits = await updateCredits(credits, userId)
        
        return NextResponse.json({
          success: true,
          message: `Payment successful! ${credits} credits added.`,
          credits: newCredits,
          productId,
        })
      } catch (parseError) {
        console.error('Failed to parse custom_id:', parseError)
      }
    }
    
    // If we get here, payment was successful but we couldn't add credits automatically
    return NextResponse.json({
      success: true,
      message: 'Payment successful! Credits will be added shortly.',
      orderId: captureData.id,
    })
    
  } catch (error) {
    console.error('PayPal capture order error:', error)
    return NextResponse.json({ 
      error: 'Failed to capture payment',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

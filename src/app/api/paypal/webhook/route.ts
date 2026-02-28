import { NextRequest, NextResponse } from 'next/server'

// PayPal webhook handler for automated payment notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify webhook signature (in production, you should verify this)
    // const signature = request.headers.get('paypal-transmission-sig')
    // ... verification logic here
    
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

import { NextRequest, NextResponse } from 'next/server'
import { updateCredits } from '@/lib/store'

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
        // Payment was captured successfully
        const customId = body.resource?.custom_id
        
        if (customId) {
          try {
            const { tierId, credits } = JSON.parse(customId)
            const newCredits = updateCredits(credits)
            console.log(`Added ${credits} credits from webhook. Total: ${newCredits}`)
          } catch (parseError) {
            console.error('Failed to parse custom_id from webhook:', parseError)
          }
        }
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

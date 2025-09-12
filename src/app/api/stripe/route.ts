import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { action, userId, priceId, customerId } = await request.json();

    switch (action) {
      case 'create-customer':
        const customer = await stripe.customers.create({
          email: userId, // Assuming userId is email for now
          metadata: {
            userId,
          },
        });

        return NextResponse.json({
          success: true,
          data: { customerId: customer.id },
        });

      case 'create-subscription':
        if (!priceId || !customerId) {
          return NextResponse.json(
            { success: false, error: 'Price ID and customer ID are required' },
            { status: 400 }
          );
        }

        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent'],
        });

        return NextResponse.json({
          success: true,
          data: {
            subscriptionId: subscription.id,
            clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          },
        });

      case 'create-checkout-session':
        if (!priceId) {
          return NextResponse.json(
            { success: false, error: 'Price ID is required' },
            { status: 400 }
          );
        }

        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
          metadata: {
            userId,
          },
        });

        return NextResponse.json({
          success: true,
          data: { sessionId: session.id, url: session.url },
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { success: false, error: 'Stripe operation failed' },
      { status: 500 }
    );
  }
}

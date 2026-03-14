// Stripe Webhook Handler
// Syncs product/price/subscription changes from Stripe to Supabase
// Based on vercel/nextjs-subscription-payments patterns

import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent, getPlanFromMetadata } from '../../../../lib/stripe';
import { getSupabaseAdmin } from '../../../../lib/supabase';
import type Stripe from 'stripe';

// Disable body parsing — we need the raw body for signature verification
export const dynamic = 'force-dynamic';

const RELEVANT_EVENTS = new Set([
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json(
      { error: `Webhook signature verification failed` },
      { status: 400 }
    );
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case 'product.created':
      case 'product.updated': {
        const product = event.data.object as Stripe.Product;
        await supabase.from('products').upsert({
          id: product.id,
          active: product.active,
          name: product.name,
          description: product.description ?? null,
          metadata: product.metadata,
        });
        break;
      }

      case 'product.deleted': {
        const product = event.data.object as Stripe.Product;
        await supabase.from('products').update({ active: false }).eq('id', product.id);
        break;
      }

      case 'price.created':
      case 'price.updated': {
        const price = event.data.object as Stripe.Price;
        await supabase.from('prices').upsert({
          id: price.id,
          product_id: typeof price.product === 'string' ? price.product : price.product.id,
          active: price.active,
          currency: price.currency,
          unit_amount: price.unit_amount,
          interval: price.recurring?.interval ?? null,
          interval_count: price.recurring?.interval_count ?? 1,
          metadata: price.metadata,
        });
        break;
      }

      case 'price.deleted': {
        const price = event.data.object as Stripe.Price;
        await supabase.from('prices').update({ active: false }).eq('id', price.id);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (userId && session.customer) {
          const customerId = typeof session.customer === 'string'
            ? session.customer
            : session.customer.id;
          await supabase
            .from('users')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        // Find user by stripe_customer_id
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!user) {
          console.error('[webhook] No user found for customer:', customerId);
          break;
        }

        const priceId = subscription.items.data[0]?.price?.id;

        // Upsert subscription record
        await supabase.from('subscriptions').upsert({
          id: subscription.id,
          user_id: user.id,
          status: subscription.status,
          price_id: priceId,
          quantity: subscription.items.data[0]?.quantity ?? 1,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          canceled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        });

        // Determine plan from price's product metadata
        if (priceId) {
          const { data: price } = await supabase
            .from('prices')
            .select('product_id')
            .eq('id', priceId)
            .single();

          if (price?.product_id) {
            const { data: product } = await supabase
              .from('products')
              .select('metadata')
              .eq('id', price.product_id)
              .single();

            const plan = getPlanFromMetadata(product?.metadata as Record<string, string> | null);
            const isActive = ['active', 'trialing'].includes(subscription.status);

            await supabase
              .from('users')
              .update({ plan: isActive ? plan : 'free' })
              .eq('id', user.id);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('id', subscription.id);

        // Downgrade user to free
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          await supabase.from('users').update({ plan: 'free' }).eq('id', user.id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[webhook] Processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

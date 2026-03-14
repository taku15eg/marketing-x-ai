// Stripe server-side utilities
// Based on vercel/nextjs-subscription-payments patterns

import Stripe from 'stripe';
import type { PlanType } from './rate-limiter';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }

  stripeInstance = new Stripe(key, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });
  return stripeInstance;
}

// === Plan mapping ===
// Maps Stripe product metadata.plan to our PlanType

const PLAN_PRICE_MAP: Record<string, PlanType> = {
  starter: 'starter',
  pro: 'pro',
  business: 'business',
};

export function getPlanFromMetadata(metadata: Record<string, string> | null): PlanType {
  if (!metadata?.plan) return 'free';
  return PLAN_PRICE_MAP[metadata.plan] || 'free';
}

// === Checkout session creation ===

export async function createCheckoutSession(params: {
  priceId: string;
  userId: string;
  stripeCustomerId?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripe();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { user_id: params.userId },
    allow_promotion_codes: true,
  };

  if (params.stripeCustomerId) {
    sessionParams.customer = params.stripeCustomerId;
  } else {
    sessionParams.customer_creation = 'always';
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url!;
}

// === Customer portal ===

export async function createPortalSession(params: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl,
  });
  return session.url;
}

// === Webhook signature verification ===

export function constructWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

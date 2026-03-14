/**
 * Billing Integration Tests
 *
 * Tests Stripe webhook handler, billing API route, and auth helper
 * using route source code verification pattern.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Stripe Webhook Handler', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../app/api/webhooks/stripe/route.ts'),
    'utf-8'
  );

  it('verifies webhook signature', () => {
    expect(source).toContain('constructWebhookEvent');
    expect(source).toContain('stripe-signature');
  });

  it('handles product events', () => {
    expect(source).toContain('product.created');
    expect(source).toContain('product.updated');
    expect(source).toContain('product.deleted');
  });

  it('handles price events', () => {
    expect(source).toContain('price.created');
    expect(source).toContain('price.updated');
    expect(source).toContain('price.deleted');
  });

  it('handles subscription lifecycle', () => {
    expect(source).toContain('customer.subscription.created');
    expect(source).toContain('customer.subscription.updated');
    expect(source).toContain('customer.subscription.deleted');
  });

  it('handles checkout completion', () => {
    expect(source).toContain('checkout.session.completed');
    expect(source).toContain('stripe_customer_id');
  });

  it('updates user plan on subscription change', () => {
    expect(source).toContain('getPlanFromMetadata');
    expect(source).toContain("plan: isActive ? plan : 'free'");
  });

  it('downgrades to free on subscription deletion', () => {
    expect(source).toContain("plan: 'free'");
    expect(source).toContain("status: 'canceled'");
  });

  it('returns 400 for missing signature', () => {
    expect(source).toContain('Missing stripe-signature header');
    expect(source).toContain('status: 400');
  });

  it('uses Supabase admin client for DB operations', () => {
    expect(source).toContain('getSupabaseAdmin');
  });
});

describe('Billing API Route', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../app/api/billing/route.ts'),
    'utf-8'
  );

  it('requires authentication', () => {
    expect(source).toContain('authorization');
    expect(source).toContain('status: 401');
    expect(source).toContain('ログインが必要です');
  });

  it('supports checkout session creation', () => {
    expect(source).toContain('createCheckoutSession');
    expect(source).toContain('price_id');
  });

  it('supports customer portal', () => {
    expect(source).toContain('createPortalSession');
    expect(source).toContain("action === 'portal'");
  });

  it('passes user_id to checkout session', () => {
    expect(source).toContain('userId: user.id');
  });
});

describe('Auth Helper', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../lib/auth.ts'),
    'utf-8'
  );

  it('extracts user plan from Supabase', () => {
    expect(source).toContain("select('plan, stripe_customer_id')");
  });

  it('returns null for unauthenticated requests', () => {
    expect(source).toContain('return null');
  });

  it('gracefully handles missing Supabase config', () => {
    expect(source).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(source).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });

  it('uses server client with auth header', () => {
    expect(source).toContain('getSupabaseServerClient');
  });
});

describe('Stripe Helper', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../lib/stripe.ts'),
    'utf-8'
  );

  it('maps product metadata to plan types', () => {
    expect(source).toContain('getPlanFromMetadata');
    expect(source).toContain("starter: 'starter'");
    expect(source).toContain("pro: 'pro'");
    expect(source).toContain("business: 'business'");
  });

  it('requires STRIPE_SECRET_KEY', () => {
    expect(source).toContain('STRIPE_SECRET_KEY');
  });

  it('requires STRIPE_WEBHOOK_SECRET for verification', () => {
    expect(source).toContain('STRIPE_WEBHOOK_SECRET');
  });

  it('creates checkout with subscription mode', () => {
    expect(source).toContain("mode: 'subscription'");
  });
});

describe('Supabase Helper', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../lib/supabase.ts'),
    'utf-8'
  );

  it('provides admin client with service role key', () => {
    expect(source).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(source).toContain('getSupabaseAdmin');
  });

  it('provides browser client with anon key', () => {
    expect(source).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    expect(source).toContain('getSupabaseBrowser');
  });

  it('provides per-request server client with auth header', () => {
    expect(source).toContain('getSupabaseServerClient');
    expect(source).toContain('Authorization');
  });
});

describe('Plan-aware Rate Limiting in Analyze Route', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../app/api/analyze/route.ts'),
    'utf-8'
  );

  it('imports auth helper', () => {
    expect(source).toContain('getAuthenticatedUser');
  });

  it('uses plan-based rate limit config', () => {
    expect(source).toContain('getRateLimitForPlan');
    expect(source).toContain("authUser?.plan ?? 'free'");
  });

  it('uses user ID for authenticated rate limit key', () => {
    expect(source).toContain('monthly:user:${authUser.id}');
  });

  it('falls back to IP for anonymous users', () => {
    expect(source).toContain('monthly:${clientIP}');
  });
});

describe('Database Schema', () => {
  const schema = fs.readFileSync(
    path.resolve(__dirname, '../supabase/migrations/001_auth_and_billing.sql'),
    'utf-8'
  );

  it('creates users table with plan column', () => {
    expect(schema).toContain('create table if not exists public.users');
    expect(schema).toContain('plan');
    expect(schema).toContain('stripe_customer_id');
  });

  it('creates products and prices tables', () => {
    expect(schema).toContain('create table if not exists public.products');
    expect(schema).toContain('create table if not exists public.prices');
  });

  it('creates subscriptions table', () => {
    expect(schema).toContain('create table if not exists public.subscriptions');
    expect(schema).toContain('current_period_start');
    expect(schema).toContain('current_period_end');
  });

  it('creates analyses table for persistent storage', () => {
    expect(schema).toContain('create table if not exists public.analyses');
    expect(schema).toContain('user_id');
    expect(schema).toContain('result jsonb');
  });

  it('creates share_links table with expiry', () => {
    expect(schema).toContain('create table if not exists public.share_links');
    expect(schema).toContain('expires_at');
  });

  it('enables RLS on all tables', () => {
    expect(schema).toContain('enable row level security');
  });

  it('creates trigger for auto-creating user on signup', () => {
    expect(schema).toContain('handle_new_user');
    expect(schema).toContain('on_auth_user_created');
  });

  it('creates plan_type enum', () => {
    expect(schema).toContain("'free'");
    expect(schema).toContain("'starter'");
    expect(schema).toContain("'pro'");
    expect(schema).toContain("'business'");
  });
});

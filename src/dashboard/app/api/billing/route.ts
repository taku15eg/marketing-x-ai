// Billing API: Checkout + Customer Portal
// POST /api/billing - Create checkout session or portal session

import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, createPortalSession } from '../../../lib/stripe';
import { getSupabaseServerClient } from '../../../lib/supabase';
import { CORS_HEADERS } from '../../../lib/cors';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Verify user via Supabase Auth
    const supabase = getSupabaseServerClient(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '認証に失敗しました' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    let body: { action?: string; price_id?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'リクエストボディのJSONが不正です' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const origin = request.headers.get('origin') || request.nextUrl.origin;

    // === Portal session (manage existing subscription) ===
    if (body.action === 'portal') {
      const { data: userData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!userData?.stripe_customer_id) {
        return NextResponse.json(
          { error: 'サブスクリプションが見つかりません' },
          { status: 404, headers: CORS_HEADERS }
        );
      }

      const portalUrl = await createPortalSession({
        stripeCustomerId: userData.stripe_customer_id,
        returnUrl: `${origin}/`,
      });

      return NextResponse.json({ url: portalUrl }, { status: 200, headers: CORS_HEADERS });
    }

    // === Checkout session (new subscription) ===
    if (!body.price_id) {
      return NextResponse.json(
        { error: 'price_idが指定されていません' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const checkoutUrl = await createCheckoutSession({
      priceId: body.price_id,
      userId: user.id,
      stripeCustomerId: userData?.stripe_customer_id ?? undefined,
      successUrl: `${origin}/?checkout=success`,
      cancelUrl: `${origin}/?checkout=canceled`,
    });

    return NextResponse.json({ url: checkoutUrl }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('[/api/billing] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '決済処理中にエラーが発生しました' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

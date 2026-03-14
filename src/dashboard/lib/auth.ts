// Auth helper: extracts user and plan from request
// Returns null for unauthenticated users (free tier falls through)

import { getSupabaseServerClient } from './supabase';
import type { PlanType } from './rate-limiter';

export interface AuthenticatedUser {
  id: string;
  email: string;
  plan: PlanType;
  stripe_customer_id: string | null;
}

/**
 * Attempts to extract authenticated user from request.
 * Returns null if:
 * - No authorization header
 * - Supabase env vars not configured (dev/test)
 * - Token is invalid
 */
export async function getAuthenticatedUser(
  request: Request
): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  // Skip auth if Supabase is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = getSupabaseServerClient(authHeader);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('plan, stripe_customer_id')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      plan: (userData?.plan as PlanType) || 'free',
      stripe_customer_id: userData?.stripe_customer_id || null,
    };
  } catch {
    return null;
  }
}

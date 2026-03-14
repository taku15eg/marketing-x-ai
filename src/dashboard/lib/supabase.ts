// Supabase client utilities for server-side and client-side usage

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// === Server-side client (with service role key for admin operations) ===

let serverClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (serverClient) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    );
  }

  serverClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serverClient;
}

// === Client-side client (with anon key, for Auth UI) ===

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
    );
  }

  browserClient = createClient(url, anonKey);
  return browserClient;
}

// === Per-request server client (uses user's auth token from request) ===

export function getSupabaseServerClient(authHeader: string | null): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
    );
  }

  return createClient(url, anonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

-- Publish Gate: Auth + Billing schema
-- Based on vercel/nextjs-subscription-payments patterns

-- === Users table (extends Supabase Auth) ===
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  plan public.plan_type not null default 'free',
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Plan enum type
do $$ begin
  create type public.plan_type as enum ('free', 'starter', 'pro', 'business');
exception when duplicate_object then null;
end $$;

-- Alter column to use enum (if table was created before enum)
alter table public.users alter column plan type public.plan_type using plan::public.plan_type;

-- === Stripe Products/Prices (synced via webhook) ===
create table if not exists public.products (
  id text primary key, -- Stripe product ID
  active boolean not null default true,
  name text not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.prices (
  id text primary key, -- Stripe price ID
  product_id text references public.products(id) on delete cascade,
  active boolean not null default true,
  currency text not null default 'jpy',
  unit_amount bigint,
  interval text, -- 'month' | 'year'
  interval_count integer default 1,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- === Subscriptions (synced via webhook) ===
create table if not exists public.subscriptions (
  id text primary key, -- Stripe subscription ID
  user_id uuid references public.users(id) on delete cascade not null,
  status text not null, -- 'active' | 'canceled' | 'past_due' | 'trialing' etc.
  price_id text references public.prices(id),
  quantity integer default 1,
  cancel_at_period_end boolean default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- === Analyses (replaces in-memory store) ===
create table if not exists public.analyses (
  id text primary key, -- nanoid 21 chars
  user_id uuid references public.users(id) on delete set null,
  url text not null,
  status text not null default 'processing', -- 'processing' | 'completed' | 'error'
  result jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_analyses_user_id on public.analyses(user_id);
create index if not exists idx_analyses_url on public.analyses(url);
create index if not exists idx_analyses_created_at on public.analyses(created_at desc);

-- === Share links ===
create table if not exists public.share_links (
  id text primary key, -- nanoid 21 chars
  analysis_id text references public.analyses(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists idx_share_links_analysis_id on public.share_links(analysis_id);

-- === Usage tracking (for rate limiting per user) ===
create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  ip_address text,
  action text not null, -- 'analysis' | 'ad_creative' | 'share'
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_records_user_month on public.usage_records(user_id, created_at);
create index if not exists idx_usage_records_ip_month on public.usage_records(ip_address, created_at);

-- === Row Level Security ===

alter table public.users enable row level security;
alter table public.analyses enable row level security;
alter table public.share_links enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_records enable row level security;

-- Users can read/update their own data
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

-- Analyses: users can read their own, anyone can read shared
create policy "Users can view own analyses" on public.analyses
  for select using (auth.uid() = user_id);
create policy "Users can insert own analyses" on public.analyses
  for insert with check (auth.uid() = user_id or user_id is null);

-- Share links: anyone can read (public access), creators can insert
create policy "Anyone can view share links" on public.share_links
  for select using (true);
create policy "Users can create share links" on public.share_links
  for insert with check (true);

-- Subscriptions: users can view own
create policy "Users can view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Usage records: users can view own
create policy "Users can view own usage" on public.usage_records
  for select using (auth.uid() = user_id);

-- === Trigger: auto-create user record on signup ===
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if any
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- === Trigger: update updated_at on users ===
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at();

-- GigShield AI schema updates for payout simulation and analytics

create extension if not exists "pgcrypto";

alter table public.riders
add column if not exists selected_plan text,
add column if not exists plan_premium numeric default 0,
add column if not exists upi_id text,
add column if not exists wallet_balance numeric default 0;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  type text not null check (type in ('premium', 'payout')),
  amount numeric not null check (amount >= 0),
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_rider_id on public.transactions(rider_id);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);
create index if not exists idx_transactions_type on public.transactions(type);

alter table public.risk_scores
add column if not exists risk_score numeric,
add column if not exists aqi numeric,
add column if not exists rainfall numeric,
add column if not exists flood_risk numeric,
add column if not exists payout_triggered boolean default false,
add column if not exists created_at timestamptz default now();

create or replace function public.sum_premiums()
returns numeric
language sql
stable
as $$
  select coalesce(sum(amount), 0)
  from public.transactions
  where type = 'premium';
$$;

/*
  # Database Schema Setup with Security Policies

  1. Tables
    - Creates base tables required for the application
    - Sets up proper constraints and defaults
  
  2. Security
    - Enables RLS on all tables
    - Creates policies for user data access
    - Sets up security audit logging
    
  3. Functions
    - Adds trial management functions
    - Creates security event logging
*/

-- Enable required extensions
create extension if not exists "pgcrypto";

-- Create base tables if they don't exist
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists game_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  game_id uuid not null,
  timestamp timestamptz not null,
  metrics jsonb not null,
  created_at timestamptz default now()
);

create table if not exists network_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  latency double precision not null,
  jitter double precision not null,
  packet_loss double precision not null,
  bandwidth double precision not null,
  route_hops jsonb not null,
  timestamp timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists system_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  cpu_metrics jsonb not null,
  memory_metrics jsonb not null,
  gpu_metrics jsonb not null,
  network_metrics jsonb not null,
  timestamp timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists feature_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  feature_id uuid not null,
  rating integer check (rating >= 1 and rating <= 5),
  feedback text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists stripe_customers (
  id bigint primary key,
  user_id uuid references users(id) unique not null,
  customer_id text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists stripe_subscriptions (
  id bigint primary key,
  customer_id text unique not null,
  subscription_id text,
  price_id text,
  current_period_start bigint,
  current_period_end bigint,
  cancel_at_period_end boolean default false,
  payment_method_brand text,
  payment_method_last4 text,
  status text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists stripe_orders (
  id bigint primary key,
  checkout_session_id text not null,
  payment_intent_id text not null,
  customer_id text not null,
  amount_subtotal bigint not null,
  amount_total bigint not null,
  currency text not null,
  payment_status text not null,
  status text not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Enable Row Level Security
alter table users enable row level security;
alter table game_metrics enable row level security;
alter table network_metrics enable row level security;
alter table system_metrics enable row level security;
alter table feature_feedback enable row level security;
alter table stripe_customers enable row level security;
alter table stripe_subscriptions enable row level security;
alter table stripe_orders enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can insert their own data" on users;
drop policy if exists "Users can read own data" on users;
drop policy if exists "Users can update own data" on users;
drop policy if exists "Users can insert own metrics" on game_metrics;
drop policy if exists "Users can read own metrics" on game_metrics;
drop policy if exists "Users can insert their own network metrics" on network_metrics;
drop policy if exists "Users can read their own network metrics" on network_metrics;
drop policy if exists "Users can insert their own system metrics" on system_metrics;
drop policy if exists "Users can read their own system metrics" on system_metrics;
drop policy if exists "Users can insert their own feedback" on feature_feedback;
drop policy if exists "Users can read their own feedback" on feature_feedback;
drop policy if exists "Users can view their own customer data" on stripe_customers;
drop policy if exists "Users can view their own subscription data" on stripe_subscriptions;
drop policy if exists "Users can view their own order data" on stripe_orders;

-- Create new policies
create policy "Users can insert their own data" on users 
  for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can read own data" on users 
  for select to authenticated
  using (auth.uid() = id);

create policy "Users can update own data" on users 
  for update to authenticated
  using (auth.uid() = id);

create policy "Users can insert own metrics" on game_metrics 
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read own metrics" on game_metrics 
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own network metrics" on network_metrics 
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read their own network metrics" on network_metrics 
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own system metrics" on system_metrics 
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read their own system metrics" on system_metrics 
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own feedback" on feature_feedback 
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read their own feedback" on feature_feedback 
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can view their own customer data" on stripe_customers 
  for select to authenticated
  using ((user_id = auth.uid()) and (deleted_at is null));

create policy "Users can view their own subscription data" on stripe_subscriptions 
  for select to authenticated
  using ((customer_id in (
    select customer_id 
    from stripe_customers 
    where (user_id = auth.uid()) and (deleted_at is null)
  )) and (deleted_at is null));

create policy "Users can view their own order data" on stripe_orders 
  for select to authenticated
  using ((customer_id in (
    select customer_id 
    from stripe_customers 
    where (user_id = auth.uid()) and (deleted_at is null)
  )) and (deleted_at is null));

-- Drop existing functions if they exist
drop function if exists log_security_event cascade;
drop function if exists check_trial_status cascade;
drop function if exists notify_trial_expiration cascade;

-- Create security audit logging function
create or replace function log_security_event() returns trigger as $$
begin
  insert into security_audit_logs (
    user_id,
    event_type,
    event_data,
    severity,
    status
  ) values (
    auth.uid(),
    TG_ARGV[0],
    row_to_json(NEW),
    TG_ARGV[1],
    'unresolved'
  );
  return NEW;
end;
$$ language plpgsql security definer;

-- Create trial management functions
create or replace function check_trial_status() returns trigger as $$
begin
  if NEW.trial_end_date < now() and NEW.trial_status = 'active' then
    NEW.trial_status := 'expired';
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create or replace function notify_trial_expiration() returns trigger as $$
begin
  if NEW.trial_status = 'expired' and OLD.trial_status = 'active' then
    insert into security_audit_logs (
      user_id,
      event_type,
      event_data,
      severity,
      status
    ) values (
      NEW.user_id,
      'trial_expired',
      jsonb_build_object(
        'trial_started_at', NEW.trial_started_at,
        'trial_ended_at', NEW.trial_ended_at
      ),
      'info',
      'unresolved'
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;
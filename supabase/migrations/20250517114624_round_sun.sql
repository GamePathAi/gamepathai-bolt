/*
  # Fix RLS Policy Syntax for INSERT Operations

  1. Changes
     - Correct the syntax for INSERT policies by removing USING clause
     - Keep only WITH CHECK expressions for INSERT policies
     - Maintain all other policies as they were
  2. Security
     - Maintain same security model with proper RLS syntax
     - Ensure all functions use security definer
*/

-- Enable pgcrypto extension
create extension if not exists "pgcrypto";

-- Update policies to use auth.uid()
-- For users table
drop policy if exists "Users can insert their own data" on users;
create policy "Users can insert their own data" 
on users 
for insert
with check (auth.uid() = id);

alter policy "Users can read own data" 
on users 
using (auth.uid() = id);

alter policy "Users can update own data" 
on users 
using (auth.uid() = id)
with check (auth.uid() = id);

-- For game_metrics table
drop policy if exists "Users can insert own metrics" on game_metrics;
create policy "Users can insert own metrics" 
on game_metrics 
for insert
with check (auth.uid() = user_id);

alter policy "Users can read own metrics" 
on game_metrics 
using (auth.uid() = user_id);

-- For network_metrics table
drop policy if exists "Users can insert their own network metrics" on network_metrics;
create policy "Users can insert their own network metrics" 
on network_metrics 
for insert
with check (auth.uid() = user_id);

alter policy "Users can read their own network metrics" 
on network_metrics 
using (auth.uid() = user_id);

-- For system_metrics table
drop policy if exists "Users can insert their own system metrics" on system_metrics;
create policy "Users can insert their own system metrics" 
on system_metrics 
for insert
with check (auth.uid() = user_id);

alter policy "Users can read their own system metrics" 
on system_metrics 
using (auth.uid() = user_id);

-- For feature_feedback table
drop policy if exists "Users can insert their own feedback" on feature_feedback;
create policy "Users can insert their own feedback" 
on feature_feedback 
for insert
with check (auth.uid() = user_id);

alter policy "Users can read their own feedback" 
on feature_feedback 
using (auth.uid() = user_id);

-- For stripe tables
alter policy "Users can view their own customer data" 
on stripe_customers 
using ((user_id = auth.uid()) and (deleted_at is null));

alter policy "Users can view their own subscription data" 
on stripe_subscriptions 
using ((customer_id in (
  select customer_id 
  from stripe_customers 
  where (user_id = auth.uid()) and (deleted_at is null)
)) and (deleted_at is null));

alter policy "Users can view their own order data" 
on stripe_orders 
using ((customer_id in (
  select customer_id 
  from stripe_customers 
  where (user_id = auth.uid()) and (deleted_at is null)
)) and (deleted_at is null));

-- Update security audit logging
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

-- Add trial management functions
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
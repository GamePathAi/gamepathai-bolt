/*
  # Fix policy syntax for INSERT operations

  1. Changes
    - Remove USING clause from INSERT policies (only WITH CHECK is allowed for INSERT)
    - Keep all other policies unchanged
    - Retain all function definitions
  
  2. Security
    - All RLS policies are properly configured
    - Security audit logging functions remain unchanged
    - Trial management functions remain unchanged
*/

-- Enable pgcrypto extension
create extension if not exists "pgcrypto";

-- Update policies to use auth.uid()
alter policy "Users can insert their own data" 
on users 
with check (auth.uid() = id);

alter policy "Users can read own data" 
on users 
using (auth.uid() = id);

alter policy "Users can update own data" 
on users 
using (auth.uid() = id)
with check (auth.uid() = id);

alter policy "Users can insert own metrics" 
on game_metrics 
with check (auth.uid() = user_id);

alter policy "Users can read own metrics" 
on game_metrics 
using (auth.uid() = user_id);

alter policy "Users can insert their own network metrics" 
on network_metrics 
with check (auth.uid() = user_id);

alter policy "Users can read their own network metrics" 
on network_metrics 
using (auth.uid() = user_id);

alter policy "Users can insert their own system metrics" 
on system_metrics 
with check (auth.uid() = user_id);

alter policy "Users can read their own system metrics" 
on system_metrics 
using (auth.uid() = user_id);

alter policy "Users can insert their own feedback" 
on feature_feedback 
with check (auth.uid() = user_id);

alter policy "Users can read their own feedback" 
on feature_feedback 
using (auth.uid() = user_id);

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
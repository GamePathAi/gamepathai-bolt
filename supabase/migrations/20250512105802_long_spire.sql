/*
  # Add trial management fields to user_profiles

  1. Changes
    - Add trial-related columns to user_profiles table
    - Add function to check trial status
    - Add trigger for trial status updates

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add trial-related columns to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_end_date timestamptz,
ADD COLUMN IF NOT EXISTS trial_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS conversion_date timestamptz,
ADD COLUMN IF NOT EXISTS pricing_plan text,
ADD COLUMN IF NOT EXISTS payment_method jsonb,
ADD COLUMN IF NOT EXISTS subscription_status text,
ADD COLUMN IF NOT EXISTS trial_extensions jsonb DEFAULT '[]',
CONSTRAINT valid_trial_status CHECK (trial_status IN ('active', 'expired', 'converted'));

-- Create function to check trial status
CREATE OR REPLACE FUNCTION check_trial_status()
RETURNS trigger AS $$
BEGIN
  -- Set trial_end_date to 3 days after trial_started_at if not set
  IF NEW.trial_end_date IS NULL THEN
    NEW.trial_end_date := NEW.trial_started_at + interval '3 days';
  END IF;
  
  -- Check if trial has expired
  IF NEW.trial_end_date < now() AND NEW.trial_status = 'active' AND NEW.subscription_status != 'active' THEN
    NEW.trial_status := 'expired';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trial status check
CREATE TRIGGER check_trial_status_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_trial_status();

-- Create function to send trial expiration notifications
CREATE OR REPLACE FUNCTION notify_trial_expiration()
RETURNS trigger AS $$
BEGIN
  -- If trial is about to expire (within 24 hours) and no notification has been sent
  IF NEW.trial_end_date < now() + interval '24 hours' 
     AND NEW.trial_status = 'active'
     AND (OLD.trial_status IS NULL OR OLD.trial_status = 'active')
     AND NOT EXISTS (
       SELECT 1 FROM security_logs 
       WHERE user_id = NEW.user_id 
       AND event_type = 'trial_expiration_notification'
       AND created_at > now() - interval '24 hours'
     ) THEN
    
    -- Insert notification record in security_logs
    INSERT INTO security_logs (
      user_id, 
      event_type, 
      event_data,
      severity,
      status
    ) VALUES (
      NEW.user_id,
      'trial_expiration_notification',
      jsonb_build_object(
        'trial_end_date', NEW.trial_end_date,
        'notification_time', now()
      ),
      'info',
      'unresolved'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trial expiration notifications
CREATE TRIGGER notify_trial_expiration_trigger
  AFTER UPDATE OF trial_status, trial_end_date ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_trial_expiration();
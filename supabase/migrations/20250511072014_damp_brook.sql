-- Add trial-related columns to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_ended_at timestamptz,
ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false;

-- Function to check trial status
CREATE OR REPLACE FUNCTION check_trial_status()
RETURNS trigger AS $$
BEGIN
  -- Set trial_ended_at to 3 days after trial_started_at if not set
  IF NEW.trial_ended_at IS NULL THEN
    NEW.trial_ended_at := NEW.trial_started_at + interval '3 days';
  END IF;
  
  -- Check if trial has expired
  IF NEW.trial_ended_at < now() AND NOT NEW.is_pro THEN
    -- Trial expired, restrict access
    NEW.access_level := 'restricted';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trial status check
CREATE TRIGGER check_trial_status_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_trial_status();

-- Update existing profiles to have trial dates
UPDATE user_profiles
SET 
  trial_started_at = created_at,
  trial_ended_at = created_at + interval '3 days'
WHERE trial_started_at IS NULL;
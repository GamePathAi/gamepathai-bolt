/*
  # Enhance download_events table

  1. Changes
    - Add additional columns to download_events table
    - Add user_id reference to auth.users
    - Add device_type, installation_status, referral_source, campaign_id
    - Add additional indexes

  2. Security
    - Update RLS policies
*/

-- Enhance download_events table
ALTER TABLE download_events
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS device_type text,
ADD COLUMN IF NOT EXISTS installation_status text DEFAULT 'initiated',
ADD COLUMN IF NOT EXISTS referral_source text,
ADD COLUMN IF NOT EXISTS campaign_id text,
ADD COLUMN IF NOT EXISTS app_version text,
ADD CONSTRAINT valid_installation_status CHECK (installation_status IN ('initiated', 'completed', 'failed', 'cancelled'));

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_download_events_platform ON download_events(platform);
CREATE INDEX IF NOT EXISTS idx_download_events_user_id ON download_events(user_id);
CREATE INDEX IF NOT EXISTS idx_download_events_referral_source ON download_events(referral_source);
CREATE INDEX IF NOT EXISTS idx_download_events_campaign_id ON download_events(campaign_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Allow download event creation" ON download_events;

CREATE POLICY "Allow download event creation"
  ON download_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to view their own download events"
  ON download_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Create function to update installation status
CREATE OR REPLACE FUNCTION update_installation_status()
RETURNS trigger AS $$
BEGIN
  -- Update user profile with installation information
  IF NEW.installation_status = 'completed' AND NEW.user_id IS NOT NULL THEN
    UPDATE user_profiles
    SET 
      last_login = now(),
      login_count = login_count + 1
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for installation status updates
CREATE TRIGGER update_installation_status_trigger
  AFTER UPDATE OF installation_status ON download_events
  FOR EACH ROW
  EXECUTE FUNCTION update_installation_status();
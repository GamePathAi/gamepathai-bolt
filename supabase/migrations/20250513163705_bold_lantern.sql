/*
  # Download Events Schema Update

  1. New Tables
    - `download_events`
      - `id` (uuid, primary key)
      - `platform` (text)
      - `version` (text)
      - `timestamp` (timestamptz)
      - `user_agent` (text)
      - `direct` (boolean)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references users)
      - `device_type` (text)
      - `installation_status` (text)
      - `referral_source` (text)
      - `campaign_id` (text)
      - `app_version` (text)

  2. Security
    - Enable RLS on `download_events` table
    - Add policies for anonymous and authenticated users
    - Add installation status validation

  3. Performance
    - Add indexes for common query patterns
    - Add trigger for status change auditing
*/

-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS update_installation_status_trigger ON download_events;
DROP FUNCTION IF EXISTS update_installation_status();
DROP TABLE IF EXISTS download_events;

-- Create download events table
CREATE TABLE download_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  version text NOT NULL,
  "timestamp" timestamptz NOT NULL,
  user_agent text,
  direct boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES users(id),
  device_type text,
  installation_status text DEFAULT 'initiated',
  referral_source text,
  campaign_id text,
  app_version text,
  CONSTRAINT valid_installation_status CHECK (installation_status IN ('initiated', 'completed', 'failed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE download_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow download event creation"
  ON download_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to view their own download events"
  ON download_events
  FOR SELECT
  TO authenticated
  USING ((user_id = auth.uid()) OR (user_id IS NULL));

-- Create indexes for analytics
CREATE INDEX idx_download_events_timestamp ON download_events("timestamp");
CREATE INDEX idx_download_events_platform ON download_events(platform);
CREATE INDEX idx_download_events_user_id ON download_events(user_id);
CREATE INDEX idx_download_events_referral_source ON download_events(referral_source);
CREATE INDEX idx_download_events_campaign_id ON download_events(campaign_id);

-- Create function to handle installation status updates
CREATE FUNCTION update_installation_status()
RETURNS trigger AS $$
BEGIN
  -- Log status change in security audit
  INSERT INTO security_audit_logs (
    user_id,
    event_type,
    event_data,
    severity,
    status
  ) VALUES (
    NEW.user_id,
    'installation_status_change',
    jsonb_build_object(
      'download_id', NEW.id,
      'old_status', OLD.installation_status,
      'new_status', NEW.installation_status,
      'platform', NEW.platform,
      'version', NEW.version
    ),
    'info',
    'unresolved'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for installation status updates
CREATE TRIGGER update_installation_status_trigger
  AFTER UPDATE OF installation_status ON download_events
  FOR EACH ROW
  EXECUTE FUNCTION update_installation_status();
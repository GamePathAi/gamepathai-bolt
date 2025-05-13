/*
  # Add download tracking tables

  1. New Tables
    - `download_events`
      - Tracks all download attempts and installations
      - Records user info, platform, version, and status
      - Includes analytics data like referral source

  2. Security
    - Enable RLS on new tables
    - Allow anonymous downloads but track them
    - Authenticated users can view their own downloads

  3. Changes
    - Add download tracking table
    - Add RLS policies
    - Add installation status check constraint
*/

-- Create download events table
CREATE TABLE IF NOT EXISTS download_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  version text NOT NULL,
  timestamp timestamptz NOT NULL,
  user_agent text,
  direct boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES users(id),
  device_type text,
  installation_status text DEFAULT 'initiated',
  referral_source text,
  campaign_id text,
  app_version text
);

-- Add installation status constraint
ALTER TABLE download_events
ADD CONSTRAINT valid_installation_status
CHECK (installation_status IN ('initiated', 'completed', 'failed', 'cancelled'));

-- Enable RLS
ALTER TABLE download_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous downloads but track them
CREATE POLICY "Allow download event creation"
  ON download_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own download events
CREATE POLICY "Allow users to view their own download events"
  ON download_events
  FOR SELECT
  TO authenticated
  USING ((user_id = auth.uid()) OR (user_id IS NULL));

-- Create indexes for analytics
CREATE INDEX idx_download_events_timestamp ON download_events(timestamp);
CREATE INDEX idx_download_events_platform ON download_events(platform);
CREATE INDEX idx_download_events_user_id ON download_events(user_id);
CREATE INDEX idx_download_events_referral_source ON download_events(referral_source);
CREATE INDEX idx_download_events_campaign_id ON download_events(campaign_id);

-- Create function to handle installation status updates
CREATE OR REPLACE FUNCTION update_installation_status()
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
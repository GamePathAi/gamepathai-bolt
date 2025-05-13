/*
  # Download Events Schema Update

  1. New Tables
    - `download_events`
      - `id` (uuid, primary key)
      - `platform` (text)
      - `version` (text)
      - `timestamp` (timestamptz)
      - `user_agent` (text, nullable)
      - `direct` (boolean)
      - `created_at` (timestamptz)
      - `user_id` (uuid, nullable)
      - `device_type` (text, nullable)
      - `installation_status` (text)
      - `referral_source` (text, nullable)
      - `campaign_id` (text, nullable)
      - `app_version` (text, nullable)

  2. Security
    - Enable RLS on `download_events` table
    - Add policies for download event creation and viewing
    - Add indexes for performance optimization

  3. Changes
    - Added additional fields for tracking and analytics
    - Added installation status tracking
    - Added user association capability
*/

-- Create download_events table with expanded fields
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

-- Enable RLS
ALTER TABLE download_events ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_download_events_timestamp 
  ON download_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_download_events_user_id 
  ON download_events(user_id);

CREATE INDEX IF NOT EXISTS idx_download_events_platform 
  ON download_events(platform);

CREATE INDEX IF NOT EXISTS idx_download_events_referral_source 
  ON download_events(referral_source);

CREATE INDEX IF NOT EXISTS idx_download_events_campaign_id 
  ON download_events(campaign_id);

-- Add constraint for installation status values
ALTER TABLE download_events
  ADD CONSTRAINT valid_installation_status
  CHECK (installation_status = ANY(ARRAY['initiated', 'completed', 'failed', 'cancelled']));

-- Create policies for access control
DO $$ BEGIN
  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Allow download event creation" ON download_events;
  DROP POLICY IF EXISTS "Allow users to view their own download events" ON download_events;
END $$;

-- Recreate policies
CREATE POLICY "Allow download event creation"
  ON download_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to view their own download events"
  ON download_events
  FOR SELECT
  TO authenticated
  USING ((user_id = uid()) OR (user_id IS NULL));

-- Create trigger function for installation status updates
CREATE OR REPLACE FUNCTION update_installation_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.installation_status != OLD.installation_status THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_installation_status_trigger
  AFTER UPDATE OF installation_status
  ON download_events
  FOR EACH ROW
  EXECUTE FUNCTION update_installation_status();
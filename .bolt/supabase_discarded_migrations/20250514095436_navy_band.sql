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
    - Add constraint for valid installation status values

  3. Performance
    - Add indexes for common query patterns
*/

-- Create download_events table with all columns
CREATE TABLE IF NOT EXISTS download_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  version text NOT NULL,
  timestamp timestamptz NOT NULL,
  user_agent text,
  direct boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  device_type text,
  installation_status text DEFAULT 'initiated',
  referral_source text,
  campaign_id text,
  app_version text,
  CONSTRAINT valid_installation_status CHECK (installation_status IN ('initiated', 'completed', 'failed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE download_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow download event creation" ON public.download_events;
DROP POLICY IF EXISTS "Allow users to view their own download events" ON public.download_events;

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

-- Create trigger for installation status updates
CREATE OR REPLACE FUNCTION update_installation_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.installation_status != OLD.installation_status THEN
    -- Here you could add additional logic like notifications or metrics
    -- For now we just ensure the timestamp is updated
    NEW.timestamp = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_installation_status_trigger
  AFTER UPDATE OF installation_status
  ON download_events
  FOR EACH ROW
  EXECUTE FUNCTION update_installation_status();
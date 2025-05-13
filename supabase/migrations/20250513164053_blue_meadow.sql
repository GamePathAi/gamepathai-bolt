/*
  # Enhanced Download Events Schema

  1. Changes
    - Adds new columns to download_events table if they don't exist
    - Creates indexes for performance optimization
    - Sets up RLS policies
    - Adds installation status tracking

  2. New Fields
    - user_id: Links downloads to authenticated users
    - device_type: Tracks device information
    - installation_status: Monitors installation progress
    - referral_source: Tracks traffic sources
    - campaign_id: For marketing campaign tracking
    - app_version: Tracks specific app version downloads

  3. Security
    - Maintains RLS
    - Updates access policies
    - Ensures data integrity with constraints
*/

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'download_events' AND column_name = 'user_id') THEN
    ALTER TABLE download_events ADD COLUMN user_id uuid REFERENCES users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'download_events' AND column_name = 'device_type') THEN
    ALTER TABLE download_events ADD COLUMN device_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'download_events' AND column_name = 'installation_status') THEN
    ALTER TABLE download_events ADD COLUMN installation_status text DEFAULT 'initiated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'download_events' AND column_name = 'referral_source') THEN
    ALTER TABLE download_events ADD COLUMN referral_source text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'download_events' AND column_name = 'campaign_id') THEN
    ALTER TABLE download_events ADD COLUMN campaign_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'download_events' AND column_name = 'app_version') THEN
    ALTER TABLE download_events ADD COLUMN app_version text;
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_download_events_user_id') THEN
    CREATE INDEX idx_download_events_user_id ON download_events(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_download_events_platform') THEN
    CREATE INDEX idx_download_events_platform ON download_events(platform);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_download_events_referral_source') THEN
    CREATE INDEX idx_download_events_referral_source ON download_events(referral_source);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_download_events_campaign_id') THEN
    CREATE INDEX idx_download_events_campaign_id ON download_events(campaign_id);
  END IF;
END $$;

-- Drop and recreate policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow download event creation" ON download_events;
  DROP POLICY IF EXISTS "Allow users to view their own download events" ON download_events;
END $$;

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

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_installation_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.installation_status != OLD.installation_status THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_installation_status_trigger ON download_events;
CREATE TRIGGER update_installation_status_trigger
  AFTER UPDATE OF installation_status
  ON download_events
  FOR EACH ROW
  EXECUTE FUNCTION update_installation_status();

-- Add installation status constraint if it doesn't exist
DO $$ 
BEGIN
  ALTER TABLE download_events
    DROP CONSTRAINT IF EXISTS valid_installation_status;
    
  ALTER TABLE download_events
    ADD CONSTRAINT valid_installation_status
    CHECK (installation_status = ANY(ARRAY['initiated', 'completed', 'failed', 'cancelled']));
EXCEPTION
  WHEN others THEN
    NULL;
END $$;
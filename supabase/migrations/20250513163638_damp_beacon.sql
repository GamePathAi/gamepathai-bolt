/*
  # Enhance download events tracking

  1. Changes
    - Add user tracking and device information
    - Add installation status tracking
    - Add referral and campaign tracking
    - Add indexes for analytics queries

  2. Security
    - Add RLS policies for user data access
    - Add installation status validation
    - Add audit logging for status changes
*/

-- Add new columns if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'download_events' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE download_events 
      ADD COLUMN user_id uuid REFERENCES users(id),
      ADD COLUMN device_type text,
      ADD COLUMN installation_status text DEFAULT 'initiated',
      ADD COLUMN referral_source text,
      ADD COLUMN campaign_id text,
      ADD COLUMN app_version text;
  END IF;
END $$;

-- Add installation status constraint if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_installation_status'
  ) THEN
    ALTER TABLE download_events
    ADD CONSTRAINT valid_installation_status
    CHECK (installation_status IN ('initiated', 'completed', 'failed', 'cancelled'));
  END IF;
END $$;

-- Create indexes for analytics if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_download_events_platform') THEN
    CREATE INDEX idx_download_events_platform ON download_events(platform);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_download_events_user_id') THEN
    CREATE INDEX idx_download_events_user_id ON download_events(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_download_events_referral_source') THEN
    CREATE INDEX idx_download_events_referral_source ON download_events(referral_source);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_download_events_campaign_id') THEN
    CREATE INDEX idx_download_events_campaign_id ON download_events(campaign_id);
  END IF;
END $$;

-- Create or replace function to handle installation status updates
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

-- Drop and recreate trigger to ensure it's up to date
DROP TRIGGER IF EXISTS update_installation_status_trigger ON download_events;
CREATE TRIGGER update_installation_status_trigger
  AFTER UPDATE OF installation_status ON download_events
  FOR EACH ROW
  EXECUTE FUNCTION update_installation_status();

-- Drop and recreate policies to ensure they're up to date
DROP POLICY IF EXISTS "Allow users to view their own download events" ON download_events;
CREATE POLICY "Allow users to view their own download events"
  ON download_events
  FOR SELECT
  TO authenticated
  USING ((user_id = auth.uid()) OR (user_id IS NULL));
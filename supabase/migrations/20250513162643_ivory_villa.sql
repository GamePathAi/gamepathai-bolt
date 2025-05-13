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
      - `user_id` (uuid, nullable)
      - `device_type` (text)
      - `installation_status` (text)
      - `referral_source` (text)
      - `campaign_id` (text)
      - `app_version` (text)

  2. Security
    - Enable RLS on `download_events` table
    - Add policies for download event creation and viewing
    - Add foreign key constraint to users table

  3. Performance
    - Add indexes for common query patterns
*/

-- Create download_events table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'download_events') THEN
    CREATE TABLE download_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      platform text NOT NULL,
      version text NOT NULL,
      timestamp timestamptz NOT NULL,
      user_agent text,
      direct boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      user_id uuid REFERENCES auth.users(id),
      device_type text,
      installation_status text DEFAULT 'initiated'::text,
      referral_source text,
      campaign_id text,
      app_version text
    );

    -- Enable RLS
    ALTER TABLE download_events ENABLE ROW LEVEL SECURITY;

    -- Create indexes for better query performance
    CREATE INDEX idx_download_events_timestamp ON download_events(timestamp);
    CREATE INDEX idx_download_events_platform ON download_events(platform);
    CREATE INDEX idx_download_events_user_id ON download_events(user_id);
    CREATE INDEX idx_download_events_referral_source ON download_events(referral_source);
    CREATE INDEX idx_download_events_campaign_id ON download_events(campaign_id);

    -- Add constraint for installation status
    ALTER TABLE download_events 
      ADD CONSTRAINT valid_installation_status 
      CHECK (installation_status = ANY (ARRAY['initiated'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]));

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
      USING ((user_id = uid()) OR (user_id IS NULL));
  END IF;
END $$;
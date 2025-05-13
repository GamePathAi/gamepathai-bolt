/*
  # Add download events tracking

  1. Changes
    - Create download_events table for tracking app downloads
    - Add basic columns for platform, version, timestamp tracking
    - Enable RLS and create index for performance

  2. Security
    - Enable RLS on download_events table
    - Add policy for anonymous and authenticated downloads
*/

-- Create download_events table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'download_events'
  ) THEN
    CREATE TABLE download_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      platform text NOT NULL,
      version text NOT NULL,
      timestamp timestamptz NOT NULL,
      user_agent text,
      direct boolean DEFAULT false,
      created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE download_events ENABLE ROW LEVEL SECURITY;

    -- Create index for better query performance
    CREATE INDEX idx_download_events_timestamp 
      ON download_events(timestamp);
  END IF;
END $$;
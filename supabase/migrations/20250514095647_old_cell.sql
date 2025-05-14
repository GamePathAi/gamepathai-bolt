/*
  # Download Events Base Schema
  
  1. Changes
    - Create initial download_events table
    - Enable RLS
    - Add base policy for event creation
  
  2. Security
    - Enable RLS
    - Allow both anonymous and authenticated users to create download events
  
  3. Performance
    - Add timestamp index for analytics queries
*/

-- Create download_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS download_events (
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

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow download event creation" ON download_events;

-- Create policy for download event creation
CREATE POLICY "Allow download event creation"
  ON download_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create index for better query performance
DROP INDEX IF EXISTS idx_download_events_timestamp;
CREATE INDEX idx_download_events_timestamp ON download_events(timestamp);
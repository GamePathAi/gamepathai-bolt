/*
  # Create download_events table

  1. New Table
    - `download_events`
      - `id` (uuid, primary key)
      - `platform` (text)
      - `version` (text)
      - `timestamp` (timestamptz)
      - `user_agent` (text)
      - `direct` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated and anonymous users
*/

-- Create download_events table
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

-- Create policies
CREATE POLICY "Allow download event creation"
  ON download_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_download_events_timestamp 
  ON download_events(timestamp);
/*
  # Create system metrics tables

  1. New Tables
    - `system_metrics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `cpu_metrics` (jsonb)
      - `memory_metrics` (jsonb)
      - `gpu_metrics` (jsonb)
      - `network_metrics` (jsonb)
      - `timestamp` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `system_metrics` table
    - Add policies for authenticated users to manage their own metrics
*/

-- Create system_metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  cpu_metrics JSONB NOT NULL,
  memory_metrics JSONB NOT NULL,
  gpu_metrics JSONB NOT NULL,
  network_metrics JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_metrics_user_id ON system_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);

-- Enable RLS
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own metrics"
  ON system_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own metrics"
  ON system_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
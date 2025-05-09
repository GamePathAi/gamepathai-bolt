/*
  # Network Optimization Tables

  1. New Tables
    - network_metrics: Stores network performance metrics
    - network_routes: Stores available network routes
    - route_performance: Stores historical route performance data

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Create network_metrics table
CREATE TABLE IF NOT EXISTS network_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  latency FLOAT NOT NULL,
  jitter FLOAT NOT NULL,
  packet_loss FLOAT NOT NULL,
  bandwidth FLOAT NOT NULL,
  route_hops JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create network_routes table
CREATE TABLE IF NOT EXISTS network_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nodes JSONB NOT NULL,
  latency FLOAT NOT NULL,
  bandwidth FLOAT NOT NULL,
  load FLOAT NOT NULL,
  reliability FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create route_performance table
CREATE TABLE IF NOT EXISTS route_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES network_routes NOT NULL,
  latency FLOAT NOT NULL,
  bandwidth FLOAT NOT NULL,
  reliability FLOAT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_network_metrics_user_id ON network_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_network_metrics_timestamp ON network_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_route_performance_route_id ON route_performance(route_id);
CREATE INDEX IF NOT EXISTS idx_route_performance_timestamp ON route_performance(timestamp);

-- Enable RLS
ALTER TABLE network_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_performance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own metrics"
  ON network_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own metrics"
  ON network_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated read access to routes"
  ON network_routes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to route performance"
  ON route_performance
  FOR SELECT
  TO authenticated
  USING (true);
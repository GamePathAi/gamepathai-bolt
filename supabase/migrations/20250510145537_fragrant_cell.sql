/*
  # Add unique constraint to games table

  1. Changes
    - Add unique constraint on name and platform columns
    - This enables upsert operations using ON CONFLICT (name, platform)

  2. Security
    - Maintains existing RLS policies
    - No security impact
*/

-- Add unique constraint for name and platform
ALTER TABLE games 
ADD CONSTRAINT games_name_platform_key UNIQUE (name, platform);
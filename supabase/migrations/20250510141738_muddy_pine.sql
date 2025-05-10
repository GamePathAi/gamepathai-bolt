/*
  # Add icon_url column to games table

  1. Changes
    - Add icon_url column to games table
    - Make it nullable since not all games will have icons initially
*/

-- Add icon_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'games' 
    AND column_name = 'icon_url'
  ) THEN
    ALTER TABLE games ADD COLUMN icon_url text;
  END IF;
END $$;
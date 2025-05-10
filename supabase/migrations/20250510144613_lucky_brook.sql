/*
  # Add optimized column to games table

  1. Changes
    - Add `optimized` boolean column to games table if it doesn't exist
    - Set default value to false
    - Make column nullable
  
  2. Safety
    - Check if column exists before adding
    - Use DO block for conditional execution
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'games' 
    AND column_name = 'optimized'
  ) THEN
    ALTER TABLE games ADD COLUMN optimized boolean DEFAULT false;
  END IF;
END $$;
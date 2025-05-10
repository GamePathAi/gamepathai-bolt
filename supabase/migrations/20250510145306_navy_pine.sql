/*
  # Add size column to games table

  1. Changes
    - Add `size` column to games table as BIGINT
    - Use safe migration pattern with existence check
    - Column is nullable since not all games may have size info

  2. Security
    - No security changes needed
    - Existing RLS policies will cover the new column
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'games' 
    AND column_name = 'size'
  ) THEN
    ALTER TABLE games ADD COLUMN size bigint;
  END IF;
END $$;
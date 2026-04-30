-- Add giornata_name column to tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS giornata_name VARCHAR(255);

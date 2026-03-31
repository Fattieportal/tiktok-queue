-- Add language column to shops table
-- Supported languages: 'nl' (Nederlands), 'de' (Duits)
-- Default: 'nl'

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'nl' CHECK (language IN ('nl', 'de'));

-- Add comment to explain the column
COMMENT ON COLUMN shops.language IS 'Interface language for overlays and widgets (nl=Nederlands, de=Deutsch)';

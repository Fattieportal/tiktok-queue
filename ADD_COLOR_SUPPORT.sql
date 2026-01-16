-- Voeg kleur ondersteuning toe aan shops
-- Run deze query in Supabase SQL Editor

-- Voeg kleur ondersteuning toe aan shops tabel
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#FFD400',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT 'rgba(0, 0, 0, 0.6)',
ADD COLUMN IF NOT EXISTS show_name_background BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_more_background BOOLEAN DEFAULT true;

-- Update bestaande shops met standaard kleuren (geel/zwart)
UPDATE shops 
SET 
  primary_color = '#FFD400',
  text_color = '#000000',
  background_color = 'rgba(0, 0, 0, 0.6)',
  show_name_background = true,
  show_more_background = true
WHERE primary_color IS NULL;

-- Opmerking: 
-- primary_color = Kleur van de naam text (standaard geel #FFD400)
-- text_color = Kleur van "En nog X meer" text (standaard zwart #000000)
-- background_color = Achtergrond kleur van de namen (standaard semi-transparent zwart)
-- show_name_background = Toon achtergrond bij namen (standaard true)
-- show_more_background = Toon achtergrond bij "En nog X meer" (standaard true)

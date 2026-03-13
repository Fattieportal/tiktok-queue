-- Multi-Shop Support Migration
-- Run deze queries in Supabase SQL Editor

-- 1. Maak shops table aan
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  shopify_shop_domain TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Voeg shop_id toe aan queue_entries
ALTER TABLE queue_entries 
ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;

-- 3. Voeg shop_id toe aan queue_actions
ALTER TABLE queue_actions 
ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;

-- 4. Maak indexes voor betere performance
CREATE INDEX IF NOT EXISTS idx_queue_entries_shop_id ON queue_entries(shop_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_shop_status ON queue_entries(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_actions_shop_id ON queue_actions(shop_id);

-- 5. Insert een standaard shop (voor bestaande data)
INSERT INTO shops (name, display_name, shopify_shop_domain, is_active)
VALUES ('default', 'Standaard Shop', NULL, true)
ON CONFLICT (name) DO NOTHING;

-- 6. Update bestaande queue_entries om te linken aan default shop
UPDATE queue_entries 
SET shop_id = (SELECT id FROM shops WHERE name = 'default' LIMIT 1)
WHERE shop_id IS NULL;

-- 7. Update bestaande queue_actions om te linken aan default shop
UPDATE queue_actions 
SET shop_id = (SELECT id FROM shops WHERE name = 'default' LIMIT 1)
WHERE shop_id IS NULL;

-- 8. Maak shop_id NOT NULL (na data migratie)
ALTER TABLE queue_entries 
ALTER COLUMN shop_id SET NOT NULL;

ALTER TABLE queue_actions 
ALTER COLUMN shop_id SET NOT NULL;

-- 9. Verwijder oude constraint en voeg nieuwe toe met "removed" status
ALTER TABLE queue_entries DROP CONSTRAINT IF EXISTS queue_entries_status_check;
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_status_check 
CHECK (status IN ('waiting', 'active', 'done', 'skipped', 'cleared', 'undone', 'removed'));

-- Klaar! Je kunt nu multiple shops aanmaken.

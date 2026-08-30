-- Streamer Tracking Feature
-- Voeg streamer tracking toe aan het queue systeem

-- 1. Maak streamers tabel
CREATE TABLE IF NOT EXISTS streamers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false, -- Is deze streamer nu actief?
  checked_in_at TIMESTAMPTZ, -- Wanneer ingecheckt
  checked_out_at TIMESTAMPTZ, -- Wanneer uitgecheckt
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, shop_id)
);

-- 2. Voeg streamer_id toe aan queue_entries
ALTER TABLE queue_entries 
ADD COLUMN IF NOT EXISTS streamer_id UUID REFERENCES streamers(id) ON DELETE SET NULL;

-- 3. Index voor snelle queries
CREATE INDEX IF NOT EXISTS idx_streamers_shop_active ON streamers(shop_id, is_active);
CREATE INDEX IF NOT EXISTS idx_queue_entries_streamer ON queue_entries(streamer_id);

-- 4. View voor statistieken per streamer
CREATE OR REPLACE VIEW streamer_stats AS
SELECT 
  s.id,
  s.name,
  s.shop_id,
  sh.name as shop_name,
  COUNT(q.id) as total_orders,
  COUNT(CASE WHEN q.status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN q.status = 'waiting' THEN 1 END) as waiting_orders,
  COUNT(CASE WHEN q.status = 'active' THEN 1 END) as active_orders,
  MIN(q.created_at) as first_order_at,
  MAX(q.created_at) as last_order_at,
  s.checked_in_at,
  s.checked_out_at,
  s.is_active
FROM streamers s
LEFT JOIN queue_entries q ON q.streamer_id = s.id
LEFT JOIN shops sh ON sh.id = s.shop_id
GROUP BY s.id, s.name, s.shop_id, sh.name, s.checked_in_at, s.checked_out_at, s.is_active;

-- 5. Enable RLS
ALTER TABLE streamers ENABLE ROW LEVEL SECURITY;

-- 6. Policies (alleen via service role toegankelijk)
CREATE POLICY "Enable read for service role" ON streamers FOR SELECT USING (true);
CREATE POLICY "Enable insert for service role" ON streamers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role" ON streamers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for service role" ON streamers FOR DELETE USING (true);

-- Voeg start en eind order tracking toe aan streamers
-- Dit zorgt ervoor dat we precies weten welke orders een streamer heeft gedaan

-- Voeg kolommen toe aan streamers tabel
ALTER TABLE streamers 
ADD COLUMN IF NOT EXISTS start_order_id INTEGER REFERENCES queue_entries(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS end_order_id INTEGER REFERENCES queue_entries(id) ON DELETE SET NULL;

-- Voeg session_id toe om check-in sessies te onderscheiden
ALTER TABLE streamers
ADD COLUMN IF NOT EXISTS session_count INTEGER DEFAULT 0;

-- Index voor snelle queries
CREATE INDEX IF NOT EXISTS idx_streamers_start_order ON streamers(start_order_id);
CREATE INDEX IF NOT EXISTS idx_streamers_end_order ON streamers(end_order_id);

-- Update view om start/end orders te tonen
DROP VIEW IF EXISTS streamer_stats;

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
  COUNT(CASE WHEN q.status = 'skipped' THEN 1 END) as skipped_orders,
  MIN(q.created_at) as first_order_at,
  MAX(q.created_at) as last_order_at,
  s.checked_in_at,
  s.checked_out_at,
  s.is_active,
  s.start_order_id,
  s.end_order_id,
  s.session_count,
  -- Start order info
  qstart.order_number as start_order_number,
  qstart.first_name as start_order_customer,
  -- End order info
  qend.order_number as end_order_number,
  qend.first_name as end_order_customer,
  -- Order details
  json_agg(
    json_build_object(
      'id', q.id,
      'order_number', q.order_number,
      'first_name', q.first_name,
      'product_info', q.product_info,
      'status', q.status,
      'created_at', q.created_at
    ) ORDER BY q.created_at DESC
  ) FILTER (WHERE q.id IS NOT NULL) as order_details
FROM streamers s
LEFT JOIN queue_entries q ON q.streamer_id = s.id
LEFT JOIN shops sh ON sh.id = s.shop_id
LEFT JOIN queue_entries qstart ON qstart.id = s.start_order_id
LEFT JOIN queue_entries qend ON qend.id = s.end_order_id
GROUP BY s.id, s.name, s.shop_id, sh.name, s.checked_in_at, s.checked_out_at, 
         s.is_active, s.start_order_id, s.end_order_id, s.session_count,
         qstart.order_number, qstart.first_name, qend.order_number, qend.first_name;

-- Maak een view voor sessie geschiedenis
CREATE OR REPLACE VIEW streamer_sessions AS
SELECT 
  s.id as streamer_id,
  s.name as streamer_name,
  s.shop_id,
  sh.name as shop_name,
  s.checked_in_at,
  s.checked_out_at,
  s.session_count,
  qstart.id as start_order_id,
  qstart.order_number as start_order_number,
  qstart.first_name as start_order_customer,
  qend.id as end_order_id,
  qend.order_number as end_order_number,
  qend.first_name as end_order_customer,
  COUNT(q.id) as orders_in_session
FROM streamers s
LEFT JOIN shops sh ON sh.id = s.shop_id
LEFT JOIN queue_entries qstart ON qstart.id = s.start_order_id
LEFT JOIN queue_entries qend ON qend.id = s.end_order_id
LEFT JOIN queue_entries q ON q.streamer_id = s.id 
  AND q.created_at >= COALESCE(s.checked_in_at, q.created_at)
  AND (s.checked_out_at IS NULL OR q.created_at <= s.checked_out_at)
GROUP BY s.id, s.name, s.shop_id, sh.name, s.checked_in_at, s.checked_out_at,
         s.session_count, qstart.id, qstart.order_number, qstart.first_name,
         qend.id, qend.order_number, qend.first_name
ORDER BY s.checked_in_at DESC;

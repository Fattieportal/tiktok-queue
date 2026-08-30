-- Streamer Tracking: Voeg order details toe aan statistieken
-- Deze update voegt meer gedetailleerde informatie toe aan de streamer stats view

-- Drop de oude view
DROP VIEW IF EXISTS streamer_stats;

-- Maak nieuwe view met order details
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
  -- Voeg order details toe (als JSON array voor eenvoudige verwerking)
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
GROUP BY s.id, s.name, s.shop_id, sh.name, s.checked_in_at, s.checked_out_at, s.is_active;

-- Maak een separate view voor order lijst per streamer (optioneel, voor gedetailleerde queries)
CREATE OR REPLACE VIEW streamer_order_details AS
SELECT 
  s.id as streamer_id,
  s.name as streamer_name,
  s.shop_id,
  sh.name as shop_name,
  q.id as order_id,
  q.order_number,
  q.first_name as customer_name,
  q.product_info,
  q.status,
  q.created_at as order_date,
  q.shopify_order_id
FROM streamers s
LEFT JOIN queue_entries q ON q.streamer_id = s.id
LEFT JOIN shops sh ON sh.id = s.shop_id
WHERE q.id IS NOT NULL
ORDER BY s.name, q.created_at DESC;

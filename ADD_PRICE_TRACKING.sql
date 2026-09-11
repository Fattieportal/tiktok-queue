-- Add price tracking to queue_entries and calculate totals

-- 1. Add total_price column to queue_entries
ALTER TABLE queue_entries 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);

-- 2. Add currency column (default EUR, but flexible for future)
ALTER TABLE queue_entries 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR';

-- 3. Update streamer_stats view to include price information
DROP VIEW IF EXISTS streamer_stats CASCADE;

CREATE VIEW streamer_stats AS
SELECT 
  s.id,
  s.name,
  s.shop_id,
  sh.name AS shop_name,
  COUNT(q.id) AS total_orders,
  COUNT(CASE WHEN q.status = 'completed' THEN 1 END) AS completed_orders,
  COUNT(CASE WHEN q.status = 'waiting' THEN 1 END) AS waiting_orders,
  COUNT(CASE WHEN q.status = 'active' THEN 1 END) AS active_orders,
  COUNT(CASE WHEN q.status = 'skipped' THEN 1 END) AS skipped_orders,
  MIN(q.created_at) AS first_order_at,
  MAX(q.created_at) AS last_order_at,
  s.checked_in_at,
  s.checked_out_at,
  s.is_active,
  s.start_order_id,
  s.end_order_id,
  s.session_count,
  -- Totale waarde van orders
  COALESCE(SUM(q.total_price), 0)::DECIMAL AS total_revenue,
  -- Gemiddelde orderwaarde
  COALESCE(ROUND(AVG(q.total_price)::NUMERIC, 2), 0)::DECIMAL AS average_order_value,
  -- JSON array met order details inclusief prijs
  json_agg(
    json_build_object(
      'id', q.id,
      'order_number', q.order_number,
      'first_name', q.first_name,
      'product_info', q.product_info,
      'status', q.status,
      'created_at', q.created_at,
      'total_price', COALESCE(q.total_price, 0),
      'currency', COALESCE(q.currency, 'EUR')
    )
    ORDER BY q.created_at DESC
  ) FILTER (WHERE q.id IS NOT NULL) AS order_details
FROM 
  streamers s
  LEFT JOIN shops sh ON sh.id = s.shop_id
  LEFT JOIN queue_entries q ON q.streamer_id = s.id
GROUP BY 
  s.id, s.name, s.shop_id, sh.name, 
  s.checked_in_at, s.checked_out_at, s.is_active,
  s.start_order_id, s.end_order_id, s.session_count;

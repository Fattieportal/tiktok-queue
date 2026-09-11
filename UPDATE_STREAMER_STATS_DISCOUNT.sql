-- UPDATE streamer_stats view to apply 9% discount for "shipped by seller" orders

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
  -- Totale waarde van orders (met 9% korting voor shipped by seller)
  COALESCE(SUM(
    CASE 
      WHEN q.product_info ILIKE '%shipped by seller%' THEN q.total_price * 0.91
      ELSE q.total_price
    END
  ), 0)::DECIMAL AS total_revenue,
  -- Gemiddelde orderwaarde (met 9% korting voor shipped by seller)
  COALESCE(ROUND(AVG(
    CASE 
      WHEN q.product_info ILIKE '%shipped by seller%' THEN q.total_price * 0.91
      ELSE q.total_price
    END
  )::NUMERIC, 2), 0)::DECIMAL AS average_order_value,
  -- JSON array met order details inclusief prijs (met korting toegepast)
  json_agg(
    json_build_object(
      'id', q.id,
      'order_number', q.order_number,
      'first_name', q.first_name,
      'product_info', q.product_info,
      'status', q.status,
      'created_at', q.created_at,
      'total_price', COALESCE(
        CASE 
          WHEN q.product_info ILIKE '%shipped by seller%' THEN ROUND((q.total_price * 0.91)::NUMERIC, 2)
          ELSE q.total_price
        END, 0),
      'currency', COALESCE(q.currency, 'EUR'),
      'is_shipped_by_seller', q.product_info ILIKE '%shipped by seller%'
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

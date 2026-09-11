-- REFRESH: Vernieuw alle streamer data en statistieken

-- 1. Geen refresh nodig voor views (ze zijn altijd live)
-- streamer_stats is een normale VIEW, geen MATERIALIZED VIEW
-- Dit betekent dat de data altijd automatisch up-to-date is

-- 2. Controleer alle orders en hun prijzen
SELECT 
  s.name,
  COUNT(q.id) as total_orders,
  SUM(CASE WHEN q.total_price IS NULL OR q.total_price = 0 THEN 1 ELSE 0 END) as orders_without_price,
  SUM(CASE WHEN q.total_price > 0 THEN 1 ELSE 0 END) as orders_with_price,
  COALESCE(SUM(q.total_price), 0) as total_revenue,
  COALESCE(ROUND(AVG(q.total_price)::NUMERIC, 2), 0) as average_price
FROM streamers s
LEFT JOIN queue_entries q ON q.streamer_id = s.id
GROUP BY s.name
ORDER BY s.name;

-- 3. Toon details van alle orders per streamer
SELECT 
  s.name as streamer,
  q.id,
  q.order_number,
  q.first_name,
  q.total_price,
  q.currency,
  q.status,
  q.created_at
FROM streamers s
LEFT JOIN queue_entries q ON q.streamer_id = s.id
WHERE s.name = 'Jop'
ORDER BY q.created_at DESC;

-- 4. Summary stats
SELECT 
  COUNT(*) as total_streamers,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_streamers,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_streamers
FROM streamers;

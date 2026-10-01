-- Check Patricia's order details
SELECT 
  id,
  order_number,
  first_name,
  total_price,
  currency,
  is_shipped_by_seller,
  product_info,
  streamer_id,
  created_at
FROM queue_entries
WHERE first_name ILIKE '%patricia%'
  OR order_number = '12242'
ORDER BY created_at DESC;

-- Also check all orders for Jop with shipped by seller
SELECT 
  id,
  order_number,
  first_name,
  total_price,
  currency,
  is_shipped_by_seller,
  product_info,
  created_at
FROM queue_entries
WHERE is_shipped_by_seller = TRUE
ORDER BY created_at DESC
LIMIT 10;

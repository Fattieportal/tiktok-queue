-- FIX: Add default prices to all orders that are missing prices
-- This ensures that orders that came through before we added price tracking get a default price

UPDATE queue_entries
SET 
  total_price = COALESCE(total_price, 0),
  currency = COALESCE(currency, 'EUR')
WHERE total_price IS NULL OR currency IS NULL;

-- Verify the fix
SELECT id, order_number, first_name, total_price, currency, streamer_id
FROM queue_entries
WHERE total_price = 0
ORDER BY created_at DESC
LIMIT 20;

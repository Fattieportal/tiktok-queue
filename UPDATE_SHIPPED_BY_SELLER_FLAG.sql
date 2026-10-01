-- Update existing "Shipped by Seller" orders to set the flag
UPDATE queue_entries
SET is_shipped_by_seller = TRUE
WHERE product_info ILIKE '%shipped by seller%'
  AND is_shipped_by_seller = FALSE;

-- Verify the update
SELECT COUNT(*) as updated_count FROM queue_entries WHERE is_shipped_by_seller = TRUE;

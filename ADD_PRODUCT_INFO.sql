-- Voeg product informatie ondersteuning toe aan queue_entries
-- Run deze query in Supabase SQL Editor

-- Voeg product_info kolom toe voor opslag van product details
ALTER TABLE queue_entries 
ADD COLUMN IF NOT EXISTS product_info TEXT;

-- Opmerking: 
-- product_info = Geformatteerde product informatie uit Shopify order
-- Formaat: "1x Standaard (1 kg)" of "2x Mystery Box + 1x T-Shirt"
-- Wordt automatisch gevuld door de webhook bij nieuwe orders

-- Optioneel: Update bestaande entries met placeholder
UPDATE queue_entries 
SET product_info = 'Product info niet beschikbaar'
WHERE product_info IS NULL AND shopify_order_id IS NOT NULL;

-- Voor manueel toegevoegde entries (order_number = 'MANUAL') laten we NULL

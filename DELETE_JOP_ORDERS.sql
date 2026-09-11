-- DELETE: Verwijder alle orders van Jop uit de database

-- STAP 1: Controleer hoeveel orders we gaan verwijderen
SELECT COUNT(*) as orders_to_delete
FROM queue_entries
WHERE streamer_id = (SELECT id FROM streamers WHERE name = 'Jop' LIMIT 1);

-- STAP 2: Verwijder alle orders van Jop
DELETE FROM queue_entries
WHERE streamer_id = (SELECT id FROM streamers WHERE name = 'Jop' LIMIT 1);

-- STAP 3: Verifieer dat ze weg zijn
SELECT COUNT(*) as remaining_orders
FROM queue_entries
WHERE streamer_id = (SELECT id FROM streamers WHERE name = 'Jop' LIMIT 1);

-- STAP 4: Reset Jop's streamer data
UPDATE streamers
SET 
  start_order_id = NULL,
  end_order_id = NULL,
  checked_in_at = NULL,
  checked_out_at = NULL,
  is_active = FALSE,
  session_count = 0
WHERE name = 'Jop';

-- STAP 5: Controleer dat Jop is gereset
SELECT id, name, is_active, start_order_id, end_order_id, session_count
FROM streamers
WHERE name = 'Jop';

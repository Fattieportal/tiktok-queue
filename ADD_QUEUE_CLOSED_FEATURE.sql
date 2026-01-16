-- Voeg queue_closed veld toe aan shops tabel
ALTER TABLE shops ADD COLUMN queue_closed BOOLEAN DEFAULT false;

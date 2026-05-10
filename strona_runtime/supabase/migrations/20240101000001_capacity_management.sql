-- Add capacity management columns to restaurant_config

ALTER TABLE public.restaurant_config 
ADD COLUMN IF NOT EXISTS total_tables INTEGER NOT NULL DEFAULT 10;

ALTER TABLE public.restaurant_config 
ADD COLUMN IF NOT EXISTS reservation_duration_minutes INTEGER NOT NULL DEFAULT 60;

-- Optional: If the owner wants to still restrict max guests per single reservation:
-- we already have max_guests_per_slot, but let's rename or keep it as max_guests_per_reservation
ALTER TABLE public.restaurant_config 
ADD COLUMN IF NOT EXISTS max_guests_per_reservation INTEGER NOT NULL DEFAULT 12;

-- We can drop or ignore max_guests_per_slot if it's no longer the main constraint, 
-- but we'll leave it to avoid breaking existing queries, just not rely on it for total capacity.

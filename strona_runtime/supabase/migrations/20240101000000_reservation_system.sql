-- Reservation System Schema

-- Core configuration for multi-restaurant support
CREATE TABLE public.restaurant_config (
    restaurant_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    max_guests_per_slot INTEGER NOT NULL DEFAULT 10,
    slot_interval_minutes INTEGER NOT NULL DEFAULT 30,
    opening_time TIME NOT NULL DEFAULT '12:00:00',
    closing_time TIME NOT NULL DEFAULT '22:00:00',
    closed_days_of_week INTEGER[] DEFAULT '{}', -- 0=Sunday, 1=Monday, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Specific dates/times blocked by admin
CREATE TABLE public.blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id TEXT NOT NULL REFERENCES public.restaurant_config(restaurant_id) ON DELETE CASCADE,
    block_date DATE, -- if null, implies recurring block or applies to all dates
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reservations table
CREATE TABLE public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id TEXT NOT NULL REFERENCES public.restaurant_config(restaurant_id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    guests INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
    special_requests TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.restaurant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Anyone can read config
CREATE POLICY "Public can view restaurant config" ON public.restaurant_config FOR SELECT USING (true);
CREATE POLICY "Public can view blocked slots" ON public.blocked_slots FOR SELECT USING (true);

-- Anyone can insert a reservation
CREATE POLICY "Public can insert reservations" ON public.reservations FOR INSERT WITH CHECK (true);

-- Admins can do everything (assuming auth.uid() is an admin, for simplicity we use authenticated role for admin dashboard)
CREATE POLICY "Admins can manage config" ON public.restaurant_config FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage blocked slots" ON public.blocked_slots FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage reservations" ON public.reservations FOR ALL USING (auth.role() = 'authenticated');

-- Insert initial dummy configuration for Bistro Warszawa
INSERT INTO public.restaurant_config (restaurant_id, name, max_guests_per_slot, opening_time, closing_time)
VALUES ('bistro-warszawa', 'Bistro Warszawa Cafe', 12, '12:00:00', '22:00:00')
ON CONFLICT DO NOTHING;

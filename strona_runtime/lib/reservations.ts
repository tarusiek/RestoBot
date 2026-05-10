import { supabase } from './supabase';
import { format, parse, addMinutes, isBefore, isSameDay } from 'date-fns';

export interface ReservationConfig {
  restaurant_id: string;
  opening_time: string;
  closing_time: string;
  slot_interval_minutes: number;
  total_tables: number;
  reservation_duration_minutes: number;
  max_guests_per_reservation: number;
  closed_days_of_week: number[];
}

export async function getConfig(restaurantId: string): Promise<ReservationConfig | null> {
  const { data, error } = await supabase
    .from('restaurant_config')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .single();

  if (error || !data) {
    return {
      restaurant_id: restaurantId,
      opening_time: '12:00:00',
      closing_time: '22:00:00',
      slot_interval_minutes: 30,
      total_tables: 10,
      reservation_duration_minutes: 60,
      max_guests_per_reservation: 12,
      closed_days_of_week: []
    };
  }
  return {
    ...data,
    total_tables: data.total_tables ?? 10,
    reservation_duration_minutes: data.reservation_duration_minutes ?? 60,
    max_guests_per_reservation: data.max_guests_per_reservation ?? 12,
  };
}

export async function getAvailableSlots(restaurantId: string, date: Date, guests: number): Promise<string[]> {
  const config = await getConfig(restaurantId);
  if (!config) return [];

  // 1. Check if closed day
  if (config.closed_days_of_week.includes(date.getDay())) {
    return [];
  }

  // 2. Reject if guests exceed single reservation limit
  if (guests > config.max_guests_per_reservation) {
    return [];
  }

  const dateStr = format(date, 'yyyy-MM-dd');
  
  // 3. Get existing reservations for the day
  const { data: existingReservations } = await supabase
    .from('reservations')
    .select('reservation_time, guests, status')
    .eq('restaurant_id', restaurantId)
    .eq('reservation_date', dateStr)
    .in('status', ['pending', 'confirmed']);

  // 4. Get blocked slots
  const { data: blockedSlots } = await supabase
    .from('blocked_slots')
    .select('start_time, end_time')
    .eq('restaurant_id', restaurantId)
    .or(`block_date.eq.${dateStr},block_date.is.null`);

  const slots: string[] = [];
  const openTime = parse(`${dateStr} ${config.opening_time}`, 'yyyy-MM-dd HH:mm:ss', new Date());
  const closeTime = parse(`${dateStr} ${config.closing_time}`, 'yyyy-MM-dd HH:mm:ss', new Date());
  
  let currentSlot = openTime;
  const now = new Date();

  // Convert reservations to Date objects for easy interval overlap checks
  const activeReservations = (existingReservations || []).map(r => {
    const start = parse(`${dateStr} ${r.reservation_time}`, 'yyyy-MM-dd HH:mm:ss', new Date());
    const end = addMinutes(start, config.reservation_duration_minutes);
    return { start, end };
  });

  while (isBefore(currentSlot, closeTime)) {
    // Prevent past slots
    if (isSameDay(date, now) && isBefore(currentSlot, addMinutes(now, 30))) {
       currentSlot = addMinutes(currentSlot, config.slot_interval_minutes);
       continue;
    }

    const timeStr = format(currentSlot, 'HH:mm:ss');
    const displayTimeStr = format(currentSlot, 'HH:mm');
    const slotEnd = addMinutes(currentSlot, config.reservation_duration_minutes);

    // Check blocked hours explicitly
    const isBlocked = blockedSlots?.some(block => {
      // Slot is blocked if it overlaps with a blocked period
      return (timeStr >= block.start_time && timeStr < block.end_time);
    });

    if (!isBlocked) {
      // Calculate overlapping tables
      // A reservation overlaps if its interval (start, end) intersects with (currentSlot, slotEnd)
      // Actually, standard logic: check how many reservations are ACTIVE at exact `currentSlot`.
      // The user requested: "If 10 active reservations exist for 15:00-16:00, then no more reservations allowed at 15:00".
      // Since every reservation consumes a table for `reservation_duration_minutes`,
      // we just need to ensure that AT `currentSlot` AND strictly BEFORE `slotEnd`, we don't exceed `total_tables`.
      // The simplest strict check: how many reservations overlap with [currentSlot, currentSlot + duration)?
      let maxOverlapping = 0;
      
      // We check minute by minute (or by slot_interval) within this new reservation's proposed duration 
      // to ensure at NO point it exceeds total_tables.
      let checkTime = new Date(currentSlot);
      while (isBefore(checkTime, slotEnd)) {
        let activeAtCheckTime = 0;
        for (const res of activeReservations) {
          // res is active if checkTime is >= res.start AND checkTime < res.end
          if (checkTime.getTime() >= res.start.getTime() && checkTime.getTime() < res.end.getTime()) {
            activeAtCheckTime++;
          }
        }
        if (activeAtCheckTime > maxOverlapping) {
          maxOverlapping = activeAtCheckTime;
        }
        checkTime = addMinutes(checkTime, config.slot_interval_minutes);
      }

      // If adding 1 table (this reservation) doesn't exceed total_tables
      if (maxOverlapping + 1 <= config.total_tables) {
        slots.push(displayTimeStr);
      }
    }

    currentSlot = addMinutes(currentSlot, config.slot_interval_minutes);
  }

  return slots;
}

export async function createReservation(data: {
  restaurant_id: string;
  date: Date;
  time: string;
  guests: number;
  name: string;
  phone: string;
  email?: string;
  requests?: string;
}) {
  const dateStr = format(data.date, 'yyyy-MM-dd');
  const timeStr = `${data.time}:00`;

  const { error } = await supabase.from('reservations').insert([{
    restaurant_id: data.restaurant_id,
    reservation_date: dateStr,
    reservation_time: timeStr,
    guests: data.guests,
    customer_name: data.name,
    customer_phone: data.phone,
    customer_email: data.email,
    special_requests: data.requests
  }]);

  if (error) throw new Error(error.message);
  return true;
}

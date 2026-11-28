-- Bảo đảm ticket_code trên facility_bookings luôn duy nhất (idempotent với UNIQUE ở init)
CREATE UNIQUE INDEX IF NOT EXISTS idx_facility_bookings_ticket_code_unique
  ON public.facility_bookings (ticket_code);

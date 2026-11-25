-- ============================================================================
-- MIGRATION 20261125040000: ROW LEVEL SECURITY (RLS) TOÀN BỘ SCHEMA PUBLIC
-- Bật RLS cho mọi bảng trong schema public.
-- Dùng hàm SECURITY DEFINER đọc role & apartment_code từ public.profiles.
-- ============================================================================

-- 1. Helper Functions (SECURITY DEFINER, đọc từ public.profiles, KHÔNG từ user_metadata)
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_apartment()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT apartment_code FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_technician_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id
  FROM public.technicians t
  JOIN public.profiles p ON p.legacy_user_id = t.user_id
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_apartment() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_technician_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_apartment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_technician_id() TO authenticated;

-- 2. Bật RLS cho MỌI bảng trong schema public (kể cả surveys/survey_votes nếu tồn tại)
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
  END LOOP;
END $$;

-- 3. Bảng danh mục đọc chung cho authenticated + ADMIN toàn quyền
DO $$
DECLARE
  ref_tbl TEXT;
BEGIN
  FOREACH ref_tbl IN ARRAY ARRAY['condominiums', 'blocks', 'floors', 'facilities', 'community_posts', 'voting_topics', 'voting_options']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated read %I" ON public.%I;', ref_tbl, ref_tbl);
    EXECUTE format('CREATE POLICY "Authenticated read %I" ON public.%I FOR SELECT TO authenticated USING (true);', ref_tbl, ref_tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Admin all %I" ON public.%I;', ref_tbl, ref_tbl);
    EXECUTE format('CREATE POLICY "Admin all %I" ON public.%I FOR ALL TO authenticated USING (public.current_role() = ''ADMIN'') WITH CHECK (public.current_role() = ''ADMIN'');', ref_tbl, ref_tbl);
  END LOOP;
END $$;

-- 4. APARTMENTS
DROP POLICY IF EXISTS "Admin all apartments" ON public.apartments;
CREATE POLICY "Admin all apartments" ON public.apartments FOR ALL TO authenticated
  USING (public.current_role() = 'ADMIN') WITH CHECK (public.current_role() = 'ADMIN');

DROP POLICY IF EXISTS "Resident read own apartment" ON public.apartments;
CREATE POLICY "Resident read own apartment" ON public.apartments FOR SELECT TO authenticated
  USING (
    apt_code = public.current_apartment()
    OR public.current_role() IN ('TECHNICIAN', 'RECEPTIONIST')
  );

-- 5. USERS & TECHNICIANS
DROP POLICY IF EXISTS "Admin all users" ON public.users;
CREATE POLICY "Admin all users" ON public.users FOR ALL TO authenticated
  USING (public.current_role() = 'ADMIN') WITH CHECK (public.current_role() = 'ADMIN');

DROP POLICY IF EXISTS "Resident read own user row" ON public.users;
CREATE POLICY "Resident read own user row" ON public.users FOR SELECT TO authenticated
  USING (
    id = (SELECT legacy_user_id FROM public.profiles WHERE id = auth.uid())
    OR apartment_code = public.current_apartment()
  );

DROP POLICY IF EXISTS "Admin all technicians" ON public.technicians;
CREATE POLICY "Admin all technicians" ON public.technicians FOR ALL TO authenticated
  USING (public.current_role() = 'ADMIN') WITH CHECK (public.current_role() = 'ADMIN');

DROP POLICY IF EXISTS "Technician read own profile" ON public.technicians;
CREATE POLICY "Technician read own profile" ON public.technicians FOR SELECT TO authenticated
  USING (id = public.current_technician_id());

-- 6. SERVICE_TICKETS & TICKET_EVENTS
DROP POLICY IF EXISTS "Admin all service_tickets" ON public.service_tickets;
CREATE POLICY "Admin all service_tickets" ON public.service_tickets FOR ALL TO authenticated
  USING (public.current_role() = 'ADMIN') WITH CHECK (public.current_role() = 'ADMIN');

DROP POLICY IF EXISTS "Technician read assigned tickets" ON public.service_tickets;
CREATE POLICY "Technician read assigned tickets" ON public.service_tickets FOR SELECT TO authenticated
  USING (public.current_role() = 'TECHNICIAN' AND assigned_technician_id = public.current_technician_id());

DROP POLICY IF EXISTS "Technician update assigned tickets" ON public.service_tickets;
CREATE POLICY "Technician update assigned tickets" ON public.service_tickets FOR UPDATE TO authenticated
  USING (public.current_role() = 'TECHNICIAN' AND assigned_technician_id = public.current_technician_id())
  WITH CHECK (public.current_role() = 'TECHNICIAN' AND assigned_technician_id = public.current_technician_id());

DROP POLICY IF EXISTS "Resident read own apartment tickets" ON public.service_tickets;
CREATE POLICY "Resident read own apartment tickets" ON public.service_tickets FOR SELECT TO authenticated
  USING (public.current_role() IN ('OWNER', 'TENANT') AND apartment_code = public.current_apartment());

DROP POLICY IF EXISTS "Resident insert own apartment tickets" ON public.service_tickets;
CREATE POLICY "Resident insert own apartment tickets" ON public.service_tickets FOR INSERT TO authenticated
  WITH CHECK (public.current_role() IN ('OWNER', 'TENANT') AND apartment_code = public.current_apartment());

DROP POLICY IF EXISTS "Admin all ticket_events" ON public.ticket_events;
CREATE POLICY "Admin all ticket_events" ON public.ticket_events FOR ALL TO authenticated
  USING (public.current_role() = 'ADMIN') WITH CHECK (public.current_role() = 'ADMIN');

DROP POLICY IF EXISTS "Scoped read ticket_events" ON public.ticket_events;
CREATE POLICY "Scoped read ticket_events" ON public.ticket_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_tickets st
      WHERE st.id = ticket_events.ticket_id
        AND (
          (public.current_role() IN ('OWNER', 'TENANT') AND st.apartment_code = public.current_apartment())
          OR (public.current_role() = 'TECHNICIAN' AND st.assigned_technician_id = public.current_technician_id())
        )
    )
  );

-- 7. BILLS, BILL_DETAILS, METER_READINGS
DROP POLICY IF EXISTS "Admin all bills" ON public.bills;
CREATE POLICY "Admin all bills" ON public.bills FOR ALL TO authenticated
  USING (public.current_role() = 'ADMIN') WITH CHECK (public.current_role() = 'ADMIN');

DROP POLICY IF EXISTS "Resident read own bills" ON public.bills;
CREATE POLICY "Resident read own bills" ON public.bills FOR SELECT TO authenticated
  USING (public.current_role() IN ('OWNER', 'TENANT') AND apartment_code = public.current_apartment());

DROP POLICY IF EXISTS "Admin all bill_details" ON public.bill_details;
CREATE POLICY "Admin all bill_details" ON public.bill_details FOR ALL TO authenticated
  USING (public.current_role() = 'ADMIN') WITH CHECK (public.current_role() = 'ADMIN');

DROP POLICY IF EXISTS "Resident read own bill_details" ON public.bill_details;
CREATE POLICY "Resident read own bill_details" ON public.bill_details FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bills b
      WHERE b.id = bill_details.bill_id
        AND public.current_role() IN ('OWNER', 'TENANT')
        AND b.apartment_code = public.current_apartment()
    )
  );

DROP POLICY IF EXISTS "Staff all meter_readings" ON public.meter_readings;
CREATE POLICY "Staff all meter_readings" ON public.meter_readings FOR ALL TO authenticated
  USING (public.current_role() IN ('ADMIN', 'TECHNICIAN'))
  WITH CHECK (public.current_role() IN ('ADMIN', 'TECHNICIAN'));

DROP POLICY IF EXISTS "Resident read own meter_readings" ON public.meter_readings;
CREATE POLICY "Resident read own meter_readings" ON public.meter_readings FOR SELECT TO authenticated
  USING (public.current_role() IN ('OWNER', 'TENANT') AND apartment_code = public.current_apartment());

-- 8. Các bảng theo apartment_code (cư dân đọc/ghi căn hộ mình, ADMIN toàn quyền)
DO $$
DECLARE
  apt_tbl TEXT;
BEGIN
  FOREACH apt_tbl IN ARRAY ARRAY[
    'apartment_members',
    'smart_devices',
    'smart_automation_rules',
    'smart_guest_pins',
    'smart_door_access_logs',
    'facility_bookings',
    'visitor_passes',
    'visitor_gate_logs',
    'voting_records',
    'ekyc_submissions',
    'parking_slots',
    'ai_chat_conversations'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admin all %I" ON public.%I;', apt_tbl, apt_tbl);
    EXECUTE format('CREATE POLICY "Admin all %I" ON public.%I FOR ALL TO authenticated USING (public.current_role() = ''ADMIN'') WITH CHECK (public.current_role() = ''ADMIN'');', apt_tbl, apt_tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Resident own %I" ON public.%I;', apt_tbl, apt_tbl);
    EXECUTE format('CREATE POLICY "Resident own %I" ON public.%I FOR ALL TO authenticated USING (public.current_role() IN (''OWNER'', ''TENANT'') AND apartment_code = public.current_apartment()) WITH CHECK (public.current_role() IN (''OWNER'', ''TENANT'') AND apartment_code = public.current_apartment());', apt_tbl, apt_tbl);
  END LOOP;
END $$;

-- resident_service_bookings dùng cột apt_code
DROP POLICY IF EXISTS "Admin all resident_service_bookings" ON public.resident_service_bookings;
CREATE POLICY "Admin all resident_service_bookings" ON public.resident_service_bookings FOR ALL TO authenticated
  USING (public.current_role() = 'ADMIN') WITH CHECK (public.current_role() = 'ADMIN');

DROP POLICY IF EXISTS "Resident own resident_service_bookings" ON public.resident_service_bookings;
CREATE POLICY "Resident own resident_service_bookings" ON public.resident_service_bookings FOR ALL TO authenticated
  USING (public.current_role() IN ('OWNER', 'TENANT') AND apt_code = public.current_apartment())
  WITH CHECK (public.current_role() IN ('OWNER', 'TENANT') AND apt_code = public.current_apartment());

-- RECEPTIONIST trên visitor_passes & visitor_gate_logs & facility_access_logs
DROP POLICY IF EXISTS "Receptionist visitor_passes" ON public.visitor_passes;
CREATE POLICY "Receptionist visitor_passes" ON public.visitor_passes FOR ALL TO authenticated
  USING (public.current_role() = 'RECEPTIONIST') WITH CHECK (public.current_role() = 'RECEPTIONIST');

DROP POLICY IF EXISTS "Receptionist visitor_gate_logs" ON public.visitor_gate_logs;
CREATE POLICY "Receptionist visitor_gate_logs" ON public.visitor_gate_logs FOR ALL TO authenticated
  USING (public.current_role() = 'RECEPTIONIST') WITH CHECK (public.current_role() = 'RECEPTIONIST');

DROP POLICY IF EXISTS "Staff facility_access_logs" ON public.facility_access_logs;
CREATE POLICY "Staff facility_access_logs" ON public.facility_access_logs FOR ALL TO authenticated
  USING (public.current_role() IN ('ADMIN', 'RECEPTIONIST')) WITH CHECK (public.current_role() IN ('ADMIN', 'RECEPTIONIST'));

-- ai_chat_messages (theo conversation)
DROP POLICY IF EXISTS "Admin all ai_chat_messages" ON public.ai_chat_messages;
CREATE POLICY "Admin all ai_chat_messages" ON public.ai_chat_messages FOR ALL TO authenticated
  USING (public.current_role() = 'ADMIN') WITH CHECK (public.current_role() = 'ADMIN');

DROP POLICY IF EXISTS "Resident own ai_chat_messages" ON public.ai_chat_messages;
CREATE POLICY "Resident own ai_chat_messages" ON public.ai_chat_messages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_chat_conversations c
      WHERE c.id = ai_chat_messages.conversation_id
        AND c.apartment_code = public.current_apartment()
    )
  );

-- ============================================================================
-- MIGRATION 20261125060000: TICKET STATE MACHINE, ACTOR_ID & ATOMIC RPC
-- ============================================================================

-- 1. Thêm actor_id vào ticket_events để lưu user id từ phiên đăng nhập
ALTER TABLE public.ticket_events
  ADD COLUMN IF NOT EXISTS actor_id VARCHAR(100);

-- 2. Đảm bảo CHECK constraint trạng thái khớp với máy trạng thái
ALTER TABLE public.service_tickets
  DROP CONSTRAINT IF EXISTS service_tickets_status_check;

ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_status_check
  CHECK (status IN ('Open', 'Assigned', 'In_Progress', 'Resolved'));

ALTER TABLE public.ticket_events
  DROP CONSTRAINT IF EXISTS ticket_events_old_status_check,
  DROP CONSTRAINT IF EXISTS ticket_events_new_status_check;

ALTER TABLE public.ticket_events
  ADD CONSTRAINT ticket_events_old_status_check
  CHECK (old_status IS NULL OR old_status IN ('Open', 'Assigned', 'In_Progress', 'Resolved')),
  ADD CONSTRAINT ticket_events_new_status_check
  CHECK (new_status IS NULL OR new_status IN ('Open', 'Assigned', 'In_Progress', 'Resolved'));

-- 3. RPC: ASSIGN (Open -> Assigned + chuyển KTV sang BUSY + ghi ticket_events trong 1 transaction)
CREATE OR REPLACE FUNCTION public.assign_ticket_tx(
  p_ticket_id TEXT,
  p_technician_id TEXT,
  p_scheduled_time TIMESTAMPTZ,
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_actor_role TEXT,
  p_auto_dispatched BOOLEAN DEFAULT FALSE,
  p_ai_dispatch_reason TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.service_tickets%ROWTYPE;
  v_tech public.technicians%ROWTYPE;
BEGIN
  SELECT * INTO v_ticket
  FROM public.service_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TICKET_NOT_FOUND: Không tìm thấy phiếu %', p_ticket_id;
  END IF;

  IF v_ticket.status <> 'Open' THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Không thể phân công phiếu đang ở trạng thái % (chỉ hợp lệ khi Open)', v_ticket.status;
  END IF;

  SELECT * INTO v_tech
  FROM public.technicians
  WHERE id = p_technician_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TECH_NOT_FOUND: Không tìm thấy kỹ thuật viên %', p_technician_id;
  END IF;

  IF v_tech.status <> 'AVAILABLE' THEN
    RAISE EXCEPTION 'TECH_NOT_AVAILABLE: Kỹ thuật viên % đang ở trạng thái % (phải AVAILABLE)', v_tech.name, v_tech.status;
  END IF;

  UPDATE public.service_tickets
  SET
    status = 'Assigned',
    assigned_technician_id = v_tech.id,
    assigned_technician_name = v_tech.name,
    assigned_technician_phone = v_tech.phone,
    scheduled_time = COALESCE(p_scheduled_time, NOW()),
    auto_dispatched = COALESCE(p_auto_dispatched, FALSE),
    ai_dispatch_reason = COALESCE(p_ai_dispatch_reason, ai_dispatch_reason),
    updated_at = NOW()
  WHERE id = p_ticket_id;

  UPDATE public.technicians
  SET status = 'BUSY'
  WHERE id = v_tech.id;

  INSERT INTO public.ticket_events (
    id, ticket_id, event_type, old_status, new_status, actor_id, actor_name, actor_role, note
  ) VALUES (
    'EVT-' || replace(gen_random_uuid()::text, '-', ''),
    p_ticket_id,
    'ASSIGNED',
    v_ticket.status,
    'Assigned',
    p_actor_id,
    p_actor_name,
    p_actor_role,
    'Phân công KTV ' || v_tech.name || ' (' || v_tech.id || ')'
  );
END;
$$;

-- 4. RPC: START_WORK (Assigned -> In_Progress + ghi ticket_events trong 1 transaction)
CREATE OR REPLACE FUNCTION public.start_ticket_work_tx(
  p_ticket_id TEXT,
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_actor_role TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.service_tickets%ROWTYPE;
BEGIN
  SELECT * INTO v_ticket
  FROM public.service_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TICKET_NOT_FOUND: Không tìm thấy phiếu %', p_ticket_id;
  END IF;

  IF v_ticket.status <> 'Assigned' THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Chỉ nhận việc khi phiếu ở trạng thái Assigned (hiện tại: %)', v_ticket.status;
  END IF;

  IF v_ticket.assigned_technician_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Phiếu chưa được gán kỹ thuật viên';
  END IF;

  UPDATE public.service_tickets
  SET
    status = 'In_Progress',
    updated_at = NOW()
  WHERE id = p_ticket_id;

  INSERT INTO public.ticket_events (
    id, ticket_id, event_type, old_status, new_status, actor_id, actor_name, actor_role, note
  ) VALUES (
    'EVT-' || replace(gen_random_uuid()::text, '-', ''),
    p_ticket_id,
    'STATUS_CHANGED',
    v_ticket.status,
    'In_Progress',
    p_actor_id,
    p_actor_name,
    p_actor_role,
    'Kỹ thuật viên đã nhận việc và bắt đầu xử lý'
  );
END;
$$;

-- 5. RPC: RESOLVE (In_Progress -> Resolved + giải phóng KTV về AVAILABLE + ghi ticket_events trong 1 transaction)
CREATE OR REPLACE FUNCTION public.resolve_ticket_tx(
  p_ticket_id TEXT,
  p_after_image TEXT,
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_actor_role TEXT,
  p_note TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.service_tickets%ROWTYPE;
BEGIN
  SELECT * INTO v_ticket
  FROM public.service_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TICKET_NOT_FOUND: Không tìm thấy phiếu %', p_ticket_id;
  END IF;

  IF v_ticket.status <> 'In_Progress' THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Chỉ được nghiệm thu khi phiếu ở trạng thái In_Progress (hiện tại: %)', v_ticket.status;
  END IF;

  IF v_ticket.assigned_technician_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Không thể đóng phiếu kỹ thuật chưa được gán KTV';
  END IF;

  UPDATE public.service_tickets
  SET
    status = 'Resolved',
    after_image = COALESCE(NULLIF(p_after_image, ''), after_image),
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_ticket_id;

  UPDATE public.technicians
  SET status = 'AVAILABLE'
  WHERE id = v_ticket.assigned_technician_id
    AND status = 'BUSY';

  INSERT INTO public.ticket_events (
    id, ticket_id, event_type, old_status, new_status, actor_id, actor_name, actor_role, note
  ) VALUES (
    'EVT-' || replace(gen_random_uuid()::text, '-', ''),
    p_ticket_id,
    'RESOLVED',
    v_ticket.status,
    'Resolved',
    p_actor_id,
    p_actor_name,
    p_actor_role,
    COALESCE(p_note, 'Hoàn thành xử lý và gửi ảnh nghiệm thu')
  );
END;
$$;

-- 6. RPC: REJECT_RESOLUTION (Resolved -> In_Progress + đặt lại KTV BUSY + ghi ticket_events trong 1 transaction)
CREATE OR REPLACE FUNCTION public.reject_ticket_resolution_tx(
  p_ticket_id TEXT,
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_actor_role TEXT,
  p_note TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.service_tickets%ROWTYPE;
BEGIN
  SELECT * INTO v_ticket
  FROM public.service_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TICKET_NOT_FOUND: Không tìm thấy phiếu %', p_ticket_id;
  END IF;

  IF v_ticket.status <> 'Resolved' THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Chỉ từ chối nghiệm thu khi phiếu ở trạng thái Resolved (hiện tại: %)', v_ticket.status;
  END IF;

  UPDATE public.service_tickets
  SET
    status = 'In_Progress',
    after_image = NULL,
    resolved_at = NULL,
    updated_at = NOW()
  WHERE id = p_ticket_id;

  IF v_ticket.assigned_technician_id IS NOT NULL THEN
    UPDATE public.technicians
    SET status = 'BUSY'
    WHERE id = v_ticket.assigned_technician_id
      AND status = 'AVAILABLE';
  END IF;

  INSERT INTO public.ticket_events (
    id, ticket_id, event_type, old_status, new_status, actor_id, actor_name, actor_role, note
  ) VALUES (
    'EVT-' || replace(gen_random_uuid()::text, '-', ''),
    p_ticket_id,
    'REJECTED',
    v_ticket.status,
    'In_Progress',
    p_actor_id,
    p_actor_name,
    p_actor_role,
    COALESCE(p_note, 'Từ chối nghiệm thu, yêu cầu KTV xử lý lại')
  );
END;
$$;

-- ============================================================================
-- MIGRATION 20261125080000: ATOMIC EKYC + FACE_ENROLLMENTS SYNC & LOGIN ATTEMPTS
-- ============================================================================

-- 1. Mở rộng CHECK constraint trạng thái để đồng bộ giữa ekyc_submissions và face_enrollments
ALTER TABLE public.ekyc_submissions
  DROP CONSTRAINT IF EXISTS ekyc_submissions_status_check;

ALTER TABLE public.ekyc_submissions
  ADD CONSTRAINT ekyc_submissions_status_check
  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'VERIFIED', 'PENDING_OWNER', 'REVOKED'));

ALTER TABLE public.face_enrollments
  DROP CONSTRAINT IF EXISTS face_enrollments_status_check;

ALTER TABLE public.face_enrollments
  ADD CONSTRAINT face_enrollments_status_check
  CHECK (status IN ('ACTIVE', 'APPROVED', 'PENDING', 'PENDING_OWNER', 'REVOKED'));

-- 2. RPC cập nhật đồng thời ekyc_submissions và face_enrollments trong 1 transaction
CREATE OR REPLACE FUNCTION public.transition_ekyc_and_face_tx(
  p_action TEXT,
  p_ekyc_id TEXT DEFAULT NULL,
  p_target_user TEXT DEFAULT NULL,
  p_actor_apt TEXT DEFAULT NULL,
  p_approver_name TEXT DEFAULT 'VinHomes Manager',
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ekyc public.ekyc_submissions%ROWTYPE;
  v_new_ekyc_status TEXT;
  v_new_face_status TEXT;
BEGIN
  IF p_ekyc_id IS NOT NULL AND TRIM(p_ekyc_id) <> '' THEN
    SELECT * INTO v_ekyc
    FROM public.ekyc_submissions
    WHERE id = TRIM(p_ekyc_id)
    FOR UPDATE;
  ELSIF p_target_user IS NOT NULL AND TRIM(p_target_user) <> '' THEN
    SELECT * INTO v_ekyc
    FROM public.ekyc_submissions
    WHERE user_id = TRIM(p_target_user) OR phone = TRIM(p_target_user)
    ORDER BY submitted_at DESC NULLS LAST
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'EKYC_NOT_FOUND: Không tìm thấy hồ sơ e-KYC';
  END IF;

  IF p_action = 'CONFIRM_BY_OWNER' THEN
    IF p_actor_apt IS NOT NULL AND UPPER(TRIM(v_ekyc.apartment_code)) <> UPPER(TRIM(p_actor_apt)) THEN
      RAISE EXCEPTION 'FORBIDDEN_APARTMENT: Chủ hộ chỉ được xác nhận thành viên thuộc căn hộ của mình';
    END IF;
    IF v_ekyc.status <> 'PENDING_OWNER' THEN
      RAISE EXCEPTION 'INVALID_EKYC_STATE: Hồ sơ không ở trạng thái PENDING_OWNER (hiện tại: %)', v_ekyc.status;
    END IF;
    v_new_ekyc_status := 'PENDING';
    v_new_face_status := 'PENDING';

    UPDATE public.ekyc_submissions
    SET status = v_new_ekyc_status
    WHERE id = v_ekyc.id
    RETURNING * INTO v_ekyc;
  ELSIF p_action = 'APPROVE' THEN
    v_new_ekyc_status := 'APPROVED';
    v_new_face_status := 'APPROVED';

    UPDATE public.ekyc_submissions
    SET
      status = v_new_ekyc_status,
      reviewed_at = NOW(),
      reviewed_by = COALESCE(NULLIF(TRIM(p_approver_name), ''), 'VinHomes Manager'),
      rejection_reason = NULL
    WHERE id = v_ekyc.id
    RETURNING * INTO v_ekyc;
  ELSIF p_action = 'REJECT' THEN
    v_new_ekyc_status := 'REJECTED';
    v_new_face_status := 'REVOKED';

    UPDATE public.ekyc_submissions
    SET
      status = v_new_ekyc_status,
      reviewed_at = NOW(),
      reviewed_by = COALESCE(NULLIF(TRIM(p_approver_name), ''), 'VinHomes Manager'),
      rejection_reason = COALESCE(NULLIF(TRIM(p_reason), ''), 'Ảnh chụp CCCD hoặc khuôn mặt không đạt tiêu chuẩn.')
    WHERE id = v_ekyc.id
    RETURNING * INTO v_ekyc;
  ELSIF p_action = 'REVOKE' THEN
    v_new_ekyc_status := 'REVOKED';
    v_new_face_status := 'REVOKED';

    UPDATE public.ekyc_submissions
    SET
      status = v_new_ekyc_status,
      reviewed_at = NOW(),
      reviewed_by = COALESCE(NULLIF(TRIM(p_approver_name), ''), 'VinHomes Manager'),
      rejection_reason = COALESCE(NULLIF(TRIM(p_reason), ''), 'Ban Quản Lý đã thu hồi quyền FaceID.')
    WHERE id = v_ekyc.id
    RETURNING * INTO v_ekyc;
  ELSE
    RAISE EXCEPTION 'INVALID_EKYC_ACTION: Hành động % không hợp lệ', p_action;
  END IF;

  UPDATE public.face_enrollments
  SET status = v_new_face_status
  WHERE user_id = v_ekyc.user_id
     OR (v_ekyc.phone IS NOT NULL AND phone = v_ekyc.phone);

  RETURN to_jsonb(v_ekyc);
END;
$$;

-- 3. Bảng login_attempts cho rate limit FaceID login bền vững trên Postgres
CREATE TABLE IF NOT EXISTS public.login_attempts (
  ip TEXT PRIMARY KEY,
  attempt_count INT NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_face_login_rate_limit(
  p_ip TEXT,
  p_max_attempts INT DEFAULT 5,
  p_window_seconds INT DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.login_attempts%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT * INTO v_row FROM public.login_attempts WHERE ip = p_ip FOR UPDATE;

  IF NOT FOUND OR v_now > v_row.reset_at THEN
    INSERT INTO public.login_attempts (ip, attempt_count, reset_at)
    VALUES (p_ip, 1, v_now + make_interval(secs => p_window_seconds))
    ON CONFLICT (ip) DO UPDATE
      SET attempt_count = 1,
          reset_at = EXCLUDED.reset_at;
    RETURN TRUE;
  END IF;

  IF v_row.attempt_count >= p_max_attempts THEN
    RETURN FALSE;
  END IF;

  UPDATE public.login_attempts
  SET attempt_count = v_row.attempt_count + 1
  WHERE ip = p_ip;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- MIGRATION 20261125030000: FACE_ENROLLMENTS RLS & AUTH LINK
-- Bật RLS cho face_enrollments (chủ sở hữu chỉ đọc hồ sơ của mình),
-- hỗ trợ status 'APPROVED' và liên kết auth_user_id.
-- ============================================================================

ALTER TABLE public.face_enrollments
    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS email VARCHAR(100);

ALTER TABLE public.face_enrollments
    DROP CONSTRAINT IF EXISTS face_enrollments_status_check;

ALTER TABLE public.face_enrollments
    ADD CONSTRAINT face_enrollments_status_check
    CHECK (status IN ('APPROVED', 'ACTIVE', 'PENDING', 'PENDING_OWNER', 'REVOKED'));

CREATE INDEX IF NOT EXISTS idx_face_enrollments_status ON public.face_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_face_enrollments_auth_user ON public.face_enrollments(auth_user_id);

ALTER TABLE public.face_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can view own face enrollment" ON public.face_enrollments;
CREATE POLICY "Owner can view own face enrollment"
    ON public.face_enrollments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_user_id);

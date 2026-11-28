-- Mở rộng CHECK constraint cho facility_access_logs và smart_door_access_logs để hỗ trợ QR_CODE
ALTER TABLE IF EXISTS public.facility_access_logs
  DROP CONSTRAINT IF EXISTS facility_access_logs_method_check;

ALTER TABLE IF EXISTS public.facility_access_logs
  ADD CONSTRAINT facility_access_logs_method_check
  CHECK (method IN ('NFC_CARD', 'FACE_ID', 'QR_CODE'));

ALTER TABLE IF EXISTS public.smart_door_access_logs
  DROP CONSTRAINT IF EXISTS smart_door_access_logs_method_check;

ALTER TABLE IF EXISTS public.smart_door_access_logs
  ADD CONSTRAINT smart_door_access_logs_method_check
  CHECK (method IN ('FACE_ID', 'PIN_OTP', 'NFC_CARD', 'REMOTE_APP', 'PHYSICAL_KEY', 'AUTO_LOCK', 'QR_CODE'));

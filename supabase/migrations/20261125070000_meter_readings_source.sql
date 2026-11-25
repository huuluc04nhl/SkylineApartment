-- ============================================================================
-- MIGRATION 20261125070000: ADD SOURCE COLUMN TO METER_READINGS
-- Phân biệt chỉ số nhập thủ công ('manual') và nhận dạng OCR ('ocr')
-- ============================================================================

ALTER TABLE public.meter_readings
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'ocr'));

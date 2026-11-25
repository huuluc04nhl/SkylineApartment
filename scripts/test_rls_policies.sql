-- ============================================================================
-- KIỂM TRA ROW LEVEL SECURITY (RLS) - CHẠY TRONG TRANSACTION ROLLBACK
-- ============================================================================

-- 1. Kiểm tra không có bảng nào trong public bị tắt RLS (kỳ vọng: 0 dòng)
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND NOT rowsecurity;

-- 2. Kiểm tra chính sách cách ly dữ liệu theo vai trò (OWNER vs TECHNICIAN vs ADMIN)
BEGIN;

-- Giả lập OWNER căn CH-06 (thay UUID thật từ public.profiles khi chạy)
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- OWNER CH-06 không đọc được hóa đơn của căn CH-01 (kỳ vọng: 0 dòng nếu không phải CH-06)
SELECT id, apartment_code FROM public.bills WHERE apartment_code = 'CH-01';

-- Giả lập TECHNICIAN KTV-01 (chỉ thấy phiếu gán cho KTV-01, không thấy phiếu KTV-02)
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
SELECT id, assigned_technician_id FROM public.service_tickets;

ROLLBACK;

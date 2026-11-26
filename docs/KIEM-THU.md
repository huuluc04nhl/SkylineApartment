# Báo Cáo Kiểm Thử — SKYLINE Smart Residence

> Cập nhật theo trạng thái thực tế của mã nguồn và môi trường kiểm thử.

---

## 1. Kết Quả Kiểm Tra Tự Động (Unit, Integration, RLS, Build)

| Lệnh kiểm tra | Phạm vi | Kết quả | Ghi chú |
|---|---|---|---|
| `npx tsc --noEmit` | Toàn bộ TypeScript (`app/`, `components/`, `lib/`, `tests/`) | **PASS** (exit 0) | Không có lỗi kiểu dữ liệu |
| `npm test` (`vitest run`) | 14 file test (40 test cases): unit, integration API & Supabase RLS | **PASS** (40/40) | Bao gồm `tests/rls/rls_isolation.test.ts` |
| `npm run build` | Next.js 14 production build (33 static pages + dynamic API routes) | **PASS** (exit 0) | Build hoàn chỉnh |
| `npm run test:e2e` | Playwright E2E (`tests/e2e/skyline-flows.spec.ts`) với Supabase local | **CHƯA CHẠY ĐƯỢC** | Máy hiện tại chưa cài Docker/Podman nên `npx supabase start` báo lỗi không thể khởi động Supabase local; đồng thời không chạy E2E ghi dữ liệu lên project remote. |

---

## 2. Kịch Bản Kiểm Thử E2E (`tests/e2e/skyline-flows.spec.ts`)

| STT | Luồng kiểm thử | Vai trò tham gia | Kỳ vọng | Trạng thái | Ảnh chụp màn hình |
|---:|---|---|---|---|---|
| 1 | Đăng nhập qua UI & vào cổng cư dân `/portal` | `OWNER` | Đăng nhập thành công, chuyển hướng `/portal`, hiển thị thông tin căn hộ `CH-06` | Chờ chạy trên Supabase local | `docs/screenshots/01-owner-login.png` |
| 2 | Tạo phiếu sự cố -> Điều phối -> Xử lý hoàn tất | `OWNER` -> `ADMIN` -> `TECHNICIAN` | `OWNER` tạo ticket (`Open`), `ADMIN` gán `KTV-01` (`Assigned`), `TECHNICIAN` xử lý (`Resolved`) | Chờ chạy trên Supabase local | `docs/screenshots/02-ticket-lifecycle.png` |
| 3 | Xem hóa đơn & thanh toán cổng VNPay sandbox | `OWNER` | Tải danh sách hóa đơn `/api/billing`, tạo URL thanh toán `/api/billing/vnpay-create`, mở cổng sandbox | Chờ chạy trên Supabase local | `docs/screenshots/03-billing-vnpay-sandbox.png` |
| 4 | Tạo thẻ khách thăm & lễ tân check-in | `OWNER` -> `RECEPTIONIST` | `OWNER` tạo `visitor_pass`, `RECEPTIONIST` check-in hợp lệ qua `/api/visitor` | Chờ chạy trên Supabase local | `docs/screenshots/04-visitor-checkin.png` |
| 5 | Bỏ phiếu biểu quyết 1 lần & chặn lần 2 | `OWNER` | Lần 1 trả `200`, lần 2 trên cùng `topic_id` + `apartment_code` bị chặn (`400`/`409`) nhờ `UNIQUE (topic_id, apartment_code)` | Chờ chạy trên Supabase local | `docs/screenshots/05-voting-double-block.png` |

### Hướng dẫn chạy E2E trên máy có Docker + Supabase local
```bash
npx supabase start
npx supabase db reset
npx tsx scripts/migrate-auth-users.ts
npx playwright install chromium
npm run test:e2e
```
*(Truyền biến môi trường `E2E_DEFAULT_PASSWORD` hoặc `E2E_OWNER_PASSWORD`, `E2E_ADMIN_PASSWORD`, `E2E_TECH_PASSWORD`, `E2E_RECEPTION_PASSWORD` trước khi chạy `npm run test:e2e`.)*

---

## 3. Rà Soát Bảo Mật Phụ Thuộc (`npm audit --omit=dev`)

| Gói | Mức độ | Vấn đề chính | Khuyến nghị nâng cấp |
|---|---|---|---|
| `next` | **Critical** | Nhiều lỗ hổng DoS / SSRF / Cache confusion / RCE Image Optimization trên nhánh `<=16.3.0-preview.10` | Hiện `package.json` dùng `next@^14.2.5`; cân nhắc nâng lên bản vá mới nhất cùng nhánh Next.js 14 hoặc lên lịch nâng cấp major Next.js có kiểm thử hồi quy (tránh `npm audit fix --force` tự nhảy lên `next@16.4.6` gây breaking change). |
| `postcss` (trong `next`) | **High** | XSS CSS stringify & path traversal `sourceMappingURL` | Đi kèm bản nâng cấp `next` |
| `source-map-js` | **High** | Event-loop DoS qua source-map section offsets | Chạy `npm audit fix` (không cần `--force`) nếu có bản vá tương thích |
| `dompurify` | **Low** | Bypass guard trên `application/xhtml+xml` / `IN_PLACE` hook | Chạy `npm audit fix` trong phạm vi minor/patch |

---

## 4. Các Giới Hạn Đã Biết

1. **FaceID chưa có liveness detection thực sự:** `/api/user/face-enroll` và `/api/user/face-login` mới kiểm tra độ phân giải, 4 góc ảnh và cosine similarity của vector khuôn mặt; chưa có anti-spoofing 3D (nháy mắt, quay đầu chủ động hoặc depth check).
2. **SMS OTP phụ thuộc nhà cung cấp:** Đăng nhập OTP qua số điện thoại phụ thuộc cấu hình SMS Provider trên Supabase Auth; nếu chưa cấu hình provider, Supabase trả lỗi khi gửi OTP.
3. **OCR đồng hồ điện/nước & CCCD phụ thuộc `GEMINI_API_KEY`:** Khi thiếu key hoặc API Gemini lỗi/quá hạn mức, hệ thống trả `503` yêu cầu nhập thủ công thay vì sinh dữ liệu giả.
4. **Cổng thanh toán `/portal/vnpay-gateway`:** Chỉ phục vụ mô phỏng sandbox ở môi trường non-production; production bắt buộc dùng cấu hình VNPay thật (`VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`).
5. **Môi trường Supabase local:** Cần Docker Desktop hoặc Podman để chạy `npx supabase start` và bộ test Playwright E2E.

# Báo Cáo Kiểm Thử — SKYLINE Smart Residence

> Cập nhật theo trạng thái thực tế của mã nguồn, CI (`.github/workflows/ci.yml`) và môi trường kiểm thử.

---

## 1. Kết Quả Kiểm Tra Tự Động (Unit, Integration, RLS, Build)

| Lệnh kiểm tra | Phạm vi | Kết quả | Ghi chú |
|---|---|---|---|
| `npm run check:encoding` | Kiểm tra UTF-8 không BOM, không U+FFFD, không mojibake | **PASS** (exit 0) | `node scripts/check-encoding.mjs` |
| `npm run lint` | ESLint (`next/core-web-vitals`, `react-hooks/rules-of-hooks: error`) | **PASS** (exit 0) | 0 errors |
| `npx tsc --noEmit` | Toàn bộ TypeScript (`app/`, `components/`, `lib/`, `tests/`) | **PASS** (exit 0) | Không có lỗi kiểu dữ liệu |
| `npm test` (`vitest run`) | 18 file test (51 test cases): unit, integration API & Supabase RLS | **PASS** (51/51) | Bao gồm `tests/rls/rls_isolation.test.ts`, `visitor-qr-fixes.test.ts`, `access-and-facility-verify.test.ts`, `getClientIp.test.ts` |
| `npm run build` | Next.js 14.2.35 production build (36 static pages + dynamic API routes) | **PASS** (exit 0) | Build hoàn chỉnh với `NEXT_PUBLIC_DEMO_MODE=false` |
| `npm run test:e2e` | Playwright E2E (`tests/e2e/skyline-flows.spec.ts`) với Supabase local | **Chưa chạy tại local** (đã cấu hình job `e2e` trên CI) | Máy local chưa cài Docker/Podman (`docker: command not found`) nên không khởi động được Supabase local và chưa thể chụp ảnh vào `docs/screenshots/`. |

---

## 2. Kịch Bản Kiểm Thử E2E (`tests/e2e/skyline-flows.spec.ts`)

| STT | Luồng kiểm thử | Vai trò tham gia | Kỳ vọng | Trạng thái | Ảnh chụp màn hình |
|---:|---|---|---|---|---|
| 1 | Đăng nhập qua UI & vào cổng cư dân `/portal` | `OWNER` | Đăng nhập thành công, chuyển hướng `/portal`, hiển thị thông tin căn hộ | Chưa chạy (chờ CI / local có Docker) | `docs/screenshots/01-owner-login.png` |
| 2 | Tạo phiếu sự cố -> Điều phối -> Xử lý hoàn tất | `OWNER` -> `ADMIN` -> `TECHNICIAN` | `OWNER` tạo ticket (`Open`), `ADMIN` gán `KTV-01` (`Assigned`), `TECHNICIAN` xử lý (`Resolved`) | Chưa chạy (chờ CI / local có Docker) | `docs/screenshots/02-ticket-lifecycle.png` |
| 3 | Xem hóa đơn & thanh toán cổng VNPay sandbox | `OWNER` | Tải danh sách hóa đơn `/api/billing`, tạo URL thanh toán `/api/billing/vnpay-create`, mở cổng sandbox | Chưa chạy (chờ CI / local có Docker) | `docs/screenshots/03-billing-vnpay-sandbox.png` |
| 4 | Tạo thẻ khách thăm & lễ tân check-in | `OWNER` -> `RECEPTIONIST` | `OWNER` tạo `visitor_pass`, `RECEPTIONIST` check-in hợp lệ qua `/api/visitor` | Chưa chạy (chờ CI / local có Docker) | `docs/screenshots/04-visitor-checkin.png` |
| 5 | Bỏ phiếu biểu quyết 1 lần & chặn lần 2 | `OWNER` | Lần 1 trả `200`, lần 2 trên cùng `topic_id` + `apartment_code` bị chặn (`400`/`409`) nhờ `UNIQUE (topic_id, apartment_code)` | Chưa chạy (chờ CI / local có Docker) | `docs/screenshots/05-voting-double-block.png` |

### Hướng dẫn chạy E2E trên máy có Docker + Supabase local
```bash
npx supabase start
npx supabase db reset
npx tsx scripts/migrate-auth-users.ts
npx playwright install chromium
NEXT_PUBLIC_DEMO_MODE=false npm run test:e2e
```
*(Truyền biến môi trường `E2E_DEFAULT_PASSWORD` hoặc `E2E_OWNER_PASSWORD`, `E2E_ADMIN_PASSWORD`, `E2E_TECH_PASSWORD`, `E2E_RECEPTION_PASSWORD` trước khi chạy `npm run test:e2e`.)*

---

## 3. Rà Soát Bảo Mật Phụ Thuộc (`npm audit --omit=dev`)

Sau khi chạy `npm audit fix` (không dùng `--force`):
- **`source-map-js` (`high`)** và **`dompurify` (`low`)**: **Đã vá xong** (không còn trong `npm audit --omit=dev`).
- **`next` (`critical`)** và **`postcss` lồng trong `next` (`high`)**: Còn lại **2 lỗ hổng**. Bản `14.2.35` đang cài đặt là bản mới nhất của nhánh `next-14` (`npm view next dist-tags` xác nhận `next-14: 14.2.35`). Bản vá an toàn chỉ có ở nhánh major mới hơn (`next@16.4.6`), nên **chưa tự nâng** để tránh breaking changes.

### Phân tích breaking changes & tác động khi nâng Next.js 14 -> 15/16
1. **React 18 -> React 19 & Dependencies:** Next 15/16 yêu cầu React 19 cho App Router; cần kiểm tra tương thích các thư viện client (`lucide-react`, `@vladmandic/face-api`, `tesseract.js`, `html2canvas`, `jspdf`).
2. **App Router (Async Request APIs):** `cookies()`, `headers()`, `params`, `searchParams` chuyển sang **async** (bắt buộc `await`). Các file server dùng `cookies()` như `utils/supabase/server.ts`, `lib/supabase/server.ts` và các `page.tsx`/`layout.tsx` nhận `searchParams` cần rà soát và thêm `await`.
3. **Middleware (`middleware.ts` & `utils/supabase/middleware.ts`):** Next 16 đổi quy ước/tên gọi sang Proxy và siết chặt xử lý redirect/header chống cache poisoning; cần kiểm tra lại luồng `supabase.auth.getUser()` và redirect `/portal` -> `/` trong môi trường thực tế.
4. **`next/image` (`next.config.js`):** Next 15/16 siết kiểm tra `images.remotePatterns` để chống DoS/SSRF; repo đang bật `images.unoptimized: true` với 3 domain (`images.unsplash.com`, `ui-avatars.com`, `api.qrserver.com`) — nên rà soát xóa domain không còn dùng (`images.unsplash.com`) khi nâng cấp.
5. **Route Handlers (`app/api/**/route.ts`):** Từ Next 15+, `GET` Route Handlers mặc định **không cache** (thay vì cache tĩnh như Next 14) — phù hợp với API động của repo nhưng cần kiểm tra lại bất kỳ route nào kỳ vọng cache hoặc `export const dynamic`.

### Kế hoạch đề xuất nâng cấp Next.js (theo từng bước)
1. Tạo nhánh riêng `chore/upgrade-next-16`, nâng `react`/`react-dom` lên 19 và `next` lên bản vá mới nhất.
2. Chạy `npx @next/codemod@latest next-async-request-api .` để chuyển `cookies()`/`headers()`/`searchParams` sang async.
3. Chạy `npx tsc --noEmit`, `npm test`, `npm run build` và toàn bộ job `e2e` trên CI.
4. Kiểm thử thủ công đăng nhập, `next/image`, VNPay return/IPN, và middleware redirect `/portal` trước khi merge.

---

## 4. Các Giới Hạn Đã Biết

1. **FaceID chưa có liveness detection thực sự:** `/api/user/face-enroll` và `/api/user/face-login` mới kiểm tra độ phân giải, 4 góc ảnh và cosine similarity của vector khuôn mặt; chưa có anti-spoofing 3D (nháy mắt, quay đầu chủ động hoặc depth check).
2. **SMS OTP phụ thuộc nhà cung cấp:** Đăng nhập OTP qua số điện thoại phụ thuộc cấu hình SMS Provider trên Supabase Auth; nếu chưa cấu hình provider, Supabase trả lỗi khi gửi OTP.
3. **OCR đồng hồ điện/nước & CCCD phụ thuộc `GEMINI_API_KEY`:** Khi thiếu key hoặc API Gemini lỗi/quá hạn mức, hệ thống trả `503` yêu cầu nhập thủ công thay vì sinh dữ liệu giả.
4. **Cổng thanh toán `/portal/vnpay-gateway`:** Chỉ phục vụ mô phỏng sandbox ở môi trường non-production; production bắt buộc dùng cấu hình VNPay thật (`VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`).
5. **Môi trường Supabase local:** Cần Docker Desktop hoặc Podman để chạy `npx supabase start` và bộ test Playwright E2E.

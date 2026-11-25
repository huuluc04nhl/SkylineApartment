# SKYLINE Smart Residence

Nền tảng quản lý vận hành chung cư thông minh & cổng cư dân 24/7 cho phân khu **The Tropical (BS-07, BS-08, BS-09, BS-10)** — Beverly Solari.

---

## 1. Kiến trúc hệ thống

- **Frontend & API Routes:** Next.js 14 (App Router, React 18, TypeScript, TailwindCSS).
- **Database & Authentication:** Supabase (PostgreSQL + Supabase Auth).
  - Xác thực người dùng bằng Supabase Auth (`supabase.auth.getUser()`), phân quyền theo `public.profiles` (`ADMIN`, `TECHNICIAN`, `OWNER`, `TENANT`, `RECEPTIONIST`) qua `requireAuth` (`lib/auth/guard.ts`) kết hợp Row Level Security (RLS) trên toàn bộ schema `public`.
  - Các thao tác nghiệp vụ nhạy cảm (thanh toán VNPay IPN, chuyển trạng thái ticket theo máy trạng thái, OCR đồng hồ điện/nước) thực hiện phía server qua `SUPABASE_SERVICE_ROLE_KEY` và Postgres RPC transaction.
- **Tích hợp AI & Thanh toán:** Google Gemini (`GEMINI_API_KEY` server-only) và VNPay Sandbox/IPN (`VNP_TMN_CODE`, `VNP_HASH_SECRET`).
- **Đa ngôn ngữ (i18n):** Từ điển JSON tách theo ngôn ngữ (`lib/locales/en.json`, `lib/locales/vi.json`), tải theo nhu cầu qua `LanguageProvider`.

---

## 2. Hướng dẫn chạy từ máy sạch (Local)

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Cấu hình biến môi trường
Sao chép `.env.example` thành `.env.local` và điền các giá trị Supabase/Gemini/VNPay của bạn:
```bash
cp .env.example .env.local
```
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: khóa public của project Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: khóa service role (**chỉ dùng ở server**, không gắn `NEXT_PUBLIC_`).
- `GEMINI_API_KEY`: API key Google Gemini (server-only).
- `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`: cấu hình VNPay.
- `NEXT_PUBLIC_BASE_URL`: `http://localhost:3000`.
- `NEXT_PUBLIC_DEMO_MODE`: mặc định `false` (chỉ bật `true` ở local nếu muốn hiện các nút mô phỏng UI).

### Bước 3: Khởi động Supabase local, chạy migration & seed local
```bash
npx supabase start
npx supabase db reset   # CHỈ chạy trên local để áp dụng migrations + supabase/seed.sql
```
> **Cảnh báo:** `supabase/seed.sql` **CHỈ DÙNG CHO MÔI TRƯỜNG LOCAL**. Tuyệt đối không chạy `seed.sql` hay `supabase db reset` lên database production.

Nếu làm việc với project Supabase remote đã link:
```bash
npx supabase db push --remote
```

### Bước 4: Chạy ứng dụng & kiểm tra
```bash
npm run dev          # Chạy server phát triển tại http://localhost:3000
npx tsc --noEmit     # Kiểm tra TypeScript
npm test             # Chạy bộ test Vitest (unit + integration + RLS)
npm run build        # Build production
```

---

## 3. Tài khoản demo (Local / Seed)

Các hồ sơ mẫu trong `supabase/seed.sql` / `public.profiles` (cần tồn tại user tương ứng trong Supabase Auth với mật khẩu bạn thiết lập khi tạo user):

| Vai trò | Email | SĐT (có thể dùng thay Email) | Mật khẩu (Local/Dev) | Căn hộ |
| :--- | :--- | :--- | :--- | :--- |
| `ADMIN` | `admin@skyline.vn` | `0901888999` | `admin123` | — |
| `TECHNICIAN` | `tech.skyline@gmail.com` | `0909888777` | `12345678` | — |
| `OWNER` | `huuluc04@gmail.com` | `0364967082` | `12345678` | `CH-06` |
| `TENANT` | `nguyenhuunhut1309@gmail.com` | `0917795211` | `12345678` | `CH-06` |
| `RECEPTIONIST` | `reception.skyline@gmail.com` | `0901234567` | `12345678` | — |

---

## 4. Giới hạn đã biết

- **FaceID chưa có liveness detection thực sự:** Hiện tại đăng ký/đăng nhập FaceID mới kiểm tra kích thước ảnh, 4 góc ảnh và độ tương đồng vector (cosine similarity), chưa có kiểm tra chuyển động/nháy mắt/anti-spoofing 3D chuyên sâu.
- **SMS OTP:** Đăng nhập OTP qua SĐT trên production phụ thuộc vào việc cấu hình SMS Provider trong Supabase Auth; ở môi trường không cấu hình SMS provider, tính năng gửi OTP thật sẽ trả lỗi từ Supabase.
- **Một số module UI vẫn dùng dữ liệu phụ in-memory (`skylineDb`):** Một phần dữ liệu phụ trợ (ví dụ thiết bị IoT demo, cộng đồng, bãi xe) chưa đồng bộ hoàn toàn qua Postgres API riêng và được gom sau cờ `NEXT_PUBLIC_DEMO_MODE`.
- **OCR đồng hồ điện/nước:** Cần `GEMINI_API_KEY` hợp lệ ở server; khi API lỗi hoặc thiếu key, hệ thống trả `503` yêu cầu nhập chỉ số thủ công thay vì tự sinh số giả.

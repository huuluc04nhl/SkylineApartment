# Checklist Cấu Hình Supabase Dashboard — SKYLINE Smart Residence

## 1. Áp dụng Migration & Migrate Tài Khoản
1. Chạy [supabase/migrations/20261125020000_auth_profiles.sql](file:///d:/BCTN/SkylineApartment/supabase/migrations/20261125020000_auth_profiles.sql) trên Supabase SQL Editor (hoặc `npx supabase db push`).
2. Đảm bảo `.env.local` có `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (hoặc `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), và `SUPABASE_SERVICE_ROLE_KEY`.
3. Chạy script migrate tài khoản seed 1 lần ở local:
   ```bash
   npx tsx scripts/migrate-auth-users.ts
   ```
   Lưu lại mật khẩu ngẫu nhiên được in ra cho từng tài khoản.

## 2. Authentication -> Policies & Password Strength
- **Minimum password length:** Đặt tối thiểu **8** (khuyến nghị **10–12** ký tự).
- **Password Requirements:** Bật yêu cầu chữ hoa, chữ thường, chữ số (và ký tự đặc biệt nếu cần).
- **Prevent use of leaked passwords (HaveIBeenPwned):** Bật ON.

## 3. Authentication -> Rate Limits & Brute-Force Protection
- **Sign-in / Token refresh rate limit:** Bật giới hạn số lần thử sai (mặc định Supabase Auth giới hạn theo IP; kiểm tra `Rate Limits` trong *Authentication -> Rate Limits*).
- **Email / OTP rate limit:** Giới hạn số email gửi/giờ để chống spam.
- **CAPTCHA (Attack Protection):** Bật hCaptcha hoặc Cloudflare Turnstile cho đăng nhập/đăng ký khi triển khai production.
## 4. Authentication -> URL Configuration & Email/Phone Confirmation
- **Site URL:** Đặt đúng domain ứng dụng (ví dụ `http://localhost:3000` khi dev, hoặc domain production khi deploy).
- **Redirect URLs:** Thêm `http://localhost:3000/**` và `https://<your-domain>/**` cho luồng reset password / magic link.
- **Email / Phone Confirmation:** Bật *Confirm email* (và *Confirm phone* nếu dùng OTP SMS) trong *Authentication -> Providers -> Email/Phone*.

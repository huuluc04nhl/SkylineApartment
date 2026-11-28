# Ma Trận Phân Quyền API & Row Level Security (RLS) — SKYLINE Smart Residence

> Nguyên tắc:
> 1. **Mặc định từ chối (Default-Deny):** Mọi bảng trong schema `public` đều bật RLS (`ENABLE ROW LEVEL SECURITY`) và không có policy cho `anon`.
> 2. **Hai lớp bảo vệ:** Lớp 1 là `requireAuth(allowedRoles)` ở Route Handler (`401`/`403`); Lớp 2 là RLS trên PostgreSQL dựa vào `public.current_role()` và `public.current_apartment()` đọc từ `public.profiles` (không đọc `user_metadata`).
> 3. **Không tin dữ liệu từ client:** Không lấy `userId`, `role`, `apt_code` từ request body để quyết định quyền.

---

## 1. Ma Trận Quyền Theo Route Handler

| Route / Action | PUBLIC (Ẩn danh) | OWNER / TENANT | TECHNICIAN | RECEPTIONIST | ADMIN |
|---|---|---|---|---|---|
| `POST /api/user/login` | Cho phép (tạo phiên) | Cho phép | Cho phép | Cho phép | Cho phép |
| `POST /api/user/face-login` | Cho phép (rate limit IP, chỉ khớp `APPROVED`) | Cho phép | Cho phép | Cho phép | Cho phép |
| `GET/POST /api/user/logout` | Cho phép | Cho phép | Cho phép | Cho phép | Cho phép |
| `GET/POST /api/user` | `401` | Hồ sơ của mình | Hồ sơ của mình | Hồ sơ của mình | Hồ sơ của mình |
| `GET /api/user/card-token` | `401` | Token thẻ HMAC của mình (60s) | Token thẻ của mình | Token thẻ của mình | Token thẻ của mình |
| `POST /api/access/verify-card` | `401` | `403` | `403` | **Cho phép** (Quét thẻ cư dân) | **Cho phép** |
| `POST /api/facilities/verify` | `401` | `403` | `403` | **Cho phép** (Quét vé tiện ích) | **Cho phép** |
| `POST /api/user/updatePass` | `401` | Đổi MK của mình | Đổi MK của mình | Đổi MK của mình | Đổi MK của mình |
| `POST /api/user/updateInfo`, `updateAvatar`, `updateCccd` | `401` | Chỉ sửa của mình | Chỉ sửa của mình | Chỉ sửa của mình | Chỉ sửa của mình |
| `GET/POST /api/user/face-enroll` | `401` | Chỉ hồ sơ của mình (OWNER duyệt người nhà) | Chỉ hồ sơ của mình | Chỉ hồ sơ của mình | Toàn bộ |
| `POST /api/user/handover` | `401` | `403` | `403` | `403` | **Cho phép** (Bàn giao căn hộ) |
| `GET /api/tickets` | `401` | Chỉ căn hộ của mình | Chỉ phiếu được gán | Cho phép xem | Toàn bộ |
| `POST /api/tickets` (tạo mới) | `401` | Chỉ tạo cho căn hộ của mình | `403` | `403` | Cho phép |
| `POST /api/tickets` (`ASSIGN`, `ADMIN_REPLY`, `DELETE`) | `401` | `403` | `403` | `403` | **Cho phép** |
| `POST /api/tickets` (`RESOLVE`, `REJECT_RESOLUTION`) | `401` | `403` | Chỉ phiếu được gán cho mình | `403` | **Cho phép** |
| `DELETE /api/tickets` | `401` | `403` | `403` | `403` | **Cho phép** |
| `GET /api/billing` | `401` | Chỉ hóa đơn căn hộ của mình | `403` | `403` | Toàn bộ |
| `POST /api/billing/vnpay-create` | `401` | Chỉ thanh toán hóa đơn của mình | `403` | `403` | Cho phép |
| `POST /api/billing` (`CONFIRM_PAID`, `PUBLISH_ALL`) | `401` | `403` | `403` | `403` | **Cho phép** |
| `GET /api/billing/anomalies`, `POST /api/billing/debt-reminder`, `admin-report`, `ai-assistant` | `401` | `403` | `403` | `403` | **Cho phép** |
| `POST /api/billing/meter-ocr` | `401` | `403` | **Cho phép** | `403` | **Cho phép** |
| `POST /api/billing/explain` | `401` | Chỉ hóa đơn căn hộ của mình | `403` | `403` | Cho phép |
| `GET /api/apartments` | `401` | Cho phép xem | Cho phép xem | Cho phép xem | Toàn bộ |
| `POST/PATCH/DELETE /api/apartments` | `401` | `403` | `403` | `403` | **Cho phép** |
| `GET/POST/PATCH /api/community` | `401` | Cho phép | Cho phép | Cho phép | Cho phép |
| `DELETE /api/community` | `401` | `403` | `403` | `403` | **Cho phép** |
| `GET /api/devices` | `401` | Cho phép xem | Cho phép xem | Cho phép xem | Cho phép xem |
| `POST/PATCH/DELETE /api/devices` | `401` | `403` | **Cho phép** | `403` | **Cho phép** |
| `GET /api/security-alerts` | `401` | `403` | **Cho phép** | **Cho phép** | **Cho phép** |
| `POST /api/security-alerts` | `401` | `403` | **Cho phép** | `403` | **Cho phép** |
| `GET /api/parking` | `401` | Cho phép xem | Cho phép xem | Cho phép xem | Cho phép xem |
| `POST/PATCH /api/parking` | `401` | `403` | `403` | `403` | **Cho phép** |
| `GET/POST/DELETE /api/facilities/bookings`, `/api/resident-services`, `GET/POST /api/smarthome` | `401` | Chỉ căn hộ của mình | `403` | `403` | Toàn bộ |
| `GET /api/voting` | `401` | Cho phép xem | Cho phép xem | Cho phép xem | Toàn bộ |
| `POST /api/voting` (bỏ phiếu) | `401` | **Chỉ `OWNER`** (`TENANT` bị `403`) | `403` | `403` | `403` |
| `PATCH/DELETE /api/voting` | `401` | `403` | `403` | `403` | **Cho phép** |
| `POST /api/ai/concierge`, `community-assistant`, `ticket-assistant` | `401` | Cho phép | Cho phép | Cho phép | Cho phép |
| `POST /api/ai/ocr-cccd` | `401` | Cho phép | `403` | `403` | Cho phép |
| `GET /api/visitor` | `401` | Chỉ thẻ của căn hộ mình | `403` | Cho phép | Toàn bộ |
| `POST /api/visitor` (`GENERATE`/`CREATE`) | `401` | Chỉ tạo cho căn hộ của mình | `403` | `403` | Cho phép |
| `POST /api/visitor` (`VERIFY`, `CHECK_IN`, `CHECK_OUT`) | `401` | `403` | `403` | **Cho phép** | **Cho phép** |
| `GET/POST /api/ekyc` (`SUBMIT`, `CONFIRM_BY_OWNER`) | `401` | Chỉ của mình / căn hộ mình | `403` | `403` | Cho phép |
| `POST /api/ekyc` (`APPROVE`, `REJECT`) | `401` | `403` | `403` | `403` | **Cho phép** |
| `GET/POST /api/billing/vnpay-ipn`, `vnpay-return` | **Công khai** (bảo vệ bằng chữ ký VNPay HMAC-SHA512) | Công khai | Công khai | Công khai | Công khai |

---

## 2. Ma Trận RLS Theo Bảng (`public.*`)

- **ADMIN (`public.current_role() = 'ADMIN'`):** Toàn quyền (`ALL`) trên tất cả bảng nghiệp vụ.
- **TECHNICIAN:** `SELECT`/`UPDATE` trên `service_tickets` và `ticket_events` chỉ khi `assigned_technician_id = public.current_technician_id()`; `SELECT` trên `technicians` (dòng của mình) và bảng danh mục (`condominiums`, `blocks`, `floors`, `apartments`).
- **OWNER / TENANT:** Chỉ `SELECT`/`INSERT`/`UPDATE` các dòng thuộc `public.current_apartment()` (hoặc `auth.uid()`) trên: `apartments`, `apartment_members`, `bills`, `bill_details`, `meter_readings`, `service_tickets`, `ticket_events`, `smart_devices`, `smart_automation_rules`, `smart_guest_pins`, `smart_door_access_logs`, `facility_bookings`, `resident_service_bookings`, `visitor_passes`, `visitor_gate_logs`, `voting_records`, `ekyc_submissions`, `face_enrollments`, `parking_slots`, `ai_chat_conversations`, `ai_chat_messages`.
- **RECEPTIONIST:** `SELECT`/`UPDATE` trên `visitor_passes`, `visitor_gate_logs`, `facility_access_logs`.
- **Bảng danh mục dùng chung (`authenticated` chỉ được `SELECT`):** `condominiums`, `blocks`, `floors`, `facilities`, `community_posts`, `voting_topics`, `voting_options`, `surveys`.

# Bảng Đối Chiếu Schema TypeScript (`lib/db/schema.ts`) & PostgreSQL (`database/skyline_smart_residence_schema.sql`)

> Trạng thái: **Khớp 100%** (0 dòng lệch). Mọi enum, khóa ngoại (FK), kiểu dữ liệu, và bảng bổ sung đều đã được đồng bộ.

---

## 1. Bảng Tổng Hợp Đối Chiếu Entity <-> Table

| STT | TypeScript (`lib/db/schema.ts`) | PostgreSQL (`skyline_smart_residence_schema.sql`) | Trạng thái | Ghi chú |
|---:|---|---|---:|---|
| 1 | `CondominiumRecord` | `condominiums` | Khớp 100% | PK `id`, UNIQUE `condo_code` |
| 2 | `BlockRecord` | `blocks` | Khớp 100% | FK `condo_id -> condominiums(id)` |
| 3 | `FloorRecord` | `floors` | Khớp 100% | CHECK `floor_type`, FK `condo_id -> condominiums(id)` |
| 4 | `ApartmentRecord` | `apartments` | Khớp 100% | `TowerId` mở rộng `'BS-07'..'BS-10' \| 'A' \| 'B'`; `wing` có `'EAST'`; `status` chuẩn enum; fix `handover_protocol`; thêm `vehicles JSONB` |
| 5 | `UserRecord` | `users` | Khớp 100% | CHECK `role`, `gender`, `relationship`; FK `apartment_code -> apartments(apt_code)` (nullable cho nhân sự) |
| 6 | `ApartmentMemberRecord` | `apartment_members` | Khớp 100% | Bổ sung `email`, `id_date`, `id_place`, `dob`, `gender`, `pob`, `vehicle_type`, đổi `added_date` -> `created_at` |
| 7 | `TechnicianRecord` | `technicians` | Khớp 100% | FK `user_id -> users(id)`, CHECK `status` |
| 8 | `EkycSubmissionRecord` | `ekyc_submissions` | Khớp 100% | Thêm mới bảng SQL, FK `user_id`, `apartment_code`, CHECK `status` |
| 9 | `FaceEnrollmentRecord` | `face_enrollments` | Khớp 100% | Thêm mới bảng SQL, PK/FK `user_id`, FK `apartment_code`, CHECK `status` |
| 10 | `SmartDeviceRecord` | `smart_devices` | Khớp 100% | `status` hỗ trợ `'open' \| 'closed'` cho rèm cửa |
| 11 | `SmartAutomationRuleRecord` | `smart_automation_rules` | Khớp 100% | CHECK `trigger_type`, FK `apartment_code` |
| 12 | `SmartGuestPinRecord` | `smart_guest_pins` | Khớp 100% | CHECK `status`, FK `apartment_code` |
| 13 | `SmartDoorAccessLogRecord` | `smart_door_access_logs` | Khớp 100% | Đồng bộ enum `method` & `status` |
| 14 | `FacilityRecord` | `facilities` | Khớp 100% | CHECK `category`, FK `floor_number -> floors(floor_number)` |
| 15 | `FacilityBookingRecord` | `facility_bookings` | Khớp 100% | CHECK `status` gồm `CONFIRMED, PENDING, CHECKED_IN, CANCELLED` |
| 16 | `ResidentServiceBookingRecord` | `resident_service_bookings` | Khớp 100% | Thêm mới bảng SQL (map camelCase TS <-> snake_case SQL), FK `apt_code` |
| 17 | `VisitorPassRecord` | `visitor_passes` | Khớp 100% | CHECK `entry_type`, `status`, FK `apartment_code`, `host_user_id` |
| 18 | `VisitorGateLogRecord` | `visitor_gate_logs` | Khớp 100% | CHECK `action`, `result` (thêm `'DENIED'`), FK `pass_id`, `apartment_code` |
| 19 | `BillRecord` | `bills` | Khớp 100% | Bổ sung `payment_method`, `transaction_ref`, `invoice_pdf_url` |
| 20 | `MeterReadingRecord` | `meter_readings` | Khớp 100% | Thêm mới bảng SQL, CHECK `meter_type`, `status`, FK `apartment_code` |
| 21 | `ServiceTicketRecord` | `service_tickets` | Khớp 100% | Fix `after_image TEXT`; `ticket_type` dùng `'SERVICE'`; bổ sung `ticket_type_label`, `ai_dispatch_reason`, `updated_at` |
| 22 | `CommunityPostRecord` | `community_posts` | Khớp 100% | Bổ sung `avatar_url`, CHECK `ai_moderation` |
| 23 | `VotingTopicRecord` | `voting_topics` | Khớp 100% | CHECK `legal_type`, `status` |
| 24 | `VotingRecordItem` | `voting_records` | Khớp 100% | Bổ sung `user_id`, UNIQUE `(topic_id, apartment_code)` |
| 25 | *(DB-only audit log)* | `ticket_events` | Migration mới (`20261125010000`) | Lưu lịch sử chuyển trạng thái `service_tickets` |
| 26 | *(Auth profile mapping)* | `profiles` | Migration (`20261125020000`) | Ánh xạ `auth.users(id)` -> `role`, `apartment_code`, `user_id` |
| 27 | *(Rate limit store)* | `rate_limits` | Migration (`20261125090000`) | Chống brute-force đăng nhập / FaceID |
| 28 | `ParkingSlotRecord` (`lib/server/parkingDb.ts`) | `parking_slots` | Khớp 100% | Dùng trực tiếp qua `/api/parking` |
| 29 | *(Device telemetry)* | `building_devices` | Migration (`20261125110000`) | Dùng trực tiếp qua `/api/devices` |
| 30 | *(Security alert feed)* | `security_alerts` | Migration (`20261125110000`) | Dùng trực tiếp qua `/api/security-alerts` |

> **Nguồn sự thật SQL:** Đã hợp nhất về `supabase/migrations/` và `supabase/seed.sql`. Thư mục `database/*.sql` chỉ còn ghi chú trỏ về `supabase/migrations/`.

---

## 2. Các Bảng SQL Có Sẵn Nhưng Code TypeScript Chưa Dùng Trực Tiếp (`-- chưa dùng`)

| Bảng SQL | Vai trò / Ghi chú |
|---|---|
| `bill_details` | chưa dùng trực tiếp như `DatabaseTable` riêng (đang nhúng trong `BillRecord.details` ở `lib/db/schema.ts`) |
| `voting_options` | chưa dùng trực tiếp như `DatabaseTable` riêng (đang nhúng trong `VotingTopicRecord.options` ở `lib/db/schema.ts`) |
| `facility_access_logs` | chưa dùng trong code TypeScript |
| `ai_chat_conversations` | chưa dùng trong code TypeScript |
| `ai_chat_messages` | chưa dùng trong code TypeScript |

---

## 3. Chi Tiết Các Lệch Đã Sửa

1. **`TowerId` & `tower_code`:** Cập nhật `TowerId` trong `lib/db/schema.ts` (và re-export tại `lib/apartmentStore.ts`) thành `'BS-07' | 'BS-08' | 'BS-09' | 'BS-10' | 'A' | 'B'`, khớp với `CHECK (tower_code IN ('BS-07', 'BS-08', 'BS-09', 'BS-10', 'A', 'B'))` trong `apartments`.
2. **Lỗi cú pháp SQL trong `skyline_smart_residence_schema.sql`:**
   - `apartments.handover_protocol`: sửa `VARCHAR(100) INT` -> `VARCHAR(100)`.
   - `service_tickets.after_image`: sửa `TEXT INT` -> `TEXT`.
3. **Bảng thiếu trong SQL:** Bổ sung `ekyc_submissions`, `face_enrollments`, `meter_readings`, và `resident_service_bookings` kèm đầy đủ FK, `CHECK` constraints và `INDEX`.
4. **Enum & CHECK constraints:**
   - `apartments.status`: đồng bộ sang `'OCCUPIED' | 'VACANT' | 'MAINTENANCE' | 'HANDOVER_PENDING'`.
   - `apartments.wing`: thêm `'EAST'`.
   - `service_tickets.ticket_type`: sửa `'SERVICE_REQUEST'` -> `'SERVICE'`.
   - `facility_bookings.status`: thêm `'PENDING'`.
   - `visitor_gate_logs.result`: thêm `'DENIED'`.
   - `smart_devices.status` (TS) & `smart_door_access_logs.method` (TS): mở rộng khớp dữ liệu thực tế.
5. **Thứ tự khóa ngoại trong `seed_data.sql`:**
   - Chèn `apartments` với `owner_id = NULL`, sau đó chèn `users` (nhân sự BQL/KTV/Lễ tân để `apartment_code = NULL`), rồi `UPDATE apartments SET owner_id = ...`.
   - Sửa `assigned_technician_id` trong `service_tickets` từ `'user-tech-1'`/`'user-tech-2'` sang `'KTV-01'`/`'KTV-02'` (khớp FK `technicians(id)`).
   - Loại bỏ các câu lệnh `INSERT` trùng lặp khỏi `skyline_smart_residence_schema.sql` để `seed_data.sql` chạy sạch ngay sau schema.

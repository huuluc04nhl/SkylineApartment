# Tiến Độ Tách Client / Server & Bảo Vệ `server-only` — SKYLINE Smart Residence

> Kiểm tra bundle client (`.next/static`): **0** tham chiếu tới `service_role` / `SERVICE_ROLE`.
> Toàn bộ mã dùng `SUPABASE_SERVICE_ROLE_KEY` (`lib/supabase/admin.ts`, `lib/server/*`, `lib/auth/guard.ts`, `lib/env.ts`) đều có `import 'server-only'` và chỉ chạy trong Route Handlers / Server Components.

---

## 1. Kiến Trúc Hiện Tại

- **Server-only (`import 'server-only'`):**
  - `lib/supabase/admin.ts` (`supabaseAdmin`)
  - `lib/server/auth.ts` (`getAuthenticatedUser`)
  - `lib/server/ticketDb.ts` (`service_tickets`, `technicians`)
  - `lib/server/billingDb.ts` (`bills`, `bill_details`, `meter_readings`)
  - `lib/auth/guard.ts` (`requireAuth`)
  - `lib/env.ts` (`getServerEnv`)
- **Client-safe (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + RLS):**
  - `lib/supabase/browser.ts` (`createSupabaseBrowserClient`)
  - `lib/skylineApiClient.ts` & các hàm `*Async` / `sync*FromDb` trong `lib/ticketStore.ts`, `lib/facilityStore.ts`, `lib/smartHomeStore.ts`, `lib/residentServiceStore.ts` gọi `/api/*`.

---

## 2. Phân Loại 48 File `"use client"` Đang Import `lib/*Store.ts`

### Nhóm A — Chỉ import Type / Hằng UI hoặc gọi API / Realtime (Đã an toàn)
1. `app/page.tsx` (`UserRole` type)
2. `app/portal/page.tsx` (`UserRole` type)
3. `app/portal/vnpay-gateway/page.tsx` (`generateVietQrUrl`, `SKYLINE_BANK_INFO`)
4. `app/visitor-pass/page.tsx` (`GeneratedVisitorPass` type)
5. `components/landing/AmenitiesSection.tsx` (`DEMO_FACILITIES`, `Facility`)
6. `components/landing/HeroSection.tsx` (`UserRole` type)
7. `components/portal/Sidebar.tsx` (`UserRole` type)
8. `components/portal/Topbar.tsx` (`UserRole`, `User` types)
9. `components/portal/admin/DebtReminderModal.tsx` (`Bill` type; gọi `/api/billing/debt-reminder`)
10. `components/portal/admin/TowerCollectionSummaryCard.tsx` (`Bill` type)
11. `components/portal/resident/CostForecastCard.tsx` (`Bill` type)
12. `components/portal/shared/AccountPasswordModal.tsx` (`User` type; gọi `/api/user/updatePass`)
13. `components/portal/shared/AccountPasswordSection.tsx` (`User` type; gọi `/api/user/updatePass`)
14. `components/portal/admin/building-manager/*` (5 file chỉ import `ApartmentUnit` type) & `models/CadFloorplanSvgModel.tsx` (`ApartmentUnit` type)
15. `components/portal/resident/FacilityBook.tsx` & `SmartFacilityPass.tsx` (đã đồng bộ `/api/facilities/bookings` + Supabase Realtime `facility_bookings`)
16. `components/portal/resident/ResidentServices.tsx` (đã đồng bộ `/api/resident-services`)
17. `components/portal/resident/SmartHomeHub.tsx` & `ResidentApartmentModal.tsx` (đã đồng bộ `/api/smarthome`)

### Nhóm B — Đang chuyển dần từ Store đồng bộ sang API (Cần hoàn tất ở bước dọn `skylineDb` cuối cùng)
- **Tickets:** `components/portal/admin/KanbanBoard.tsx`, `DeviceHealth.tsx`, `components/portal/resident/TicketService.tsx` (đã có `syncTicketsWithServer` / `createTicketAsync` / `updateTicketApiAsync` qua `/api/tickets`; còn một số lời gọi đồng bộ fallback).
- **Billing:** `components/portal/admin/BillingStudio.tsx`, `components/portal/resident/FinanceBilling.tsx`, `SmartPaymentReminderBanner.tsx` (đã gọi `/api/billing`, `/api/billing/explain`, `/api/billing/vnpay-create`; còn `getBills` đồng bộ).
- **Users / Family / eKYC:** `components/portal/resident/FamilyMembers.tsx`, `ProfileEkyc.tsx`, `components/portal/admin/EkycApproval.tsx`, `AssignResidentModal.tsx`, `ApartmentDetailModal.tsx` (đã gọi `/api/user/family`, `/api/ekyc`, `/api/user/handover`; còn một số hàm đọc đồng bộ).
- **Apartments / Visitors / Voting / Concierge:** `AdminBuildingApartmentManager.tsx`, `AddApartmentModal.tsx`, `EditApartmentModal.tsx`, `SmartParking.tsx`, `AdminDashboard.tsx`, `AdminVisitorControl.tsx`, `VisitorQrModal.tsx`, `SurveysVoting.tsx`, `ResidentHome.tsx`, `ResidentHandbook.tsx`, `ResidentAllServicesModal.tsx`, `ResidentSmartCard.tsx`, `AiConciergePage.tsx`, `AiConciergeFloating.tsx`.

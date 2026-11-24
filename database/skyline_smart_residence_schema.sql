-- ============================================================================
-- CHUNG CƯ CAO CẤP SKYLINE SMART RESIDENCE & THE TROPICAL (BEVERLY SOLARI)
-- HỆ CƠ SỞ DỮ LIỆU POSTGRESQL CHUẨN MỰC TOÀN DIỆN (DDL + DML + ANALYTIC VIEWS)
-- Đồng bộ 100% dữ liệu thực tế từ codebase:
-- - Cư dân & Ban Quản Lý (userStore.ts, dataStore.ts)
-- - Căn hộ & Khối nhà (apartmentStore.ts, skylineProjectService.ts)
-- - Kỹ thuật viên & Phiếu bảo trì phân loại AI/BQL/KTV (ticketStore.ts, ticketClassification.ts)
-- - Thiết bị Smart Home, Kịch bản tự động hóa & Khóa cửa FaceID (smartHomeStore.ts)
-- - Quản lý Khách thăm QR & Nhật ký an ninh (visitorStore.ts)
-- - Hóa đơn dịch vụ & Phát hiện rò rỉ nước AI (billingStore.ts, dataStore.ts)
-- - Biểu quyết & Lấy ý kiến cư dân hợp pháp (votingStore.ts)
-- ============================================================================

-- Bật extension hỗ trợ UUID nếu cần
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- XÓA BẢNG VÀ VIEW CŨ THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI
-- ============================================================================
DROP VIEW IF EXISTS v_apartment_billing_overview CASCADE;
DROP VIEW IF EXISTS v_ticket_classification_analytics CASCADE;
DROP VIEW IF EXISTS v_technician_payroll_report CASCADE;

DROP TABLE IF EXISTS ai_chat_messages CASCADE;
DROP TABLE IF EXISTS ai_chat_conversations CASCADE;
DROP TABLE IF EXISTS voting_records CASCADE;
DROP TABLE IF EXISTS voting_options CASCADE;
DROP TABLE IF EXISTS voting_topics CASCADE;
DROP TABLE IF EXISTS survey_votes CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS bill_details CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS visitor_gate_logs CASCADE;
DROP TABLE IF EXISTS visitor_passes CASCADE;
DROP TABLE IF EXISTS facility_access_logs CASCADE;
DROP TABLE IF EXISTS facility_bookings CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS parking_slots CASCADE;
DROP TABLE IF EXISTS service_tickets CASCADE;
DROP TABLE IF EXISTS technicians CASCADE;
DROP TABLE IF EXISTS smart_door_access_logs CASCADE;
DROP TABLE IF EXISTS smart_guest_pins CASCADE;
DROP TABLE IF EXISTS smart_automation_rules CASCADE;
DROP TABLE IF EXISTS smart_devices CASCADE;
DROP TABLE IF EXISTS face_enrollments CASCADE;
DROP TABLE IF EXISTS ekyc_submissions CASCADE;
DROP TABLE IF EXISTS apartment_members CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;
DROP TABLE IF EXISTS floors CASCADE;
DROP TABLE IF EXISTS condominiums CASCADE;

-- ============================================================================
-- 1. BẢNG THÔNG TIN TỔNG THỂ DỰ ÁN CHUNG CƯ (CONDOMINIUMS)
-- ============================================================================
CREATE TABLE condominiums (
    id SERIAL PRIMARY KEY,
    condo_code VARCHAR(50) UNIQUE NOT NULL DEFAULT 'SKYLINE_RESIDENCE',
    condo_name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    total_floors INT NOT NULL DEFAULT 25,
    basement_floors INT NOT NULL DEFAULT 2,
    total_apartments INT NOT NULL DEFAULT 240,
    investor VARCHAR(150) NOT NULL,
    management_company VARCHAR(150) NOT NULL,
    hotline VARCHAR(50) DEFAULT '1900 8899',
    handover_year INT DEFAULT 2026,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE condominiums IS 'Thông tin pháp lý và quy chuẩn của Dự án Chung Cư Skyline Smart Residence';

-- ============================================================================
-- 2. BẢNG KHỐI NHÀ / TÒA NHÀ (BLOCKS) - Đồng bộ Skyline Smart Residence API
-- ============================================================================
CREATE TABLE blocks (
    id INT PRIMARY KEY, -- 880, 883, 886, 889 (skyline ID)
    condo_id INT NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
    block_code VARCHAR(30) UNIQUE NOT NULL, -- BS-07, BS-08, BS-09, BS-10
    block_name VARCHAR(150) NOT NULL,
    total_floors INT NOT NULL DEFAULT 34,
    manager_name VARCHAR(150) DEFAULT 'VinHomes Manager',
    manager_phone VARCHAR(20) DEFAULT '0901888999',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE blocks IS 'Khối nhà/tòa chung cư theo chuẩn dữ liệu Skyline Smart Residence API (The Tropical BS-07 đến BS-10)';

-- ============================================================================
-- 3. BẢNG MẶT BẰNG TẦNG (FLOORS) - TRỌN BỘ 25 TẦNG NỔI & 2 TẦNG HẦM
-- ============================================================================
CREATE TABLE floors (
    floor_number INT PRIMARY KEY, -- -2: Hầm B2, -1: Hầm B1, 1..25: Tầng 1 đến 25
    floor_code VARCHAR(20) UNIQUE NOT NULL, -- B2, B1, T1, T2, ..., T12A, ..., T25
    floor_name VARCHAR(150) NOT NULL,
    floor_type VARCHAR(50) NOT NULL CHECK (floor_type IN ('BASEMENT', 'COMMERCIAL_AMENITY', 'RESIDENTIAL', 'ROOFTOP_AMENITY')),
    floor_function TEXT NOT NULL,
    units_count INT DEFAULT 0,
    condo_id INT NOT NULL REFERENCES condominiums(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE floors IS 'Sườn dữ liệu chuẩn xác trọn bộ 25 tầng nổi và 2 tầng hầm của chung cư';

-- ============================================================================
-- 4. BẢNG CĂN HỘ CHUNG CƯ (APARTMENTS)
-- ============================================================================
CREATE TABLE apartments (
    id VARCHAR(50) PRIMARY KEY, -- apt-ch06, apt-ch01, apt-25ph01
    apt_code VARCHAR(30) UNIQUE NOT NULL, -- CH-06, CH-01, CH-08, 25PH-01...
    block_id INT REFERENCES blocks(id) ON DELETE SET NULL,
    tower_code VARCHAR(20) DEFAULT 'A', -- Tháp A, Tháp B
    floor_number INT NOT NULL REFERENCES floors(floor_number) ON DELETE RESTRICT,
    wing VARCHAR(20) DEFAULT 'SOUTH' CHECK (wing IN ('NORTH', 'SOUTH', 'WEST', 'CENTRAL')),
    apt_type VARCHAR(30) NOT NULL CHECK (apt_type IN ('STUDIO', '1PN', '2PN', '3PN', 'DUPLEX_PENTHOUSE')),
    type_label VARCHAR(100) NOT NULL,
    wall_area NUMERIC(6, 2) NOT NULL, -- Diện tích tim tường (m2)
    clear_area NUMERIC(6, 2) NOT NULL, -- Diện tích thông thủy (m2)
    bedrooms INT NOT NULL DEFAULT 2,
    bathrooms INT NOT NULL DEFAULT 2,
    balcony_direction VARCHAR(100) DEFAULT 'Đông Nam',
    main_door_direction VARCHAR(100) DEFAULT 'Tây Bắc',
    price_billion NUMERIC(6, 2) NOT NULL,
    price_vnd NUMERIC(15, 2) NOT NULL,
    legal_status VARCHAR(50) DEFAULT 'Pink_Book', -- Sổ hồng / SPA
    status VARCHAR(50) DEFAULT 'Đã bàn giao' CHECK (status IN ('Đã bàn giao', 'Đang trống', 'Đang bảo trì', 'Đang nghiệm thu')),
    owner_id VARCHAR(50), -- Khóa ngoại trỏ về users(id)
    handover_date DATE,
    handover_protocol VARCHAR(100) INT, -- ID định danh từ skyline API
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE apartments IS 'Thông tin chi tiết các căn hộ chung cư phân bổ từ tầng 5 đến tầng 25';

-- ============================================================================
-- 5. BẢNG TÀI KHOẢN NGƯỜI DÙNG & CƯ DÂN (USERS)
-- ============================================================================
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY, -- user-owner-1, user-manager-1, user-tech-1...
    username VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'OWNER', 'TENANT', 'TECHNICIAN', 'RECEPTIONIST')),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) DEFAULT '12345678',
    id_card_no VARCHAR(20), -- CCCD gắn chip 12 chữ số
    id_date DATE,
    id_place VARCHAR(150),
    dob DATE,
    pob VARCHAR(150),
    gender SMALLINT DEFAULT 1 CHECK (gender IN (0, 1)), -- 1: Nam, 0: Nữ
    avatar_url TEXT,
    license_plate VARCHAR(30),
    apartment_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE SET NULL,
    relationship VARCHAR(50) DEFAULT 'Owner', -- Owner, Family, Tenant, Staff
    emergency_phone VARCHAR(20),
    face_vector TEXT, -- Vector nhận diện FaceID
    ekyc_approved BOOLEAN DEFAULT TRUE,
    ui_language VARCHAR(10) DEFAULT 'vi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Quản lý tài khoản cư dân, chủ hộ, ban quản lý, kỹ thuật viên và lễ tân';

-- Thiết lập ràng buộc khóa ngoại chủ sở hữu từ apartments về users
ALTER TABLE apartments ADD CONSTRAINT fk_apartment_owner 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- 6. BẢNG THÀNH VIÊN GIA ĐÌNH CĂN HỘ (APARTMENT_MEMBERS)
-- ============================================================================
CREATE TABLE apartment_members (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    id_card VARCHAR(20),
    relationship VARCHAR(100) NOT NULL, -- 'Em trai', 'Vợ', 'Chồng', 'Con', 'Người thân'
    role VARCHAR(30) DEFAULT 'Family',
    license_plate VARCHAR(30),
    face_status VARCHAR(50) DEFAULT 'Đã xác thực',
    avatar_url TEXT,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE apartment_members IS 'Thành viên cùng sinh sống và đăng ký thường trú trong căn hộ';

-- ============================================================================
-- 7. BẢNG HỒ SƠ & BẢNG LƯƠNG KỸ THUẬT VIÊN (TECHNICIANS) - ticketStore.ts
-- ============================================================================
CREATE TABLE technicians (
    id VARCHAR(30) PRIMARY KEY, -- KTV-01, KTV-02, KTV-03
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    specialty VARCHAR(150) NOT NULL, -- Cơ Điện & Nước, Điện Lạnh, Vệ Sinh...
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 8500000, -- Lương cơ bản tháng
    pay_per_ticket NUMERIC(12, 2) NOT NULL DEFAULT 150000, -- Tiền công/phiếu
    bonus_per_fivestar NUMERIC(12, 2) NOT NULL DEFAULT 50000, -- Thưởng 5 sao/phiếu
    status VARCHAR(30) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BUSY', 'OFF_DUTY')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE technicians IS 'Hồ sơ nhân sự kỹ thuật tòa nhà và cơ chế tính lương thù lao theo ca sửa';

-- ============================================================================
-- 8. BẢNG THIẾT BỊ NHÀ THÔNG MINH IOT (SMART_DEVICES) - smartHomeStore.ts
-- ============================================================================
CREATE TABLE smart_devices (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('light', 'ac', 'door', 'curtain', 'sensor')),
    status VARCHAR(50) NOT NULL DEFAULT 'off',
    set_value NUMERIC(5, 1) DEFAULT 0, -- Giá trị thiết lập (24°C, v.v.)
    location_x NUMERIC(5, 2) DEFAULT 0,
    location_y NUMERIC(5, 2) DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE smart_devices IS 'Hệ sinh thái thiết bị IoT thông minh trong căn hộ';

-- ============================================================================
-- 9. BẢNG KỊCH BẢN TỰ ĐỘNG HÓA THÔNG MINH (SMART_AUTOMATION_RULES)
-- ============================================================================
CREATE TABLE smart_automation_rules (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    trigger_time VARCHAR(50) NOT NULL,
    trigger_type VARCHAR(30) NOT NULL CHECK (trigger_type IN ('TIME', 'SENSOR', 'CLIMATE')),
    trigger_label VARCHAR(150) NOT NULL,
    description TEXT,
    action_summary TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    repeat_days VARCHAR(100) DEFAULT 'Hàng ngày',
    icon VARCHAR(30) DEFAULT 'sun',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE smart_automation_rules IS 'Các kịch bản tự động hóa thông minh (Bình minh, Hoàng hôn, Khóa đêm, Rò rỉ nước AI)';

-- ============================================================================
-- 10. BẢNG MÃ PIN TẠM THỜI MỞ CỬA CHO KHÁCH (SMART_GUEST_PINS)
-- ============================================================================
CREATE TABLE smart_guest_pins (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    pin_code VARCHAR(10) NOT NULL,
    label VARCHAR(150) NOT NULL,
    created_by VARCHAR(150) DEFAULT 'Chủ Hộ (Master)',
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
    max_uses INT DEFAULT 5,
    used_count INT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE smart_guest_pins IS 'Mã PIN OTP tạm thời cấp cho khách vào căn hộ';

-- ============================================================================
-- 11. BẢNG NHẬT KÝ MỞ KHÓA THÔNG MINH (SMART_DOOR_ACCESS_LOGS)
-- ============================================================================
CREATE TABLE smart_door_access_logs (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'Chủ hộ',
    method VARCHAR(30) NOT NULL CHECK (method IN ('FACE_ID', 'PIN_OTP', 'NFC_CARD', 'REMOTE_APP', 'PHYSICAL_KEY', 'AUTO_LOCK')),
    status VARCHAR(30) NOT NULL CHECK (status IN ('SUCCESS', 'DENIED')),
    detail TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE smart_door_access_logs IS 'Lịch sử mở cửa căn hộ bằng FaceID, PIN hoặc App di động';

-- ============================================================================
-- 12. BẢNG BÃI ĐỖ XE THÔNG MINH (PARKING_SLOTS)
-- ============================================================================
CREATE TABLE parking_slots (
    id VARCHAR(50) PRIMARY KEY,
    slot_code VARCHAR(30) UNIQUE NOT NULL, -- Ô B2-A15, Khu B1-M88
    floor_number INT NOT NULL REFERENCES floors(floor_number) ON DELETE RESTRICT,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORCYCLE')),
    apartment_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE SET NULL,
    assigned_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    assigned_license_plate VARCHAR(30),
    rfid_card_code VARCHAR(50) UNIQUE,
    status VARCHAR(30) DEFAULT 'OCCUPIED' CHECK (status IN ('VACANT', 'OCCUPIED', 'RESERVED')),
    monthly_fee NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE parking_slots IS 'Vị trí đỗ xe định danh tại 2 tầng hầm B1 và B2 của chung cư';

-- ============================================================================
-- 13. BẢNG 5 TIỆN ÍCH 5 SAO CHUNG CƯ (FACILITIES)
-- ============================================================================
CREATE TABLE facilities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Hồ bơi', 'Gym', 'Xông hơi', 'Khu trẻ em', 'BBQ')),
    floor_number INT NOT NULL REFERENCES floors(floor_number) ON DELETE RESTRICT,
    location_detail VARCHAR(150) NOT NULL,
    operating_hours VARCHAR(50) NOT NULL,
    pricing VARCHAR(150) NOT NULL,
    max_quota_per_month INT DEFAULT 20,
    rating_score NUMERIC(3, 1) DEFAULT 5.0,
    current_occupancy INT DEFAULT 0,
    max_capacity INT DEFAULT 40,
    hero_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE facilities IS 'Danh mục 5 đại tiện ích 5 sao độc quyền của chung cư Skyline';

-- ============================================================================
-- 14. BẢNG ĐẶT CHỖ TIỆN ÍCH (FACILITY_BOOKINGS)
-- ============================================================================
CREATE TABLE facility_bookings (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    facility_id VARCHAR(50) NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    booker_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    booker_name VARCHAR(150) NOT NULL,
    ticket_code VARCHAR(100) UNIQUE NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(100) NOT NULL,
    guest_count INT DEFAULT 1,
    duration_hours INT DEFAULT 1,
    deposit_amount NUMERIC(15, 2) DEFAULT 0,
    pricing VARCHAR(100),
    payment_method VARCHAR(100),
    status VARCHAR(30) DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CHECKED_IN', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE facility_bookings IS 'Sổ vé điện tử đặt chỗ tiện ích riêng tư (Xông hơi VIP, BBQ Panorama)';

-- ============================================================================
-- 15. BẢNG LỊCH SỬ VÀO TIỆN ÍCH (FACILITY_ACCESS_LOGS)
-- ============================================================================
CREATE TABLE facility_access_logs (
    id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    apartment_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(50),
    method VARCHAR(30) NOT NULL CHECK (method IN ('NFC_CARD', 'FACE_ID')),
    card_uid VARCHAR(100),
    status VARCHAR(30) NOT NULL CHECK (status IN ('SUCCESS', 'DENIED')),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

COMMENT ON TABLE facility_access_logs IS 'Nhật ký nhận diện FaceID hoặc quẹt thẻ từ vào cổng tiện ích';

-- ============================================================================
-- 16. BẢNG THẺ KHÁCH THĂM (VISITOR_PASSES) - visitorStore.ts
-- ============================================================================
CREATE TABLE visitor_passes (
    id VARCHAR(50) PRIMARY KEY, -- SKY-PASS-8492, SKY-PASS-6521
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    host_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    host_name VARCHAR(150) NOT NULL,
    host_phone VARCHAR(20) NOT NULL,
    tower_name VARCHAR(100) DEFAULT 'Tropical BS-07',
    visitor_name VARCHAR(150) NOT NULL,
    visitor_phone VARCHAR(20),
    license_plate VARCHAR(30),
    entry_type VARCHAR(20) DEFAULT 'SINGLE' CHECK (entry_type IN ('SINGLE', 'MULTI')),
    purpose VARCHAR(50) DEFAULT 'VISITOR',
    purpose_label VARCHAR(150) DEFAULT 'Khách Thăm Căn Hộ',
    valid_hours INT DEFAULT 4,
    qr_data TEXT NOT NULL,
    pin_code VARCHAR(10) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CHECKED_IN', 'COMPLETED', 'EXPIRED')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    checked_in_at VARCHAR(100),
    checked_out_at VARCHAR(100)
);

COMMENT ON TABLE visitor_passes IS 'Thẻ khách thăm cấp mã QR và PIN mở cổng thang máy tự động';

-- ============================================================================
-- 17. BẢNG NHẬT KÝ RA VÀO CỔNG KHÁCH (VISITOR_GATE_LOGS)
-- ============================================================================
CREATE TABLE visitor_gate_logs (
    id VARCHAR(50) PRIMARY KEY,
    pass_id VARCHAR(50) REFERENCES visitor_passes(id) ON DELETE SET NULL,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    host_name VARCHAR(150),
    visitor_name VARCHAR(150),
    license_plate VARCHAR(30),
    action VARCHAR(30) NOT NULL CHECK (action IN ('SCAN', 'CHECK_IN', 'CHECK_OUT')),
    result VARCHAR(30) NOT NULL CHECK (result IN ('VALID', 'INVALID', 'EXPIRED')),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checkpoint VARCHAR(100) DEFAULT 'Sảnh Lễ Tân / Chốt An Ninh',
    notes TEXT
);

COMMENT ON TABLE visitor_gate_logs IS 'Nhật ký kiểm soát an ninh khách đến thăm căn hộ';

-- ============================================================================
-- 18. BẢNG HÓA ĐƠN DỊCH VỤ SINH HOẠT (BILLS) - dataStore.ts
-- ============================================================================
CREATE TABLE bills (
    id VARCHAR(50) PRIMARY KEY, -- bill-2026-08-12a05
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    owner_name VARCHAR(150) NOT NULL,
    billing_month VARCHAR(30) NOT NULL, -- Tháng 08/2026
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Unpaid' CHECK (status IN ('Draft', 'Unpaid', 'Partial', 'Paid', 'Overdue')),
    payment_qr_url TEXT,
    has_ai_anomaly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE bills IS 'Hóa đơn tổng hợp điện, nước, phí quản lý, gửi xe và internet hàng tháng';

-- ============================================================================
-- 19. BẢNG CHI TIẾT DỊCH VỤ HÓA ĐƠN (BILL_DETAILS) - dataStore.ts
-- ============================================================================
CREATE TABLE bill_details (
    id VARCHAR(50) PRIMARY KEY,
    bill_id VARCHAR(50) NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL, -- Electricity, Water, Management_Fee, Parking, Internet
    service_name VARCHAR(150) NOT NULL,
    usage NUMERIC(10, 2), -- kWh, m3, m2, số lượng xe
    unit VARCHAR(30) DEFAULT 'lần', -- kWh, m³, m², xe, tháng
    unit_price NUMERIC(12, 2),
    total_line_amount NUMERIC(15, 2) NOT NULL,
    ai_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_reason TEXT
);

COMMENT ON TABLE bill_details IS 'Bóc tách chi tiết từng dòng dịch vụ và cảnh báo AI phát hiện rò rỉ nước';

-- ============================================================================
-- 20. BẢNG PHIẾU BÁO HỎNG & KỸ THUẬT (SERVICE_TICKETS) - ticketStore.ts
-- Phân loại mục đích rõ ràng: REPAIR (KTV) | INQUIRY (AI 24/7) | FEEDBACK (BQL)
-- ============================================================================
CREATE TABLE service_tickets (
    id VARCHAR(50) PRIMARY KEY, -- TICK-102, TICK-099, TICK-INQ-01, TICK-FB-01
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    resident_name VARCHAR(150) NOT NULL,
    resident_phone VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    ai_category VARCHAR(50) NOT NULL CHECK (ai_category IN ('Điện', 'Nước', 'Vệ sinh', 'An ninh', 'Khác')),
    ai_priority INT DEFAULT 2 CHECK (ai_priority IN (1, 2, 3)), -- 1: Khẩn cấp, 2: Tiêu chuẩn, 3: Bình thường
    priority_color VARCHAR(20) DEFAULT '#D97706',
    sla_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Assigned', 'In_Progress', 'Resolved')),
    
    -- Phân loại đối tượng xử lý
    ticket_type VARCHAR(50) NOT NULL DEFAULT 'REPAIR' CHECK (ticket_type IN ('REPAIR', 'INQUIRY', 'FEEDBACK', 'SERVICE_REQUEST')),
    handled_by VARCHAR(50) NOT NULL DEFAULT 'TECHNICIAN' CHECK (handled_by IN ('AI', 'MANAGEMENT', 'TECHNICIAN')),
    
    -- Phản hồi tự động bằng AI (dành cho câu hỏi, quy chế)
    ai_reply TEXT,
    ai_replied_at TIMESTAMP WITH TIME ZONE,

    -- Phản hồi của Ban Quản Lý (dành cho phản ánh, khiếu nại)
    admin_reply TEXT,
    admin_replied_at TIMESTAMP WITH TIME ZONE,
    admin_replied_by VARCHAR(150) DEFAULT 'Ban Quản Lý Chung Cư Skyline',

    -- Kỹ thuật hiện trường (dành cho sự cố sửa chữa)
    assigned_technician_id VARCHAR(30) REFERENCES technicians(id) ON DELETE SET NULL,
    assigned_technician_name VARCHAR(150),
    assigned_technician_phone VARCHAR(20),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    resident_feedback TEXT,
    rated_at TIMESTAMP WITH TIME ZONE,
    
    before_image TEXT,
    after_image TEXT INT, -- Ánh xạ phiếu hệ thống Skyline Smart Residence
    auto_dispatched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE service_tickets IS 'Phiếu yêu cầu cư dân phân loại 3 kênh: AI 24/7 (Inquiry), BQL (Feedback), KTV (Repair)';

-- ============================================================================
-- 21. BẢNG BẢNG TIN TÒA NHÀ (COMMUNITY_POSTS) - dataStore.ts
-- ============================================================================
CREATE TABLE community_posts (
    id VARCHAR(50) PRIMARY KEY,
    author_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(150) NOT NULL,
    author_role VARCHAR(50) DEFAULT 'BQL',
    apt_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Thông báo',
    ai_moderation VARCHAR(30) DEFAULT 'Clean',
    ai_sentiment NUMERIC(3, 2) DEFAULT 0.85,
    tags TEXT[], -- ['Bảo trì', 'Thang máy']
    likes INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE community_posts IS 'Thông báo và tin tức vận hành từ Ban Quản Lý và cư dân';

-- ============================================================================
-- 22. BẢNG BIỂU QUYẾT & LẤY Ý KIẾN CƯ DÂN (VOTING_TOPICS) - votingStore.ts
-- ============================================================================
CREATE TABLE voting_topics (
    id VARCHAR(50) PRIMARY KEY, -- vote-01, vote-02, vote-03, vote-04
    code VARCHAR(30) UNIQUE NOT NULL, -- BQ-2026-01
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    legal_type VARCHAR(50) NOT NULL CHECK (legal_type IN ('Bầu Ban Quản Trị', 'Đóng góp Quỹ Bảo trì', 'Ý kiến Cải tạo', 'Quy Chế Chung Cư', 'Tiện Ích & Dịch Vụ')),
    created_by VARCHAR(150) NOT NULL DEFAULT 'Ban Quản Trị & Kỹ Thuật Tòa Nhà',
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    is_owner_only BOOLEAN DEFAULT TRUE,
    total_eligible_apartments INT DEFAULT 200,
    total_votes INT DEFAULT 0,
    summary_report TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE voting_options (
    id VARCHAR(50) PRIMARY KEY, -- opt-1-1, opt-1-2
    topic_id VARCHAR(50) NOT NULL REFERENCES voting_topics(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    votes_count INT DEFAULT 0
);

CREATE TABLE voting_records (
    id VARCHAR(50) PRIMARY KEY,
    topic_id VARCHAR(50) NOT NULL REFERENCES voting_topics(id) ON DELETE CASCADE,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    voter_name VARCHAR(150) NOT NULL,
    option_id VARCHAR(50) NOT NULL REFERENCES voting_options(id) ON DELETE CASCADE,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_voting_apartment UNIQUE (topic_id, apartment_code)
);

COMMENT ON TABLE voting_topics IS 'Cuộc biểu quyết hợp pháp lấy ý kiến cư dân và chủ sở hữu căn hộ';
COMMENT ON TABLE voting_records IS 'Mỗi căn hộ chỉ được biểu quyết 01 phiếu duy nhất theo quy định';

-- ============================================================================
-- 23. BẢNG HỘI THOẠI SKYLINE AI CONCIERGE (AI_CHAT_CONVERSATIONS)
-- ============================================================================
CREATE TABLE ai_chat_conversations (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    apartment_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE CASCADE,
    summary VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ai_chat_messages (
    id VARCHAR(50) PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'ai')),
    text TEXT NOT NULL,
    is_fallback BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ai_chat_conversations IS 'Lịch sử hỏi đáp giữa cư dân và trợ lý ảo Skyline AI Concierge 24/7';

-- ============================================================================
-- CÁC CHỈ MỤC TỐI ƯU HÓA TRUY VẤN (INDEXES)
-- ============================================================================
CREATE INDEX idx_apartments_floor ON apartments(floor_number);
CREATE INDEX idx_apartments_owner ON apartments(owner_id);
CREATE INDEX idx_apartments_block ON apartments(block_id);
CREATE INDEX idx_members_apt ON apartment_members(apartment_code);
CREATE INDEX idx_devices_apt ON smart_devices(apartment_code);
CREATE INDEX idx_parking_apt ON parking_slots(apartment_code);
CREATE INDEX idx_parking_floor ON parking_slots(floor_number);
CREATE INDEX idx_facilities_floor ON facilities(floor_number);
CREATE INDEX idx_bookings_apt ON facility_bookings(apartment_code);
CREATE INDEX idx_bookings_fac ON facility_bookings(facility_id);
CREATE INDEX idx_passes_apt ON visitor_passes(apartment_code);
CREATE INDEX idx_bills_apt ON bills(apartment_code);
CREATE INDEX idx_tickets_apt ON service_tickets(apartment_code);
CREATE INDEX idx_tickets_ktv ON service_tickets(assigned_technician_id);
CREATE INDEX idx_tickets_type ON service_tickets(ticket_type);

-- ============================================================================
-- DỮ LIỆU MẪU CHUẨN XÁC: THÔNG TIN DỰ ÁN, TÒA NHÀ & TẦNG
-- ============================================================================

-- 1. Nạp Thông Tin Dự Án Chung Cư
INSERT INTO condominiums (
    id, condo_code, condo_name, address, total_floors, basement_floors, total_apartments, investor, management_company, hotline, handover_year, description
) VALUES (
    1, 'SKYLINE_RESIDENCE', 'Chung Cư Cao Cấp Skyline Smart Residence',
    'Phân khu The Tropical (BS-07 đến BS-10), Beverly Solari, Vinhomes Grand Park, TP. Thủ Đức, TP. Hồ Chí Minh',
    39, 2, 850, 'Skyline Group Corporation', 'Skyline Property Management Services',
    '1900 8899', 2026,
    'Tổ hợp chung cư thông minh 5 sao The Tropical (BS-07 đến BS-10) phân khu Beverly Solari cao 34-39 tầng với hệ thống Smart Home, nhận diện FaceID và tiện ích đặc quyền.'
);

-- 2. Nạp Danh Sách Khối Nhà (Blocks) - The Tropical (Beverly Solari) khớp skyline API
INSERT INTO blocks (id, condo_id, block_code, block_name, total_floors, manager_name, manager_phone) VALUES
(880, 1, 'BS-07', 'Chung Cư Tropical BS-07', 34, 'VinHomes Manager', '0901888999'),
(883, 1, 'BS-08', 'Chung Cư Tropical BS-08', 39, 'VinHomes Manager', '0901888999'),
(886, 1, 'BS-09', 'Chung Cư Tropical BS-09', 34, 'VinHomes Manager', '0901888999'),
(889, 1, 'BS-10', 'Chung Cư Tropical BS-10', 34, 'VinHomes Manager', '0901888999');

-- 3. Nạp Trọn Bộ 27 Mặt Bằng Tầng (2 Tầng Hầm + 25 Tầng Nổi)
INSERT INTO floors (floor_number, floor_code, floor_name, floor_type, floor_function, units_count, condo_id) VALUES
(-2, 'B2', 'Tầng Hầm B2 - Bãi Đỗ Xe Ô Tô Định Danh', 'BASEMENT', 'Bãi đỗ xe ô tô cư dân định danh RFID, trạm biến áp trung thế, phòng máy bơm PCCC & bể xử lý kỹ thuật ngầm.', 0, 1),
(-1, 'B1', 'Tầng Hầm B1 - Bãi Đỗ Xe Máy & Trạm Sạc Xe Điện', 'BASEMENT', 'Bãi đỗ xe máy cư dân RFID, trạm sạc xe điện thông minh, chốt bảo vệ an ninh và khu phân loại rác trung tâm.', 0, 1),
(1,  'T1', 'Tầng 1 - Sảnh Đón Khách Grand Lobby & Sky Kids', 'COMMERCIAL_AMENITY', 'Sảnh lễ tân đón khách 5 sao, quầy BQL tiếp dân, Khu Vui Chơi Trẻ Em Sky Kids Zone (07:00 - 21:00) và Shophouse thương mại.', 0, 1),
(2,  'T2', 'Tầng 2 - Khối Thương Mại & Văn Phòng Điều Hành', 'COMMERCIAL_AMENITY', 'Khu văn phòng điều hành BQL tòa nhà, phòng giám sát an ninh camera AI tập trung và shophouse dịch vụ tiện ích.', 0, 1),
(3,  'T3', 'Tầng 3 - Khu Tiện Ích Thể Thao & Chăm Sóc Sức Khỏe', 'COMMERCIAL_AMENITY', 'Trung Tâm Thể Hình Technogym mở cửa 24/7 suốt ngày đêm và Phòng Xông Hơi Đá Muối Himalaya VIP khép kín gia đình (08:00 - 22:00).', 0, 1),
(4,  'T4', 'Tầng 4 - Sinh Hoạt Cộng Đồng & Vườn Treo Thảo Mộc', 'COMMERCIAL_AMENITY', 'Hội trường sinh hoạt cộng đồng, thư viện số cư dân, không gian làm việc Co-working và vườn treo thư giãn.', 0, 1),
(5,  'T5', 'Tầng 5 - Tầng Căn Hộ Khởi Đầu', 'RESIDENTIAL', 'Khu căn hộ ở tiêu chuẩn 5 sao với thiết kế 1PN, 2PN, 3PN đón ánh sáng tự nhiên.', 10, 1),
(6,  'T6', 'Tầng 6 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở tiêu chuẩn view công viên nội khu và hồ cảnh quan.', 10, 1),
(7,  'T7', 'Tầng 7 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở tiêu chuẩn hướng sông thoáng mát.', 10, 1),
(8,  'T8', 'Tầng 8 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở tiêu chuẩn 2PN và 3PN view toàn cảnh.', 10, 1),
(9,  'T9', 'Tầng 9 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở tiêu chuẩn đón gió tự nhiên Đông Nam.', 10, 1),
(10, 'T10', 'Tầng 10 - Căn Hộ Cư Dân Tiêu Chuẩn', 'RESIDENTIAL', 'Khu căn hộ cư dân tiêu chuẩn với hướng nhìn thoáng đãng.', 10, 1),
(11, 'T11', 'Tầng 11 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp hoàn thiện nội thất chuẩn 5 sao.', 10, 1),
(12, 'T12', 'Tầng 12 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp yên tĩnh, cách âm 3 lớp tiêu chuẩn Châu Âu.', 10, 1),
(13, 'T13', 'Tầng 13 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở tầng trung thoáng mát, view sông Đồng Nai.', 10, 1),
(14, 'T14', 'Tầng 14 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở tầng trung thoáng mát, view sông Sài Gòn.', 10, 1),
(15, 'T15', 'Tầng 15 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp thiết kế tối ưu hóa diện tích.', 10, 1),
(16, 'T16', 'Tầng 16 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp tầm nhìn không giới hạn.', 10, 1),
(17, 'T17', 'Tầng 17 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp đón trọn ánh sáng ban mai.', 10, 1),
(18, 'T18', 'Tầng 18 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp view hoàng hôn thành phố.', 10, 1),
(19, 'T19', 'Tầng 19 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp tầng cao thoáng đãng.', 10, 1),
(20, 'T20', 'Tầng 20 - Căn Hộ 3PN Gia Đình Đa Thế Hệ', 'RESIDENTIAL', 'Khu căn hộ cao cấp diện tích lớn, tiêu biểu Căn 20B01 (3PN - 108.2 m2).', 10, 1),
(21, 'T21', 'Tầng 21 - Căn Hộ Cư Dân Tầng Cao', 'RESIDENTIAL', 'Khu căn hộ ở tầng cao yên tĩnh, view nhìn triệu đô.', 10, 1),
(22, 'T22', 'Tầng 22 - Căn Hộ Cư Dân Sky Suite', 'RESIDENTIAL', 'Khu căn hộ cao cấp Sky Suite tầng 22 (Căn 22A01 3PN, 22A02 2PN).', 8, 1),
(23, 'T23', 'Tầng 23 - Căn Hộ Cư Dân Sky Suite Tầng Cao', 'RESIDENTIAL', 'Khu căn hộ cao cấp Sky Suite tầng 23 (Căn 23A01 3PN, 23A02 2PN).', 8, 1),
(24, 'T24', 'Tầng 24 - Căn Hộ Áp Mái Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ áp mái sang trọng tầng 24 với tầm nhìn triệu đô ôm trọn sông Sài Gòn (Căn 24A01, 24A02).', 8, 1),
(25, 'T25', 'Tầng 25 - Sân Thượng Panoramic, Hồ Bơi Vô Cực, BBQ & Penthouse', 'ROOFTOP_AMENITY', 'Đại tiện ích Hồ Bơi Vô Cực Chân Mây (06:00 - 22:00), Vườn Tiệc Nướng BBQ Panoramic (17:00 - 23:00) và Tuyệt phẩm Duplex Penthouse 5 sao (25PH-01, 25PH-02).', 2, 1);

-- ============================================================================
-- DỮ LIỆU MẪU CĂN HỘ CHUẨN XÁC THEO CODEBASE & skyline CAD
-- ============================================================================
INSERT INTO apartments (
    id, apt_code, block_id, tower_code, floor_number, wing, apt_type, type_label, wall_area, clear_area, bedrooms, bathrooms, 
    balcony_direction, main_door_direction, price_billion, price_vnd, status, owner_id, handover_date, handover_protocol, description
) VALUES 
-- TÒA TROPICAL BS-07 (Block 880) - TẦNG 30 (TRỌN VẸN 21 CĂN HỘ MẶT BẰNG CAD)
('apt-ch01', 'CH-01', 880, 'A', 30, 'NORTH', '2PN', '2PN Góc Đẹp', 68.4, 64.0, 2, 2, 'Đông Bắc', 'Tây Nam', 3.15, 3150000000, 'Đã bàn giao', 'user-mai', '2026-09-21', 'BBBG-TROPICAL-BS07-CH01-20260921', 8801, 'Căn hộ 2PN góc tầng 30 Tòa Tropical BS-07 của Chủ hộ Nguyễn Thị Mai.'),
('apt-ch02', 'CH-02', 880, 'A', 30, 'NORTH', '1PN', '1PN Tiêu Chuẩn', 42.0, 38.2, 1, 1, 'Đông Bắc', 'Tây Nam', 2.80, 2800000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 1PN tiêu chuẩn hiện đại tầng 30 Tòa Tropical BS-07 đón gió Đông Bắc.'),
('apt-ch03', 'CH-03', 880, 'A', 30, 'NORTH', '1PN', '1PN+ Đa Năng', 51.0, 46.5, 1, 1, 'Đông Bắc', 'Tây Nam', 3.20, 3200000000, 'Đã bàn giao', 'user-thanh', '2026-09-21', 'BBBG-TROPICAL-BS07-CH03-20260921', 8803, 'Căn hộ 1PN+ đa năng của Chủ hộ Bùi Văn Thành tại Tòa Tropical BS-07 Tầng 30.'),
('apt-ch04', 'CH-04', 880, 'A', 30, 'NORTH', '2PN', '2PN Ban Công Kính', 64.0, 59.1, 2, 2, 'Đông Bắc', 'Tây Nam', 4.10, 4100000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 2PN ban công kính hướng Đông Bắc đón gió mát tầng 30 Tòa Tropical BS-07.'),
('apt-ch05', 'CH-05', 880, 'A', 30, 'NORTH', '2PN', '2PN Góc Đẹp', 75.0, 69.2, 2, 2, 'Đông Bắc', 'Tây Nam', 4.80, 4800000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 2PN góc đẹp hai mặt thoáng tầng 30 Tòa Tropical BS-07.'),
('apt-ch06', 'CH-06', 880, 'A', 30, 'SOUTH', '1PN', '1PN View Hồ Bơi (Căn Chủ Hộ)', 46.0, 42.0, 1, 1, 'Đông Nam', 'Tây Nam', 2.65, 2650000000, 'Đã bàn giao', 'user-owner-1', '2026-09-21', 'BBBG-TROPICAL-CH06-20260921', 8806, 'Căn hộ thông minh thực tế của Chủ hộ Trần Hữu Lực tại Tòa Tropical BS-07 Tầng 30 tích hợp FaceID, IoT Daikin và cảm biến rò rỉ nước AI.'),
('apt-ch07', 'CH-07', 880, 'A', 30, 'SOUTH', '2PN', '2PN Gia Đình', 64.0, 59.0, 2, 2, 'Đông Nam', 'Tây Bắc', 4.10, 4100000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 2PN gia đình view hồ bơi tầng 30 Tòa Tropical BS-07.'),
('apt-ch08', 'CH-08', 880, 'A', 30, 'SOUTH', '1PN', '1PN+ Đa Năng', 51.0, 46.5, 1, 1, 'Đông Nam', 'Tây Bắc', 3.25, 3250000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 1PN+ đa năng đón nắng mai tầng 30 Tòa Tropical BS-07.'),
('apt-ch09', 'CH-09', 880, 'A', 30, 'SOUTH', '2PN', '2PN Góc Thoáng', 75.0, 69.5, 2, 2, 'Đông Nam', 'Tây Bắc', 4.90, 4900000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 2PN góc thoáng view nội khu The Tropical tầng 30 Tòa BS-07.'),
('apt-ch10', 'CH-10', 880, 'A', 30, 'SOUTH', 'STUDIO', 'Studio Tiện Nghi', 38.0, 35.0, 1, 1, 'Đông Nam', 'Tây Bắc', 2.45, 2450000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ Studio tiện nghi đầy đủ công năng tầng 30 Tòa Tropical BS-07.'),
('apt-ch11', 'CH-11', 880, 'A', 30, 'WEST', '2PN', '2PN Tây Bắc', 67.0, 62.0, 2, 2, 'Tây Bắc', 'Đông Nam', 4.20, 4200000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 2PN Tây Bắc thiết kế mở tầng 30 Tòa Tropical BS-07.'),
('apt-ch12', 'CH-12', 880, 'A', 30, 'WEST', '1PN', '1PN Tiện Ích', 49.0, 44.5, 1, 1, 'Tây Bắc', 'Đông Nam', 3.10, 3100000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 1PN tiện ích tầng 30 Tòa Tropical BS-07.'),
('apt-ch13', 'CH-13', 880, 'A', 30, 'WEST', 'STUDIO', 'Studio Hiện Đại', 36.5, 33.5, 1, 1, 'Tây Bắc', 'Đông Nam', 2.30, 2300000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ Studio hiện đại tối ưu diện tích tầng 30 Tòa Tropical BS-07.'),
('apt-ch14', 'CH-14', 880, 'A', 30, 'WEST', '2PN', '2PN Ban Công Rộng', 63.5, 58.5, 2, 2, 'Tây Bắc', 'Đông Nam', 4.00, 4000000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 2PN ban công rộng ngắm hoàng hôn tầng 30 Tòa Tropical BS-07.'),
('apt-ch15', 'CH-15', 880, 'A', 30, 'WEST', '2PN', '2PN Góc Tây', 72.5, 67.0, 2, 2, 'Tây Bắc', 'Đông Nam', 4.50, 4500000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 2PN góc Tây thông thoáng tầng 30 Tòa Tropical BS-07.'),
('apt-ch16', 'CH-16', 880, 'A', 30, 'WEST', '2PN', '2PN Tây Nam', 73.5, 68.0, 2, 2, 'Tây Nam', 'Đông Bắc', 4.60, 4600000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 2PN Tây Nam đón gió sông tầng 30 Tòa Tropical BS-07.'),
('apt-ch17', 'CH-17', 880, 'A', 30, 'WEST', '1PN', '1PN View Cây Xanh', 47.0, 43.0, 1, 1, 'Tây Nam', 'Đông Bắc', 3.00, 3000000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 1PN view cây xanh mát mẻ tầng 30 Tòa Tropical BS-07.'),
('apt-ch18', 'CH-18', 880, 'A', 30, 'WEST', '2PN', '2PN Tiêu Chuẩn', 66.5, 61.5, 2, 2, 'Tây Nam', 'Đông Bắc', 4.15, 4150000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 2PN tiêu chuẩn The Tropical tầng 30 Tòa BS-07.'),
('apt-ch19', 'CH-19', 880, 'A', 30, 'WEST', 'STUDIO', 'Studio Nhỏ Gọn', 37.0, 34.0, 1, 1, 'Tây Nam', 'Đông Bắc', 2.40, 2400000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ Studio nhỏ gọn thông minh tầng 30 Tòa Tropical BS-07.'),
('apt-ch20', 'CH-20', 880, 'A', 30, 'WEST', '1PN', '1PN Đón Gió', 49.0, 45.0, 1, 1, 'Tây Nam', 'Đông Bắc', 3.15, 3150000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 1PN đón gió tầng 30 Tòa Tropical BS-07.'),
('apt-ch21', 'CH-21', 880, 'A', 30, 'WEST', '2PN', '2PN Góc Nam', 76.0, 70.0, 2, 2, 'Tây Nam', 'Đông Bắc', 4.95, 4950000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 2PN góc Nam cao cấp tầng 30 Tòa Tropical BS-07.'),

-- CĂN HỘ THUỘC 3 CHUNG CƯ CÒN LẠI (BS-08, BS-09, BS-10)
-- Tòa BS-08 (Block 883)
('apt-bs08-ch08', 'BS08-CH08', 883, 'A', 15, 'SOUTH', '1PN', '1PN+ Đa Năng', 46.5, 42.5, 1, 1, 'Đông Nam', 'Tây Bắc', 3.25, 3250000000, 'Đã bàn giao', 'user-member-1', '2026-09-21', 'BBBG-TROPICAL-BS08-CH08-20260921', 8838, 'Căn hộ của Chủ hộ Nguyễn Văn Cường tại Tòa Tropical BS-08 Tầng 15 (ở 1 mình, không có người nhà).'),
('apt-bs08-ch04', 'BS08-CH04', 883, 'A', 12, 'NORTH', '2PN', '2 Phòng Ngủ View Công Viên', 69.2, 65.0, 2, 2, 'Đông Bắc', 'Tây Nam', 3.30, 3300000000, 'Đã bàn giao', 'user-nam', '2026-09-21', 'BBBG-TROPICAL-BS08-CH04-20260921', 8834, 'Căn hộ của Chủ hộ Lê Hoàng Nam tại Tòa Tropical BS-08 Tầng 12.'),
('apt-bs08-ch07', 'BS08-CH07', 883, 'B', 20, 'SOUTH', '1PN', '1PN+ Đa Năng', 47.0, 43.0, 1, 1, 'Đông Nam', 'Tây Bắc', 3.20, 3200000000, 'Đã bàn giao', 'user-ha', '2026-09-21', 'BBBG-TROPICAL-BS08-CH07-20260921', 8837, 'Căn hộ của Chủ hộ Đỗ Thu Hà tại Tòa Tropical BS-08 Tầng 20.'),

-- Tòa BS-09 (Block 886)
('apt-bs09-ch12', 'BS09-CH12', 886, 'B', 12, 'WEST', '1PN', '1PN Tiện Ích', 44.5, 40.5, 1, 1, 'Tây Bắc', 'Đông Nam', 3.10, 3100000000, 'Đã bàn giao', 'user-member-2', '2026-09-21', 'BBBG-TROPICAL-BS09-CH12-20260921', 8862, 'Căn hộ của Chủ hộ Lê Đức Hải tại Tòa Tropical BS-09 Tầng 12 (ở 1 mình, không có người nhà).'),
('apt-bs09-ch05', 'BS09-CH05', 886, 'A', 16, 'WEST', '2PN', '2 Phòng Ngủ Tiện Nghi', 68.0, 63.5, 2, 2, 'Tây Bắc', 'Đông Nam', 3.18, 3180000000, 'Đã bàn giao', 'user-tuan', '2026-09-21', 'BBBG-TROPICAL-BS09-CH05-20260921', 8865, 'Căn hộ của Chủ hộ Phạm Minh Tuấn tại Tòa Tropical BS-09 Tầng 16.'),
('apt-bs09-ch10', 'BS09-CH10', 886, 'B', 22, 'EAST', '1PN', '1PN Tiêu Chuẩn', 45.0, 41.0, 1, 1, 'Đông Nam', 'Tây Bắc', 3.05, 3050000000, 'Đã bàn giao', 'user-huy', '2026-09-21', 'BBBG-TROPICAL-BS09-CH10-20260921', 8870, 'Căn hộ của Chủ hộ Vũ Quang Huy tại Tòa Tropical BS-09 Tầng 22.'),

-- Tòa BS-10 (Block 889)
('apt-bs10-ch02', 'BS10-CH02', 889, 'B', 18, 'NORTH', '1PN', '1PN Tiêu Chuẩn', 38.2, 35.0, 1, 1, 'Đông Bắc', 'Tây Nam', 2.80, 2800000000, 'Đã bàn giao', 'user-member-3', '2026-09-21', 'BBBG-TROPICAL-BS10-CH02-20260921', 8892, 'Căn hộ của Chủ hộ Vũ Cát Thịnh tại Tòa Tropical BS-10 Tầng 18 (ở 1 mình, không có người nhà).'),
('apt-bs10-ch09', 'BS10-CH09', 889, 'A', 25, 'NORTH', '2PN', '2 Phòng Ngủ Tầng Cao', 70.0, 65.5, 2, 2, 'Đông Bắc', 'Tây Nam', 3.40, 3400000000, 'Đã bàn giao', 'user-dung', '2026-09-21', 'BBBG-TROPICAL-BS10-CH09-20260921', 8899, 'Căn hộ của Chủ hộ Hoàng Anh Dũng tại Tòa Tropical BS-10 Tầng 25.'),
('apt-bs10-ch11', 'BS10-CH11', 889, 'B', 28, 'SOUTH', '1PN', '1PN Panorama', 48.0, 44.0, 1, 1, 'Đông Nam', 'Tây Bắc', 3.35, 3350000000, 'Đã bàn giao', 'user-linh', '2026-09-21', 'BBBG-TROPICAL-BS10-CH11-20260921', 8901, 'Căn hộ của Chủ hộ Đặng Phương Linh tại Tòa Tropical BS-10 Tầng 28.'),

-- PENTHOUSE & SKY SUITE TÒA A BS-07
('apt-25ph01', '25PH-01', 880, 'A', 25, 'CENTRAL', 'DUPLEX_PENTHOUSE', 'Duplex Penthouse 5 Sao', 232.0, 215.0, 4, 4, 'Đông Nam', 'Tây Bắc', 18.50, 18500000000, 'Đang trống', NULL, NULL, NULL, 9901, 'Tuyệt tác Penthouse thông tầng tầng 25, hồ bơi riêng Sky Garden và thang máy đặc quyền.'),
('apt-25ph02', '25PH-02', 880, 'A', 25, 'CENTRAL', 'DUPLEX_PENTHOUSE', 'Duplex Penthouse 5 Sao', 232.0, 215.0, 4, 4, 'Tây Nam', 'Đông Bắc', 18.20, 18200000000, 'Đang trống', NULL, NULL, NULL, 9902, 'Penthouse tầng 25 hướng hoàng hôn, sân thượng Sky Lounge 45m2 ngắm trọn thành phố.'),
('apt-24a01', '24A01', 880, 'A', 24, 'NORTH', '3PN', '3 Phòng Ngủ - 3WC', 119.5, 112.0, 3, 3, 'Đông Nam', 'Tây Bắc', 8.50, 8500000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 3PN cao cấp áp mái tầng 24 với tầm nhìn triệu đô ôm trọn sông Sài Gòn.'),
('apt-24a02', '24A02', 880, 'A', 24, 'NORTH', '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Tây Nam', 'Đông Bắc', 5.60, 5600000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn 2PN tầng cao thoáng đãng đón gió tự nhiên, hoàn thiện nội thất cơ bản cao cấp.'),
('apt-20b01', '20B01', 880, 'A', 20, 'SOUTH', '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.2, 3, 3, 'Nam', 'Bắc', 7.20, 7200000000, 'Đã bàn giao', NULL, '2026-02-10', 'BBBG-SKYLINE-20B01-20260210', NULL, 'Căn hộ 3PN rộng rãi diện tích thông thủy 108.2 m2 dành cho gia đình đa thế hệ.');

-- ============================================================================
-- DỮ LIỆU MẪU TÀI KHOẢN NGƯỜI DÙNG & CƯ DÂN (USERS)
-- ============================================================================
INSERT INTO users (
    id, username, role, full_name, phone, email, password_hash, id_card_no, id_date, id_place, dob, pob, gender, apartment_code, relationship, license_plate
) VALUES 
-- 1. Quản lý Tòa Nhà (Trưởng BQL)
('user-manager-1', 'admin@skyline.vn', 'ADMIN', 'VinHomes Manager', '0901888999', 'admin@skyline.vn', 'admin123', '079204000888', '2021-05-10', 'Cục Cảnh sát QLHC về TTXH', '1988-04-12', 'TP. Hồ Chí Minh', 1, 'BQL_OFFICE', 'Staff', NULL),

-- 2. Kỹ Thuật Viên 1: Trần Đình Trọng (Điện Lạnh & Kỹ Thuật Tòa Nhà)
('user-tech-1', '0901888998', 'TECHNICIAN', 'Trần Đình Trọng', '0901888998', 'manager02@skyline.vn', '12345678', '079201009999', '2020-05-18', 'Cục Cảnh sát QLHC về TTXH', '1990-09-12', 'Đà Nẵng', 1, 'TECH_ROOM', 'Staff', NULL),

-- 3. Kỹ Thuật Viên 2: Lê Quốc Tuấn (Cơ Điện & Nước)
('user-tech-2', '0909888777', 'TECHNICIAN', 'Lê Quốc Tuấn', '0909888777', 'tech.skyline@gmail.com', '12345678', '079201009988', '2020-03-20', 'Cục Cảnh sát QLHC về TTXH', '1992-07-25', 'Hà Nội', 1, 'TECH_ROOM', 'Staff', NULL),

-- 4. Kỹ Thuật Viên 3: Nguyễn Huy Hoàng (Vệ Sinh & Cảnh Quan Chung Cư)
('user-tech-3', '0908777666', 'TECHNICIAN', 'Nguyễn Huy Hoàng', '0908777666', 'hoang.vesinh@skyline.vn', '12345678', '079201007766', '2021-04-15', 'Cục Cảnh sát QLHC về TTXH', '1993-06-18', 'Bình Định', 1, 'TECH_ROOM', 'Staff', NULL),

-- 5. Lễ Tân Tòa Nhà 1: Hoàng Thảo My
('user-reception-1', '0901234567', 'RECEPTIONIST', 'Hoàng Thảo My', '0901234567', 'reception.skyline@gmail.com', '12345678', '079302008877', '2022-11-10', 'Cục Cảnh sát QLHC về TTXH', '1998-09-18', 'Đà Nẵng', 0, 'RECEPTION_DESK', 'Staff', NULL),

-- 6. Lễ Tân Tòa Nhà 2: Nguyễn Mai Anh
('user-reception-2', '0901234568', 'RECEPTIONIST', 'Nguyễn Mai Anh', '0901234568', 'reception.tropical@gmail.com', '12345678', '079302008878', '2023-01-15', 'Cục Cảnh sát QLHC về TTXH', '1999-04-20', 'TP. Hồ Chí Minh', 0, 'RECEPTION_DESK', 'Staff', NULL),

-- 7. Chủ Hộ Thực Tế Tòa BS-07: Trần Hữu Lực (Căn CH-06)
('user-owner-1', '0364967082', 'OWNER', 'Trần Hữu Lực', '0364967082', 'huuluc04@gmail.com', '12345678', '067204000961', '2022-08-15', 'Cục Cảnh sát QLHC về TTXH', '2004-08-18', 'Triệu Trạch, Triệu Phong, Quảng Trị', 1, 'CH-06', 'Owner', '51K-889.99'),

-- 8. Cư Dân Người Nhà Tòa BS-07: Nguyễn Hữu Nhựt (sống cùng tại CH-06)
('user-tenant-1', '0917795211', 'TENANT', 'Nguyễn Hữu Nhựt', '0917795211', 'nguyenhuunhut1309@gmail.com', '12345678', '079198005678', '2022-09-02', 'Cục Cảnh sát QLHC về TTXH', '2004-09-02', 'TP. Hồ Chí Minh', 1, 'CH-06', 'Family', '59P1-886.79'),

-- 9. Chủ Hộ Tòa BS-08: Nguyễn Văn Cường (Căn CH-08 Tầng 15 - ở 1 mình)
('user-member-1', '0325524482', 'OWNER', 'Nguyễn Văn Cường', '0325524482', 'vanncuong1614@gmail.com', '12345678', '074204001708', '2022-11-20', 'Cục Cảnh sát QLHC về TTXH', '2004-01-16', 'Tỉnh Thanh Hóa', 1, 'BS08-CH08', 'Owner', NULL),

-- 10. Chủ Hộ Tòa BS-09: Lê Đức Hải (Căn CH-12 Tầng 12 - ở 1 mình)
('user-member-2', '0977758215', 'OWNER', 'Lê Đức Hải', '0977758215', 'lehai17082004@gmail.com', '12345678', '070204001704', '2023-04-12', 'Cục Cảnh sát QLHC về TTXH', '2004-08-17', 'Xuân Thọ, Triệu Sơn, Thanh Hóa', 1, 'BS09-CH12', 'Owner', NULL),

-- 11. Chủ Hộ Tòa BS-10: Vũ Cát Thịnh (Căn CH-02 Tầng 18 - ở 1 mình)
('user-member-3', '0909262626', 'OWNER', 'Vũ Cát Thịnh', '0909262626', '26vucatthinh@gmail.com', '12345678', '079201002626', '2023-06-18', 'Cục Cảnh sát QLHC về TTXH', '2001-05-26', 'TP. Hồ Chí Minh', 1, 'BS10-CH02', 'Owner', NULL),

-- 12. Cư dân: Nguyễn Thị Mai (Chủ hộ Căn CH-01 Tòa BS-07)
('user-mai', '0364967081', 'OWNER', 'Nguyễn Thị Mai', '0364967081', 'mainguyen@gmail.com', '12345678', '079198002341', '2021-06-10', 'Cục Cảnh sát QLHC về TTXH', '1992-05-12', 'Hải Phòng', 0, 'CH-01', 'Owner', '59F2-688.88'),

-- 13. Cư dân: Lê Hoàng Nam (Chủ hộ Căn CH-04 Tòa BS-08)
('user-nam', '0364967080', 'OWNER', 'Lê Hoàng Nam', '0364967080', 'namle@gmail.com', '12345678', '001090004521', '2020-08-15', 'Cục Cảnh sát QLHC về TTXH', '1988-11-25', 'Hà Nội', 1, 'BS08-CH04', 'Owner', '30H-992.34'),

-- 14. Cư dân: Phạm Minh Tuấn (Chủ hộ Căn CH-05 Tòa BS-09)
('user-tuan', '0364967084', 'OWNER', 'Phạm Minh Tuấn', '0364967084', 'tuanpham@gmail.com', '12345678', '079085001234', '2020-03-12', 'Cục Cảnh sát QLHC về TTXH', '1985-03-08', 'TP. Hồ Chí Minh', 1, 'BS09-CH05', 'Owner', '51G-771.88'),

-- 15. Cư dân: Hoàng Anh Dũng (Chủ hộ Căn CH-09 Tòa BS-10)
('user-dung', '0364967085', 'OWNER', 'Hoàng Anh Dũng', '0364967085', 'dunghoang@gmail.com', '12345678', '079093005678', '2022-01-20', 'Cục Cảnh sát QLHC về TTXH', '1995-09-15', 'Đà Nẵng', 1, 'BS10-CH09', 'Owner', '59P1-889.12'),

-- 16. Cư dân: Đỗ Thu Hà (Chủ hộ Căn CH-07 Tòa BS-08)
('user-ha', '0364967086', 'OWNER', 'Đỗ Thu Hà', '0364967086', 'hadothu@gmail.com', '12345678', '031191007890', '2021-09-18', 'Cục Cảnh sát QLHC về TTXH', '1991-04-20', 'Hải Dương', 0, 'BS08-CH07', 'Owner', '51H-665.23'),

-- 17. Cư dân: Vũ Quang Huy (Chủ hộ Căn CH-10 Tòa BS-09)
('user-huy', '0364967087', 'OWNER', 'Vũ Quang Huy', '0364967087', 'huyvu@gmail.com', '12345678', '036089003412', '2020-10-05', 'Cục Cảnh sát QLHC về TTXH', '1990-10-10', 'Nam Định', 1, 'BS09-CH10', 'Owner', '29A-888.66'),

-- 18. Cư dân: Đặng Phương Linh (Chủ hộ Căn CH-11 Tòa BS-10)
('user-linh', '0364967088', 'OWNER', 'Đặng Phương Linh', '0364967088', 'linhdang@gmail.com', '12345678', '079196008912', '2022-12-10', 'Cục Cảnh sát QLHC về TTXH', '1996-08-22', 'TP. Hồ Chí Minh', 0, 'BS10-CH11', 'Owner', '51A-981.45'),

-- 19. Cư dân: Bùi Văn Thành (Chủ hộ Căn CH-03 Tòa BS-07)
('user-thanh', '0364967083', 'OWNER', 'Bùi Văn Thành', '0364967083', 'thanhbui@gmail.com', '12345678', '038090001122', '2020-02-18', 'Cục Cảnh sát QLHC về TTXH', '1983-07-05', 'Thanh Hóa', 1, 'CH-03', 'Owner', NULL);

-- Cập nhật chủ sở hữu các căn hộ trong 4 tòa
UPDATE apartments SET owner_id = 'user-owner-1' WHERE apt_code = 'CH-06' AND block_id = 880;
UPDATE apartments SET owner_id = 'user-mai' WHERE apt_code = 'CH-01' AND block_id = 880;
UPDATE apartments SET owner_id = 'user-thanh' WHERE apt_code = 'CH-03' AND block_id = 880;
UPDATE apartments SET owner_id = 'user-member-1' WHERE apt_code = 'CH-08' AND block_id = 883;
UPDATE apartments SET owner_id = 'user-nam' WHERE apt_code = 'CH-04' AND block_id = 883;
UPDATE apartments SET owner_id = 'user-ha' WHERE apt_code = 'CH-07' AND block_id = 883;
UPDATE apartments SET owner_id = 'user-member-2' WHERE apt_code = 'CH-12' AND block_id = 886;
UPDATE apartments SET owner_id = 'user-tuan' WHERE apt_code = 'CH-05' AND block_id = 886;
UPDATE apartments SET owner_id = 'user-huy' WHERE apt_code = 'CH-10' AND block_id = 886;
UPDATE apartments SET owner_id = 'user-member-3' WHERE apt_code = 'CH-02' AND block_id = 889;
UPDATE apartments SET owner_id = 'user-dung' WHERE apt_code = 'CH-09' AND block_id = 889;
UPDATE apartments SET owner_id = 'user-linh' WHERE apt_code = 'CH-11' AND block_id = 889;

-- ============================================================================
-- DỮ LIỆU MẪU THÀNH VIÊN GIA ĐÌNH CĂN CH-06 (APARTMENT_MEMBERS)
-- ============================================================================
INSERT INTO apartment_members (
    id, apartment_code, user_id, full_name, phone, id_card, relationship, role, license_plate, face_status
) VALUES 
('mem-1', 'CH-06', 'user-tenant-1', 'Nguyễn Hữu Nhựt', '0917795211', '079198005678', 'Em Trai / Người Nhà', 'Family', '59P1-886.79', 'Đã xác thực');

-- ============================================================================
-- DỮ LIỆU MẪU ĐỘI NGŨ KỸ THUẬT VIÊN THỰC TẾ (TECHNICIANS) - ticketStore.ts
-- ============================================================================
INSERT INTO technicians (
    id, user_id, name, phone, email, specialty, base_salary, pay_per_ticket, bonus_per_fivestar, status
) VALUES 
('KTV-01', 'user-tech-1', 'Trần Đình Trọng', '0901.888.998', 'manager02@skyline.vn', 'Điện Lạnh & Kỹ Thuật Tòa Nhà', 9500000, 180000, 50000, 'AVAILABLE'),
('KTV-02', 'user-tech-2', 'Lê Quốc Tuấn', '0909.888.777', 'tech.skyline@gmail.com', 'Cơ Điện & Nước', 8500000, 150000, 50000, 'AVAILABLE'),
('KTV-03', 'user-tech-3', 'Nguyễn Huy Hoàng', '0908.777.666', 'hoang.vesinh@skyline.vn', 'Vệ Sinh & Cảnh Quan Chung Cư', 8000000, 120000, 50000, 'AVAILABLE');

-- ============================================================================
-- DỮ LIỆU MẪU THIẾT BỊ NHÀ THÔNG MINH IOT (SMART_DEVICES) - smartHomeStore.ts
-- ============================================================================
INSERT INTO smart_devices (id, apartment_code, name, device_type, status, set_value, location_x, location_y) VALUES 
('dev-lock-01', 'CH-06', 'Khóa Thông Minh FaceID Cửa Chính', 'door', 'locked', 0, 15.5, 85.0),
('dev-light-01', 'CH-06', 'Hệ Thống Đèn Phòng Khách Luxury', 'light', 'on', 100, 45.0, 50.0),
('dev-light-02', 'CH-06', 'Đèn Phòng Ngủ Master', 'light', 'on', 80, 70.0, 35.0),
('dev-light-03', 'CH-06', 'Đèn Không Gian Bếp', 'light', 'on', 100, 30.0, 65.0),
('dev-ac-01', 'CH-06', 'Điều Hòa Daikin Inverter Inverter 24°C', 'ac', 'on', 24.0, 60.0, 30.0),
('dev-curtain-01', 'CH-06', 'Rèm Cửa Tự Động Ban Công', 'curtain', 'open', 100, 85.0, 50.0),
('dev-sensor-01', 'CH-06', 'Cảm Biến Dòng Chảy & Rò Rỉ Nước AI', 'sensor', 'active', 0, 25.0, 20.0),
('dev-sensor-02', 'CH-06', 'Cảm Biến Bụi Mịn & Chất Lượng Không Khí AQI Daikin Streamer', 'sensor', 'active', 32, 50.0, 45.0);

-- ============================================================================
-- DỮ LIỆU MẪU KỊCH BẢN TỰ ĐỘNG HÓA THÔNG MINH (SMART_AUTOMATION_RULES)
-- ============================================================================
INSERT INTO smart_automation_rules (
    id, apartment_code, title, trigger_time, trigger_type, trigger_label, description, action_summary, enabled, repeat_days, icon
) VALUES 
('rule_morning', 'CH-06', 'Bình Minh Thức Giấc & Nắng Sớm', '06:30', 'TIME', 'Hẹn giờ 06:30 sáng', 'Tự động mở rèm ban công đón ánh sáng tự nhiên, tắt điều hòa và tắt đèn phòng ngủ.', 'Mở rèm 100% • Tắt Đèn PN Master • Tắt AC', TRUE, 'Hàng ngày', 'sun'),
('rule_sunset', 'CH-06', 'Hoàng Hôn & Chiếu Sáng Chào Đón', '18:30', 'TIME', 'Hẹn giờ 18:30 chiều', 'Tự động bật hệ thống đèn phòng khách và đèn bếp đón các thành viên trở về nhà.', 'Bật Đèn PK 100% • Bật Đèn Bếp • Bật AC 24°C', TRUE, 'Hàng ngày', 'moon'),
('rule_night_secure', 'CH-06', 'An Ninh Chốt Khóa Đêm & Chế Độ Ngủ', '23:00', 'TIME', 'Hẹn giờ 23:00 đêm', 'Tự động kiểm tra chốt an toàn FaceID cửa chính, đóng kín rèm và chuyển điều hòa sang 26°C.', 'Khóa Chốt FaceID • Đóng Rèm • AC 26°C (Sleep) • Tắt Đèn PK', TRUE, 'Hàng ngày', 'shield'),
('rule_water_guard', 'CH-06', 'AI Canh Gác Rò Rỉ Nước Ban Đêm', '02:00 - 04:00', 'SENSOR', 'Cảm biến lưu lượng AI đêm', 'Tự động giám sát lưu lượng dòng chảy van cấp nước. Cảnh báo khẩn nếu có thất thoát vòi rửa.', 'Quét lưu lượng 0.00 L/h • Cảnh báo loa Hub & App', TRUE, 'Khung giờ ngủ sâu (02:00 - 04:00)', 'droplet'),
('rule_air_clean', 'CH-06', 'Tự Động Lọc Không Khí Daikin Khi Bụi Mịn Tăng', 'AQI > 50', 'CLIMATE', 'Cảm biến chất lượng không khí AQI', 'Khi phát hiện mật độ bụi mịn trong nhà vượt mức 50, tự động kích hoạt chế độ lọc ion Streamer.', 'Tăng tốc độ quạt gió • Bật phát ion Streamer Daikin', TRUE, 'Tự động kích hoạt 24/7', 'wind');

-- ============================================================================
-- DỮ LIỆU MẪU MÃ PIN TẠM VÀ NHẬT KÝ MỞ CỬA CĂN CH-06
-- ============================================================================
INSERT INTO smart_guest_pins (id, apartment_code, pin_code, label, created_by, status, max_uses, used_count, expires_at) VALUES 
('pin-01', 'CH-06', '482910', 'Shipper Giao Hàng Shopee', 'Trần Hữu Lực', 'ACTIVE', 1, 0, CURRENT_TIMESTAMP + INTERVAL '2 hours'),
('pin-02', 'CH-06', '718293', 'Khách Bạn Thân Cuối Tuần', 'Trần Hữu Lực', 'ACTIVE', 5, 2, CURRENT_TIMESTAMP + INTERVAL '24 hours');

INSERT INTO smart_door_access_logs (id, apartment_code, user_name, role, method, status, detail, timestamp) VALUES 
('log-01', 'CH-06', 'Trần Hữu Lực', 'Chủ hộ', 'FACE_ID', 'SUCCESS', 'Nhận diện khuôn mặt FaceID 3D độ khớp 99.8%', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
('log-02', 'CH-06', 'Nguyễn Hữu Nhựt', 'Thành viên', 'NFC_CARD', 'SUCCESS', 'Quẹt thẻ cư dân Skyline RFID chip mifare', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('log-03', 'CH-06', 'Người lạ', 'Khách', 'PIN_OTP', 'DENIED', 'Nhập sai mã PIN khách 3 lần liên tiếp, kích hoạt còi cảnh báo', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- ============================================================================
-- DỮ LIỆU MẪU CHỖ ĐỖ XE ĐỊNH DANH HẦM B1 & B2 (PARKING_SLOTS)
-- ============================================================================
INSERT INTO parking_slots (id, slot_code, floor_number, vehicle_type, apartment_code, assigned_user_id, assigned_license_plate, rfid_card_code, status, monthly_fee) VALUES 
('slot-b2-a15', 'Ô B2-A15', -2, 'CAR', 'CH-06', 'user-owner-1', '51K-889.99', 'RFID-A1205-01', 'OCCUPIED', 1200000),
('slot-b1-m88', 'Khu B1-M88', -1, 'MOTORCYCLE', 'CH-06', 'user-owner-1', '59P1-886.79', 'RFID-A1205-02', 'OCCUPIED', 120000),
('slot-b2-a16', 'Ô B2-A16', -2, 'CAR', NULL, NULL, NULL, NULL, 'VACANT', 1200000),
('slot-b1-m89', 'Khu B1-M89', -1, 'MOTORCYCLE', NULL, NULL, NULL, NULL, 'VACANT', 120000);

-- ============================================================================
-- DỮ LIỆU MẪU 5 ĐẠI TIỆN ÍCH 5 SAO CHUNG CƯ (FACILITIES)
-- ============================================================================
INSERT INTO facilities (id, name, category, floor_number, location_detail, operating_hours, pricing, max_quota_per_month, rating_score, current_occupancy, max_capacity, hero_image_url) VALUES 
('fac-1', 'Hồ Bơi Vô Cực Chân Mây (Skyline Horizon Pool)', 'Hồ bơi', 25, 'Tầng 25 (Sân Thượng Chung Cư)', '06:00 - 22:00', 'Miễn phí theo Thẻ cư dân (20 lượt/tháng)', 20, 4.9, 14, 40, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'),
('fac-3', 'Trung Tâm Thể Hình Technogym (Fitness & Yoga)', 'Gym', 3, 'Tầng 3 (Khu Thể Thao Đa Năng)', 'Mở cửa 24/7', 'Miễn phí theo Thẻ cư dân', 30, 5.0, 8, 35, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'),
('fac-sauna', 'Phòng Xông Hơi Đá Muối Himalaya (Private VIP)', 'Xông hơi', 3, 'Tầng 3 (Khu Chăm Sóc Sức Khỏe Riêng Tư)', '08:00 - 22:00', '500.000 đ / giờ (Phòng gia đình VIP)', 10, 5.0, 1, 4, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800'),
('fac-kids', 'Khu Vui Chơi Trẻ Em Sky Kids Zone', 'Khu trẻ em', 1, 'Tầng 1 (Sảnh Thương Mại Tòa Chung Cư)', '07:00 - 21:00', 'Miễn phí theo Thẻ cư dân (Có người lớn đi kèm)', 30, 4.9, 6, 25, 'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=800'),
('fac-2', 'Vườn Tiệc Nướng BBQ Panoramic', 'BBQ', 25, 'Tầng 25 (Sân Thượng Khu Vườn Nhật Bản)', '17:00 - 23:00', '600.000 đ / ca (Bao gồm set bếp Weber & dọn dẹp)', 4, 4.8, 2, 6, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800');

-- Đặt chỗ tiện ích
INSERT INTO facility_bookings (
    id, apartment_code, facility_id, booker_id, booker_name, ticket_code, 
    booking_date, time_slot, guest_count, duration_hours, deposit_amount, pricing, payment_method, status, notes
) VALUES (
    'BK-SAUNA-9821', 'CH-06', 'fac-sauna', 'user-owner-1', 'Trần Hữu Lực', 'SKY-SAUNA-CH06-7799', 
    CURRENT_DATE, '18:00 - 20:00 (2 Tiếng - Tối nay)', 2, 2, 1000000, '500.000 đ / giờ', 
    'Trừ vào hóa đơn sinh hoạt tháng tới', 'CONFIRMED', 'Gia đình 2 người, chuẩn bị trước tinh dầu sả chanh'
);

-- ============================================================================
-- DỮ LIỆU MẪU THẺ KHÁCH THĂM QR & NHẬT KÝ AN NINH (VISITOR_PASSES) - visitorStore.ts
-- ============================================================================
INSERT INTO visitor_passes (
    id, apartment_code, host_user_id, host_name, host_phone, tower_name, visitor_name, visitor_phone, license_plate, 
    entry_type, purpose, purpose_label, valid_hours, qr_data, pin_code, status, note, valid_until, checked_in_at
) VALUES 
('SKY-PASS-8492', 'CH-06', 'user-owner-1', 'Trần Hữu Lực', '0364967082', 'Tropical BS-07', 'Trần Quốc Bảo', '0903123456', '51G-888.88', 
 'MULTI', 'VISITOR', 'Khách Thăm Căn Hộ', 8, '{"skyline_pass":true,"passId":"SKY-PASS-8492","aptCode":"CH-06","hostName":"Trần Hữu Lực","visitorName":"Trần Quốc Bảo"}', '849201', 'CHECKED_IN', 'Khách đối tác công việc lên căn CH-06 (Tòa BS-07)', CURRENT_TIMESTAMP + INTERVAL '6 hours', '10:15 02/10/2026'),

('SKY-PASS-6521', 'CH-06', 'user-owner-1', 'Trần Hữu Lực', '0364967082', 'Tropical BS-07', 'Phạm Minh Tuấn', '0918765432', '59P1-999.99', 
 'MULTI', 'VISITOR', 'Khách Thăm Căn Hộ', 4, '{"skyline_pass":true,"passId":"SKY-PASS-6521","aptCode":"CH-06","hostName":"Trần Hữu Lực","visitorName":"Phạm Minh Tuấn"}', '652190', 'ACTIVE', 'Bạn bè đến thăm gia đình', CURRENT_TIMESTAMP + INTERVAL '3.5 hours', NULL),

('SKY-PASS-8107', 'CH-06', 'user-owner-1', 'Trần Hữu Lực', '0364967082', 'Tropical BS-07', 'Trần Minh Tuấn', '0988776655', '51G-123.45', 
 'SINGLE', 'DELIVERY', 'Giao hàng nội thất cao cấp', 8, '{"skyline_pass":true,"passId":"SKY-PASS-8107","aptCode":"CH-06","hostName":"Trần Hữu Lực","visitorName":"Trần Minh Tuấn"}', '135565', 'ACTIVE', 'Giao đồ nội thất ban công', CURRENT_TIMESTAMP + INTERVAL '8 hours', NULL);

INSERT INTO visitor_gate_logs (id, pass_id, apartment_code, host_name, visitor_name, license_plate, action, result, checkpoint, notes) VALUES 
('vgl-01', 'SKY-PASS-8492', 'CH-06', 'Trần Hữu Lực', 'Trần Quốc Bảo', '51G-888.88', 'CHECK_IN', 'VALID', 'Cổng Barrier Hầm B1', 'Khách đối tác đã check-in thành công qua mã QR');

-- ============================================================================
-- DỮ LIỆU MẪU HÓA ĐƠN & CHI TIẾT DỊCH VỤ (BILLS & BILL_DETAILS) - dataStore.ts
-- ============================================================================
INSERT INTO bills (id, apartment_code, owner_name, billing_month, due_date, total_amount, status, payment_qr_url, has_ai_anomaly, created_at, paid_at) VALUES 
('bill-2026-08-ch06', 'CH-06', 'Trần Hữu Lực', 'Tháng 08/2026', '2026-08-30 23:59:59+07', 2505000, 'Unpaid', 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_CH06_2505000', TRUE, '2026-08-05 08:00:00+07', NULL),
('bill-2026-07-ch06', 'CH-06', 'Trần Hữu Lực', 'Tháng 07/2026', '2026-07-30 23:59:59+07', 2370000, 'Paid', 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_CH06_PAID_07', FALSE, '2026-07-05 08:00:00+07', '2026-07-28 14:20:00+07'),
('bill-2026-06-ch06', 'CH-06', 'Trần Hữu Lực', 'Tháng 06/2026', '2026-06-30 23:59:59+07', 2391000, 'Paid', 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_CH06_PAID_06', FALSE, '2026-06-05 08:00:00+07', '2026-06-25 09:15:00+07'),
('bill-2026-05-ch06', 'CH-06', 'Trần Hữu Lực', 'Tháng 05/2026', '2026-05-30 23:59:59+07', 2163000, 'Paid', 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_CH06_PAID_05', FALSE, '2026-05-05 08:00:00+07', '2026-05-27 16:40:00+07');

-- Chi tiết hóa đơn Tháng 08/2026 (Có phát hiện rò rỉ nước AI)
INSERT INTO bill_details (id, bill_id, service_type, service_name, usage, unit, unit_price, total_line_amount, ai_anomaly, anomaly_reason) VALUES 
('bd-08-1', 'bill-2026-08-ch06', 'Electricity', 'Tiền Điện Sinh Hoạt', 340, 'kWh', 3200, 1088000, FALSE, NULL),
('bd-08-2', 'bill-2026-08-ch06', 'Water', 'Tiền Nước Sinh Hoạt', 18, 'm³', 18000, 324000, TRUE, 'Tăng 115% so với chu kỳ trước. Cảm biến AI phát hiện dòng chảy ngầm ban đêm khung giờ 02:00 - 04:00.'),
('bd-08-3', 'bill-2026-08-ch06', 'Management_Fee', 'Phí Quản Lý Vận Hành', 73.2, 'm²', 10000, 732000, FALSE, NULL),
('bd-08-4', 'bill-2026-08-ch06', 'Parking', 'Phí Gửi Xe Căn Hộ', 1, 'xe', 141000, 141000, FALSE, NULL),
('bd-08-5', 'bill-2026-08-ch06', 'Internet', 'Cáp Quang Internet VNPT Fiber 300Mbps', 1, 'tháng', 220000, 220000, FALSE, NULL);

-- Chi tiết hóa đơn Tháng 07/2026
INSERT INTO bill_details (id, bill_id, service_type, service_name, usage, unit, unit_price, total_line_amount, ai_anomaly, anomaly_reason) VALUES 
('bd-07-1', 'bill-2026-07-ch06', 'Electricity', 'Tiền Điện Sinh Hoạt', 280, 'kWh', 3200, 896000, FALSE, NULL),
('bd-07-2', 'bill-2026-07-ch06', 'Water', 'Tiền Nước Sinh Hoạt', 18, 'm³', 18000, 324000, FALSE, NULL),
('bd-07-3', 'bill-2026-07-ch06', 'Management_Fee', 'Phí Quản Lý Vận Hành', 73.2, 'm²', 10000, 732000, FALSE, NULL),
('bd-07-4', 'bill-2026-07-ch06', 'Parking', 'Phí Gửi Xe Căn Hộ', 1, 'xe', 198000, 198000, FALSE, NULL),
('bd-07-5', 'bill-2026-07-ch06', 'Internet', 'Cáp Quang Internet VNPT Fiber 300Mbps', 1, 'tháng', 220000, 220000, FALSE, NULL);

-- ============================================================================
-- DỮ LIỆU MẪU PHIẾU BÁO HỎNG & KỸ THUẬT (SERVICE_TICKETS)
-- Phân loại chuẩn 3 luồng: REPAIR (KTV) | INQUIRY (AI 24/7) | FEEDBACK (BQL)
-- ============================================================================
INSERT INTO service_tickets (
    id, apartment_code, resident_name, resident_phone, content, ai_category, ai_priority, priority_color, 
    sla_deadline, status, ticket_type, handled_by, ai_reply, ai_replied_at, admin_reply, admin_replied_at, 
    admin_replied_by, assigned_technician_id, assigned_technician_name, assigned_technician_phone, 
    rating, resident_feedback, rated_at, before_image, after_image, auto_dispatched, created_at, resolved_at
) VALUES 
-- 1. Ticket 925: Nhà hàng - Vệ sinh bàn ghế tầng 1 sau tiệc tối
('TICK-925', 'CH-06', 'Trần Hữu Lực', '0364967082', 
 'Nhà hàng - Vệ sinh bàn ghế nhà hàng tầng 1 sau sự kiện tiệc tối.', 
 'Nhà hàng', 2, '#3B82F6', '2026-08-28 18:00:00+07', 'Resolved', 
 'FEEDBACK', 'MANAGEMENT', NULL, NULL, 
 'VinHomes Manager đã tiếp nhận phản ánh và đội ngũ tạp vụ đã hoàn tất vệ sinh, sắp xếp lại không gian nhà hàng tầng 1 sạch sẽ.', 
 '2026-08-28 16:30:00+07', 'VinHomes Manager', 
 'user-tech-1', 'Trần Đình Trọng', '0901888998', 
 5, 'Khu vực nhà hàng đã được dọn sạch sẽ, cảm ơn BQL.', '2026-08-28 17:00:00+07', 
 NULL, NULL, 925, FALSE, '2026-08-27 10:00:00+07', '2026-08-28 16:30:00+07'),

-- 2. Ticket 924: Hồ bơi - Kiểm tra chất lượng nước & bảo dưỡng hệ thống lọc
('TICK-924', 'CH-06', 'Trần Hữu Lực', '0364967082', 
 'Hồ bơi - Kiểm tra chất lượng nước hồ bơi định kỳ và bảo dưỡng hệ thống lọc.', 
 'Hồ bơi', 2, '#06B6D4', '2026-08-28 12:00:00+07', 'Resolved', 
 'REPAIR', 'TECHNICIAN', NULL, NULL, NULL, NULL, 'VinHomes Manager', 
 'user-tech-1', 'Trần Đình Trọng', '0901888998', 
 5, 'Nước hồ bơi sạch và trong lành, quy trình bảo dưỡng rất chuẩn.', '2026-08-28 11:30:00+07', 
 NULL, NULL, 924, TRUE, '2026-08-27 08:30:00+07', '2026-08-28 11:00:00+07'),

-- 3. Ticket 921: Vệ sinh Block 07 - Tập kết rác & phun khử khuẩn
('TICK-921', 'CH-06', 'Trần Hữu Lực', '0364967082', 
 'Vệ sinh Block 07 - Tập kết rác thải Block 07 và phun khử khuẩn khu kỹ thuật.', 
 'Vệ sinh', 3, '#10B981', '2026-08-27 17:00:00+07', 'Resolved', 
 'REPAIR', 'TECHNICIAN', NULL, NULL, NULL, NULL, 'VinHomes Manager', 
 'user-tech-2', 'Lê Quốc Tuấn', '0909888777', 
 5, 'Khu gom rác sạch sẽ, không còn mùi hôi, khử khuẩn chu đáo.', '2026-08-27 16:00:00+07', 
 NULL, NULL, 921, TRUE, '2026-08-26 14:00:00+07', '2026-08-27 15:30:00+07');

-- ============================================================================
-- DỮ LIỆU MẪU BẢNG TIN TÒA NHÀ (COMMUNITY_POSTS) - dataStore.ts
-- ============================================================================
INSERT INTO community_posts (
    id, author_id, author_name, author_role, apt_code, title, content, category, ai_moderation, ai_sentiment, tags, likes, comments_count, is_pinned, created_at
) VALUES 
('post-1', 'user-manager-1', 'Ban Quản Lý Tòa Nhà SKYLINE', 'BQL', NULL, 
 'Thông báo lịch bảo dưỡng định kỳ hệ thống thang máy Otis Tòa BS-07', 
 'Ban Quản lý xin thông báo kế hoạch kiểm tra kỹ thuật định kỳ thang máy số 02 vào ngày 28/08/2026 từ 09:00 - 11:30. Kính mong Quý cư dân sử dụng thang số 01 và 03 trong thời gian trên.', 
 'Bảo trì', 'Clean', 0.85, ARRAY['Bảo trì', 'Thông báo BQL', 'Thang máy'], 42, 5, TRUE, '2026-08-25 10:00:00+07'),

('post-2', 'user-owner-1', 'Trần Hữu Lực (Căn CH-06)', 'Cư dân', 'CH-06', 
 'Trao đổi lại bộ bàn ghế đọc sách ban công bằng gỗ sồi còn mới 95%', 
 'Gia đình mình vừa thay đổi nội thất nên muốn nhượng lại bộ bàn ghế ban công gọn nhẹ cho bác nào có nhu cầu, có thể qua xem trực tiếp tại căn CH-06.', 
 'Cộng đồng', 'Clean', 0.92, ARRAY['Rao vặt', 'Nội thất', 'Cộng đồng'], 18, 3, FALSE, '2026-08-26 11:30:00+07');

-- ============================================================================
-- DỮ LIỆU MẪU BIỂU QUYẾT & LẤY Ý KIẾN CƯ DÂN (VOTING_TOPICS) - votingStore.ts
-- ============================================================================
INSERT INTO voting_topics (
    id, code, title, description, legal_type, created_by, deadline, status, is_owner_only, total_eligible_apartments, total_votes, summary_report, created_at
) VALUES 
('vote-01', 'BQ-2026-01', 
 'Biểu quyết Thông qua Phương án Nâng cấp Hệ thống Kiểm soát Xe Tự Động Hầm B1 - B2', 
 'Chiến dịch lấy ý kiến hợp pháp của các Chủ sở hữu căn hộ về việc trích Quỹ Bảo trì để trang bị camera AI LPR đọc biển số tự động tốc độ cao và mở rộng làn xe máy giờ cao điểm tại Hầm B1/B2 Tòa BS-07. Dự toán thực hiện: 150.000.000 VNĐ theo báo giá cạnh tranh.', 
 'Đóng góp Quỹ Bảo trì', 'Ban Quản Trị & Kỹ Thuật Tòa Nhà', '2026-10-15 23:59:59+07', 'OPEN', TRUE, 200, 1, 
 'Hệ thống kiểm soát xe hiện tại vào giờ cao điểm thường ùn ứ 3-5 phút. Việc nâng cấp cảm biến RFID tầm xa và camera AI giúp giải phóng xe trong dưới 0.3s/lượt.', '2026-08-20 08:00:00+07'),

('vote-02', 'BQ-2026-02', 
 'Lấy ý kiến Điều chỉnh Giờ giấc Hoạt động Khu Thể Thao & Tiện Ích Nội Khu The Tropical', 
 'Theo đề xuất của cư dân về việc tăng thời gian tập luyện buổi tối, Ban Quản Lý xin ý kiến biểu quyết kéo dài giờ hoạt động sân thể thao và tiện ích nội khu đến 22:30 hàng ngày.', 
 'Quy Chế Chung Cư', 'Bộ Phận Vận Hành Ban Quản Lý', '2026-10-20 23:59:59+07', 'OPEN', FALSE, 200, 0, 
 'Đội bảo vệ cam kết tuần tra kiểm soát tiếng ồn sau 22:00 nhằm đảm bảo không gian yên tĩnh và nghỉ ngơi cho các tầng căn hộ xung quanh.', '2026-09-01 08:00:00+07'),

('vote-03', 'BQ-2026-03', 
 'Hội nghị Nhà Chung Cư: Lựa chọn Đơn vị Quản lý Vận hành Chung Cư Giai đoạn 2026 - 2028', 
 'Biểu quyết lựa chọn đơn vị trúng thầu cung cấp dịch vụ quản lý vận hành tòa nhà tiêu chuẩn cao cấp giữa các nhà thầu đã vượt qua vòng thẩm định hồ sơ năng lực.', 
 'Bầu Ban Quản Trị', 'Hội Nghị Nhà Chung Cư', '2026-10-30 23:59:59+07', 'OPEN', TRUE, 200, 0, 
 'Toàn bộ hồ sơ đề xuất kỹ thuật, cam kết SLA bảo trì và báo cáo tài chính của 3 đơn vị đã được niêm yết công khai.', '2026-09-05 09:00:00+07');

-- Tùy chọn biểu quyết
INSERT INTO voting_options (id, topic_id, option_text, votes_count) VALUES 
('opt-1-1', 'vote-01', 'Đồng ý phương án nâng cấp (Dự toán 150 triệu VNĐ từ Quỹ Bảo trì)', 1),
('opt-1-2', 'vote-01', 'Không đồng ý, giữ nguyên hiện trạng kiểm soát thủ công', 0),
('opt-1-3', 'vote-01', 'Đồng ý nhưng yêu cầu điều chỉnh giảm dự toán xuống dưới 120 triệu VNĐ', 0),

('opt-2-1', 'vote-02', 'Nhất trí kéo dài mở cửa đến 22:30 tất cả các ngày trong tuần', 0),
('opt-2-2', 'vote-02', 'Chỉ kéo dài đến 22:30 vào các ngày cuối tuần (Thứ Sáu, Thứ Bảy, Chủ Nhật)', 0),
('opt-2-3', 'vote-02', 'Giữ nguyên khung giờ đóng cửa lúc 21:30 để đảm bảo yên tĩnh', 0),

('opt-3-1', 'vote-03', 'Công ty Quản Lý Bất Động Sản Skyline Living Pro (Giá thầu: 11.000 đ/m²)', 0),
('opt-3-2', 'vote-03', 'Tập đoàn Quản lý Bất động sản Savills Việt Nam (Giá thầu: 14.500 đ/m²)', 0),
('opt-3-3', 'vote-03', 'Công ty Cổ phần Dịch vụ Đô thị CBRE Property (Giá thầu: 13.800 đ/m²)', 0);

-- Bản ghi lá phiếu của Chủ hộ Trần Hữu Lực căn CH-06
INSERT INTO voting_records (id, topic_id, apartment_code, voter_name, option_id, voted_at) VALUES 
('vr-01', 'vote-01', 'CH-06', 'Trần Hữu Lực', 'opt-1-1', CURRENT_TIMESTAMP - INTERVAL '2 days');

-- ============================================================================
-- DỮ LIỆU MẪU HỘI THOẠI SKYLINE AI CONCIERGE (AI_CHAT_CONVERSATIONS)
-- ============================================================================
INSERT INTO ai_chat_conversations (id, user_id, apartment_code, summary, started_at) VALUES 
('conv-01', 'user-owner-1', 'CH-06', 'Hỏi đáp biểu phí gửi xe và đặt lịch phòng xông hơi VIP', CURRENT_TIMESTAMP - INTERVAL '2 days');

INSERT INTO ai_chat_messages (id, conversation_id, sender, text, sent_at) VALUES 
('msg-01', 'conv-01', 'user', 'Phòng xông hơi đá muối Himalaya mở cửa đến mấy giờ và giá thế nào em?', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('msg-02', 'conv-01', 'ai', 'Dạ chào Anh Lực! Phòng xông hơi đá muối Himalaya VIP tại Tầng 3 mở cửa từ 08:00 đến 22:00 hàng ngày. Giá dịch vụ dành riêng cho cư dân là 500.000 đ/giờ cho phòng gia đình riêng tư. Anh có muốn em đặt chỗ tối nay luôn không ạ?', CURRENT_TIMESTAMP - INTERVAL '2 days');

-- ============================================================================
-- CÁC VIEW BÁO CÁO PHÂN TÍCH NGHIỆP VỤ (ANALYTIC VIEWS)
-- ============================================================================

-- 1. Báo cáo Bảng Lương & Thù Lao Kỹ Thuật Viên Thực Tế
CREATE OR REPLACE VIEW v_technician_payroll_report AS
SELECT 
    t.id AS technician_id,
    t.name AS technician_name,
    t.phone,
    t.specialty,
    t.base_salary,
    COUNT(st.id) FILTER (WHERE st.status = 'Resolved') AS completed_tickets_count,
    COUNT(st.id) FILTER (WHERE st.status = 'Resolved' AND st.rating = 5) AS five_star_count,
    COALESCE(ROUND(AVG(st.rating) FILTER (WHERE st.status = 'Resolved'), 1), 5.0) AS avg_rating,
    (COUNT(st.id) FILTER (WHERE st.status = 'Resolved') * t.pay_per_ticket) AS ticket_bonus_total,
    (COUNT(st.id) FILTER (WHERE st.status = 'Resolved' AND st.rating = 5) * t.bonus_per_fivestar) AS five_star_bonus_total,
    (t.base_salary 
     + (COUNT(st.id) FILTER (WHERE st.status = 'Resolved') * t.pay_per_ticket)
     + (COUNT(st.id) FILTER (WHERE st.status = 'Resolved' AND st.rating = 5) * t.bonus_per_fivestar)) AS total_income
FROM technicians t
LEFT JOIN service_tickets st ON t.id = st.assigned_technician_id
GROUP BY t.id, t.name, t.phone, t.specialty, t.base_salary, t.pay_per_ticket, t.bonus_per_fivestar;

COMMENT ON VIEW v_technician_payroll_report IS 'Báo cáo tính lương thù lao động của KTV theo ca sửa và thưởng 5 sao';

-- 2. Báo cáo Phân Loại Ticket (Tỷ lệ xử lý giữa AI, Ban Quản Lý và Kỹ Thuật Viên)
CREATE OR REPLACE VIEW v_ticket_classification_analytics AS
SELECT 
    ticket_type,
    handled_by,
    COUNT(*) AS total_tickets,
    COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved_tickets,
    ROUND(COUNT(*) FILTER (WHERE status = 'Resolved') * 100.0 / NULLIF(COUNT(*), 0), 1) AS resolution_rate_percent,
    COALESCE(ROUND(AVG(rating) FILTER (WHERE rating IS NOT NULL), 1), 5.0) AS avg_satisfaction_rating
FROM service_tickets
GROUP BY ticket_type, handled_by;

COMMENT ON VIEW v_ticket_classification_analytics IS 'Thống kê phân loại ticket theo vai trò xử lý: AI 24/7 vs BQL vs KTV';

-- 3. Báo cáo Tổng Quan Doanh Thu Phí Căn Hộ Theo Tháng
CREATE OR REPLACE VIEW v_apartment_billing_overview AS
SELECT 
    b.billing_month,
    COUNT(b.id) AS total_bills,
    SUM(b.total_amount) AS total_revenue,
    SUM(CASE WHEN b.status = 'Paid' THEN b.total_amount ELSE 0 END) AS collected_revenue,
    SUM(CASE WHEN b.status = 'Unpaid' THEN b.total_amount ELSE 0 END) AS outstanding_revenue,
    COUNT(b.id) FILTER (WHERE b.has_ai_anomaly = TRUE) AS ai_anomaly_count
FROM bills b
GROUP BY b.billing_month
ORDER BY b.billing_month DESC;

COMMENT ON VIEW v_apartment_billing_overview IS 'Báo cáo thu phí dịch vụ căn hộ và tỷ lệ cảnh báo rò rỉ nước AI';

-- ============================================================================
-- KẾT THÚC SCRIPT DDL, DML & ANALYTIC VIEWS CHUẨN MỰC SKYLINE SMART RESIDENCE
-- ============================================================================

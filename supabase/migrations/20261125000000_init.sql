-- ============================================================================
-- CHUNG CƯ CAO CẤP SKYLINE SMART RESIDENCE & THE TROPICAL (BEVERLY SOLARI)
-- HỆ CƠ SỞ DỮ LIỆU POSTGRESQL CHUẨN MỰC TOÀN DIỆN (DDL + INDEXES + ANALYTIC VIEWS)
-- Đồng bộ 100% với lib/db/schema.ts và database/seed_data.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- XÓA VIEW VÀ BẢNG CŨ THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI
-- ============================================================================
DROP VIEW IF EXISTS v_apartment_billing_overview CASCADE;
DROP VIEW IF EXISTS v_ticket_classification_analytics CASCADE;
DROP VIEW IF EXISTS v_technician_payroll_report CASCADE;

DROP TABLE IF EXISTS ai_chat_messages CASCADE;
DROP TABLE IF EXISTS ai_chat_conversations CASCADE;
DROP TABLE IF EXISTS voting_records CASCADE;
DROP TABLE IF EXISTS voting_options CASCADE;
DROP TABLE IF EXISTS voting_topics CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS service_tickets CASCADE;
DROP TABLE IF EXISTS meter_readings CASCADE;
DROP TABLE IF EXISTS bill_details CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS visitor_gate_logs CASCADE;
DROP TABLE IF EXISTS visitor_passes CASCADE;
DROP TABLE IF EXISTS resident_service_bookings CASCADE;
DROP TABLE IF EXISTS facility_access_logs CASCADE;
DROP TABLE IF EXISTS facility_bookings CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS parking_slots CASCADE;
DROP TABLE IF EXISTS smart_door_access_logs CASCADE;
DROP TABLE IF EXISTS smart_guest_pins CASCADE;
DROP TABLE IF EXISTS smart_automation_rules CASCADE;
DROP TABLE IF EXISTS smart_devices CASCADE;
DROP TABLE IF EXISTS face_enrollments CASCADE;
DROP TABLE IF EXISTS ekyc_submissions CASCADE;
DROP TABLE IF EXISTS technicians CASCADE;
DROP TABLE IF EXISTS apartment_members CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;
DROP TABLE IF EXISTS floors CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;
DROP TABLE IF EXISTS condominiums CASCADE;

-- ============================================================================
-- 1. BẢNG THÔNG TIN TỔNG THỂ DỰ ÁN CHUNG CƯ (CONDOMINIUMS)
-- ============================================================================
CREATE TABLE condominiums (
    id SERIAL PRIMARY KEY,
    condo_code VARCHAR(50) UNIQUE NOT NULL DEFAULT 'SKYLINE_RESIDENCE',
    condo_name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    total_floors INT NOT NULL DEFAULT 39,
    basement_floors INT NOT NULL DEFAULT 2,
    total_apartments INT NOT NULL DEFAULT 850,
    investor VARCHAR(150) NOT NULL,
    management_company VARCHAR(150) NOT NULL,
    hotline VARCHAR(50) DEFAULT '1900 8899',
    handover_year INT DEFAULT 2026,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. BẢNG KHỐI NHÀ / TÒA NHÀ (BLOCKS) - The Tropical (BS-07 .. BS-10)
-- ============================================================================
CREATE TABLE blocks (
    id INT PRIMARY KEY,
    condo_id INT NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
    block_code VARCHAR(30) UNIQUE NOT NULL,
    block_name VARCHAR(150) NOT NULL,
    total_floors INT NOT NULL DEFAULT 34,
    manager_name VARCHAR(150) DEFAULT 'VinHomes Manager',
    manager_phone VARCHAR(20) DEFAULT '0901888999',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. BẢNG MẶT BẰNG TẦNG (FLOORS)
-- ============================================================================
CREATE TABLE floors (
    floor_number INT PRIMARY KEY,
    floor_code VARCHAR(20) UNIQUE NOT NULL,
    floor_name VARCHAR(150) NOT NULL,
    floor_type VARCHAR(50) NOT NULL CHECK (floor_type IN ('BASEMENT', 'COMMERCIAL_AMENITY', 'RESIDENTIAL', 'ROOFTOP_AMENITY')),
    floor_function TEXT NOT NULL,
    units_count INT DEFAULT 0,
    condo_id INT NOT NULL REFERENCES condominiums(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. BẢNG CĂN HỘ CHUNG CƯ (APARTMENTS)
-- ============================================================================
CREATE TABLE apartments (
    id VARCHAR(50) PRIMARY KEY,
    apt_code VARCHAR(30) UNIQUE NOT NULL,
    block_id INT REFERENCES blocks(id) ON DELETE SET NULL,
    tower_code VARCHAR(20) NOT NULL DEFAULT 'BS-07' CHECK (tower_code IN ('BS-07', 'BS-08', 'BS-09', 'BS-10', 'A', 'B')),
    floor_number INT NOT NULL REFERENCES floors(floor_number) ON DELETE RESTRICT,
    wing VARCHAR(20) DEFAULT 'SOUTH' CHECK (wing IN ('NORTH', 'SOUTH', 'WEST', 'CENTRAL', 'EAST')),
    apt_type VARCHAR(30) NOT NULL CHECK (apt_type IN ('STUDIO', '1PN', '2PN', '3PN', 'DUPLEX_PENTHOUSE')),
    type_label VARCHAR(100) NOT NULL,
    wall_area NUMERIC(6, 2) NOT NULL,
    clear_area NUMERIC(6, 2) NOT NULL,
    bedrooms INT NOT NULL DEFAULT 2,
    bathrooms INT NOT NULL DEFAULT 2,
    balcony_direction VARCHAR(100) DEFAULT 'Đông Nam',
    main_door_direction VARCHAR(100) DEFAULT 'Tây Bắc',
    price_billion NUMERIC(6, 2) NOT NULL,
    price_vnd NUMERIC(15, 2) NOT NULL,
    legal_status VARCHAR(50) DEFAULT 'Pink_Book',
    status VARCHAR(30) NOT NULL DEFAULT 'VACANT' CHECK (status IN ('OCCUPIED', 'VACANT', 'MAINTENANCE', 'HANDOVER_PENDING')),
    owner_id VARCHAR(50),
    handover_date DATE,
    handover_protocol VARCHAR(100),
    description TEXT,
    vehicles JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. BẢNG TÀI KHOẢN NGƯỜI DÙNG & CƯ DÂN (USERS)
-- ============================================================================
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'OWNER', 'TENANT', 'TECHNICIAN', 'RECEPTIONIST')),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) DEFAULT '12345678',
    id_card_no VARCHAR(20),
    id_date DATE,
    id_place VARCHAR(150),
    dob DATE,
    pob VARCHAR(150),
    gender SMALLINT DEFAULT 1 CHECK (gender IN (0, 1)),
    apartment_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE SET NULL,
    relationship VARCHAR(50) DEFAULT 'Owner' CHECK (relationship IN ('Owner', 'Family', 'Tenant', 'Staff')),
    license_plate VARCHAR(30),
    avatar_url TEXT,
    face_vector TEXT,
    emergency_phone VARCHAR(20),
    ekyc_approved BOOLEAN DEFAULT TRUE,
    ui_language VARCHAR(10) DEFAULT 'vi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    email VARCHAR(100),
    id_card VARCHAR(20),
    id_date VARCHAR(30),
    id_place VARCHAR(150),
    dob VARCHAR(30),
    gender VARCHAR(20),
    pob VARCHAR(150),
    relationship VARCHAR(100) NOT NULL,
    role VARCHAR(30) DEFAULT 'Family' CHECK (role IN ('Family', 'Tenant')),
    license_plate VARCHAR(30),
    vehicle_type VARCHAR(30),
    face_status VARCHAR(50) DEFAULT 'Đã xác thực',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. BẢNG HỒ SƠ & BẢNG LƯƠNG KỸ THUẬT VIÊN (TECHNICIANS)
-- ============================================================================
CREATE TABLE technicians (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    specialty VARCHAR(150) NOT NULL,
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 8500000,
    pay_per_ticket NUMERIC(12, 2) NOT NULL DEFAULT 150000,
    bonus_per_fivestar NUMERIC(12, 2) NOT NULL DEFAULT 50000,
    status VARCHAR(30) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BUSY', 'OFF_DUTY')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. BẢNG HỒ SƠ XÁC THỰC ĐỊNH DANH EKYC (EKYC_SUBMISSIONS)
-- ============================================================================
CREATE TABLE ekyc_submissions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    role_label VARCHAR(150) NOT NULL,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    id_card_no VARCHAR(20) NOT NULL,
    id_date VARCHAR(30),
    id_place VARCHAR(150),
    dob VARCHAR(30),
    pob VARCHAR(150),
    face_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    avatar_url TEXT NOT NULL,
    id_card_front_url TEXT,
    id_card_back_url TEXT,
    face_samples JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'VERIFIED', 'PENDING_OWNER')),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(150),
    rejection_reason TEXT,
    is_simulation BOOLEAN DEFAULT FALSE,
    algorithm VARCHAR(100)
);

-- ============================================================================
-- 9. BẢNG ĐĂNG KÝ SINH TRẮC HỌC KHUÔN MẶT (FACE_ENROLLMENTS)
-- ============================================================================
CREATE TABLE face_enrollments (
    user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    full_name VARCHAR(150) NOT NULL,
    apartment_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE SET NULL,
    avatar_url TEXT,
    descriptor JSONB NOT NULL DEFAULT '[]'::jsonb,
    face_score NUMERIC(5, 2),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'PENDING_OWNER', 'REVOKED')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    samples JSONB,
    metadata JSONB
);

-- ============================================================================
-- 10. BẢNG THIẾT BỊ NHÀ THÔNG MINH IOT (SMART_DEVICES)
-- ============================================================================
CREATE TABLE smart_devices (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('light', 'ac', 'door', 'curtain', 'sensor')),
    status VARCHAR(50) NOT NULL DEFAULT 'off',
    set_value NUMERIC(5, 1) DEFAULT 0,
    location_x NUMERIC(5, 2) DEFAULT 0,
    location_y NUMERIC(5, 2) DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. BẢNG KỊCH BẢN TỰ ĐỘNG HÓA THÔNG MINH (SMART_AUTOMATION_RULES)
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

-- ============================================================================
-- 12. BẢNG MÃ PIN TẠM THỜI MỞ CỬA CHO KHÁCH (SMART_GUEST_PINS)
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

-- ============================================================================
-- 13. BẢNG NHẬT KÝ MỞ KHÓA THÔNG MINH (SMART_DOOR_ACCESS_LOGS)
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

-- ============================================================================
-- 14. BẢNG BÃI ĐỖ XE THÔNG MINH (PARKING_SLOTS) -- chưa dùng
-- ============================================================================
CREATE TABLE parking_slots (
    id VARCHAR(50) PRIMARY KEY,
    slot_code VARCHAR(30) UNIQUE NOT NULL,
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

-- ============================================================================
-- 15. BẢNG TIỆN ÍCH 5 SAO CHUNG CƯ (FACILITIES)
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

-- ============================================================================
-- 16. BẢNG ĐẶT CHỖ TIỆN ÍCH (FACILITY_BOOKINGS)
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
    status VARCHAR(30) DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'PENDING', 'CHECKED_IN', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 17. BẢNG LỊCH SỬ VÀO TIỆN ÍCH (FACILITY_ACCESS_LOGS) -- chưa dùng
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

-- ============================================================================
-- 18. BẢNG ĐẶT DỊCH VỤ CƯ DÂN (RESIDENT_SERVICE_BOOKINGS)
-- ============================================================================
CREATE TABLE resident_service_bookings (
    id VARCHAR(50) PRIMARY KEY,
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    apt_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    service_id VARCHAR(50) NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    resident_name VARCHAR(150) NOT NULL,
    resident_phone VARCHAR(20) NOT NULL,
    scheduled_time VARCHAR(100) NOT NULL,
    notes TEXT,
    total_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    assigned_staff VARCHAR(150),
    staff_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 19. BẢNG THẺ KHÁCH THĂM (VISITOR_PASSES)
-- ============================================================================
CREATE TABLE visitor_passes (
    id VARCHAR(50) PRIMARY KEY,
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
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    checked_in_at VARCHAR(100),
    checked_out_at VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 20. BẢNG NHẬT KÝ RA VÀO CỔNG KHÁCH (VISITOR_GATE_LOGS)
-- ============================================================================
CREATE TABLE visitor_gate_logs (
    id VARCHAR(50) PRIMARY KEY,
    pass_id VARCHAR(50) REFERENCES visitor_passes(id) ON DELETE SET NULL,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    host_name VARCHAR(150),
    visitor_name VARCHAR(150),
    license_plate VARCHAR(30),
    action VARCHAR(30) NOT NULL CHECK (action IN ('SCAN', 'CHECK_IN', 'CHECK_OUT')),
    result VARCHAR(30) NOT NULL CHECK (result IN ('VALID', 'INVALID', 'DENIED', 'EXPIRED')),
    checkpoint VARCHAR(100) DEFAULT 'Sảnh Lễ Tân / Chốt An Ninh',
    notes TEXT,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 21. BẢNG HÓA ĐƠN DỊCH VỤ SINH HOẠT (BILLS)
-- ============================================================================
CREATE TABLE bills (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    owner_name VARCHAR(150) NOT NULL,
    billing_month VARCHAR(30) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Unpaid' CHECK (status IN ('Draft', 'Unpaid', 'Partial', 'Paid', 'Overdue')),
    payment_method VARCHAR(30) CHECK (payment_method IN ('VNPAY', 'MOMO', 'VIETQR', 'BANK_TRANSFER')),
    transaction_ref VARCHAR(100),
    payment_qr_url TEXT,
    invoice_pdf_url TEXT,
    has_ai_anomaly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 22. BẢNG CHI TIẾT DỊCH VỤ HÓA ĐƠN (BILL_DETAILS) -- chưa dùng (nhúng trong BillRecord.details ở TS)
-- ============================================================================
CREATE TABLE bill_details (
    id VARCHAR(50) PRIMARY KEY,
    bill_id VARCHAR(50) NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    usage NUMERIC(10, 2),
    unit VARCHAR(30) DEFAULT 'lần',
    unit_price NUMERIC(12, 2),
    total_line_amount NUMERIC(15, 2) NOT NULL,
    ai_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_reason TEXT
);

-- ============================================================================
-- 23. BẢNG CHỈ SỐ CÔNG TƠ ĐIỆN NƯỚC OCR (METER_READINGS)
-- ============================================================================
CREATE TABLE meter_readings (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    meter_type VARCHAR(20) NOT NULL CHECK (meter_type IN ('ELECTRIC', 'WATER')),
    reading NUMERIC(12, 2) NOT NULL,
    previous_reading NUMERIC(12, 2),
    consumption NUMERIC(12, 2),
    period VARCHAR(50) NOT NULL,
    image_url TEXT,
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.0,
    verified_by VARCHAR(150),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED'))
);

-- ============================================================================
-- 24. BẢNG PHIẾU BÁO HỎNG & KỸ THUẬT (SERVICE_TICKETS)
-- ============================================================================
CREATE TABLE service_tickets (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    resident_name VARCHAR(150) NOT NULL,
    resident_phone VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    ai_category VARCHAR(50) NOT NULL,
    ai_priority INT DEFAULT 2 CHECK (ai_priority IN (1, 2, 3)),
    priority_color VARCHAR(20) DEFAULT '#D97706',
    sla_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Assigned', 'In_Progress', 'Resolved')),
    ticket_type VARCHAR(50) NOT NULL DEFAULT 'REPAIR' CHECK (ticket_type IN ('REPAIR', 'INQUIRY', 'FEEDBACK', 'SERVICE')),
    ticket_type_label VARCHAR(100),
    handled_by VARCHAR(50) NOT NULL DEFAULT 'TECHNICIAN' CHECK (handled_by IN ('AI', 'MANAGEMENT', 'TECHNICIAN')),
    ai_reply TEXT,
    ai_replied_at TIMESTAMP WITH TIME ZONE,
    admin_reply TEXT,
    admin_replied_at TIMESTAMP WITH TIME ZONE,
    admin_replied_by VARCHAR(150) DEFAULT 'Ban Quản Lý Chung Cư Skyline',
    assigned_technician_id VARCHAR(30) REFERENCES technicians(id) ON DELETE SET NULL,
    assigned_technician_name VARCHAR(150),
    assigned_technician_phone VARCHAR(20),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    auto_dispatched BOOLEAN DEFAULT FALSE,
    ai_dispatch_reason TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    resident_feedback TEXT,
    rated_at TIMESTAMP WITH TIME ZONE,
    before_image TEXT,
    after_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 25. BẢNG BẢNG TIN TÒA NHÀ (COMMUNITY_POSTS)
-- ============================================================================
CREATE TABLE community_posts (
    id VARCHAR(50) PRIMARY KEY,
    author_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(150) NOT NULL,
    author_role VARCHAR(50) DEFAULT 'BQL',
    apt_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE SET NULL,
    avatar_url TEXT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Thông báo',
    ai_moderation VARCHAR(30) DEFAULT 'Clean' CHECK (ai_moderation IN ('Clean', 'Toxic', 'Pending', 'Warning')),
    ai_sentiment NUMERIC(3, 2) DEFAULT 0.85,
    tags TEXT[],
    likes INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 26. BẢNG BIỂU QUYẾT & LẤY Ý KIẾN CƯ DÂN (VOTING_TOPICS)
-- ============================================================================
CREATE TABLE voting_topics (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
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

-- ============================================================================
-- 27. BẢNG TÙY CHỌN BIỂU QUYẾT (VOTING_OPTIONS) -- chưa dùng (nhúng trong VotingTopicRecord.options ở TS)
-- ============================================================================
CREATE TABLE voting_options (
    id VARCHAR(50) PRIMARY KEY,
    topic_id VARCHAR(50) NOT NULL REFERENCES voting_topics(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    votes_count INT DEFAULT 0
);

-- ============================================================================
-- 28. BẢNG LÁ PHIẾU BIỂU QUYẾT (VOTING_RECORDS)
-- ============================================================================
CREATE TABLE voting_records (
    id VARCHAR(50) PRIMARY KEY,
    topic_id VARCHAR(50) NOT NULL REFERENCES voting_topics(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    voter_name VARCHAR(150) DEFAULT 'Cư dân',
    option_id VARCHAR(50) NOT NULL REFERENCES voting_options(id) ON DELETE CASCADE,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_voting_apartment UNIQUE (topic_id, apartment_code)
);

-- ============================================================================
-- 29. BẢNG HỘI THOẠI SKYLINE AI CONCIERGE (AI_CHAT_CONVERSATIONS) -- chưa dùng
-- ============================================================================
CREATE TABLE ai_chat_conversations (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    apartment_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE CASCADE,
    summary VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 30. BẢNG TIN NHẮN SKYLINE AI CONCIERGE (AI_CHAT_MESSAGES) -- chưa dùng
-- ============================================================================
CREATE TABLE ai_chat_messages (
    id VARCHAR(50) PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'ai')),
    text TEXT NOT NULL,
    is_fallback BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CÁC CHỈ MỤC TỐI ƯU HÓA TRUY VẤN (INDEXES)
-- ============================================================================
CREATE INDEX idx_apartments_floor ON apartments(floor_number);
CREATE INDEX idx_apartments_owner ON apartments(owner_id);
CREATE INDEX idx_apartments_block ON apartments(block_id);
CREATE INDEX idx_users_apt ON users(apartment_code);
CREATE INDEX idx_members_apt ON apartment_members(apartment_code);
CREATE INDEX idx_ekyc_user ON ekyc_submissions(user_id);
CREATE INDEX idx_ekyc_apt ON ekyc_submissions(apartment_code);
CREATE INDEX idx_ekyc_status ON ekyc_submissions(status);
CREATE INDEX idx_devices_apt ON smart_devices(apartment_code);
CREATE INDEX idx_rules_apt ON smart_automation_rules(apartment_code);
CREATE INDEX idx_guest_pins_apt ON smart_guest_pins(apartment_code);
CREATE INDEX idx_door_logs_apt ON smart_door_access_logs(apartment_code);
CREATE INDEX idx_parking_apt ON parking_slots(apartment_code);
CREATE INDEX idx_parking_floor ON parking_slots(floor_number);
CREATE INDEX idx_facilities_floor ON facilities(floor_number);
CREATE INDEX idx_bookings_apt ON facility_bookings(apartment_code);
CREATE INDEX idx_bookings_fac ON facility_bookings(facility_id);
CREATE INDEX idx_resident_bookings_apt ON resident_service_bookings(apt_code);
CREATE INDEX idx_passes_apt ON visitor_passes(apartment_code);
CREATE INDEX idx_gate_logs_pass ON visitor_gate_logs(pass_id);
CREATE INDEX idx_gate_logs_apt ON visitor_gate_logs(apartment_code);
CREATE INDEX idx_bills_apt ON bills(apartment_code);
CREATE INDEX idx_bill_details_bill ON bill_details(bill_id);
CREATE INDEX idx_meter_readings_apt ON meter_readings(apartment_code);
CREATE INDEX idx_tickets_apt ON service_tickets(apartment_code);
CREATE INDEX idx_tickets_ktv ON service_tickets(assigned_technician_id);
CREATE INDEX idx_tickets_type ON service_tickets(ticket_type);
CREATE INDEX idx_posts_apt ON community_posts(apt_code);
CREATE INDEX idx_voting_records_topic ON voting_records(topic_id);

-- ============================================================================
-- CÁC VIEW BÁO CÁO PHÂN TÍCH NGHIỆP VỤ (ANALYTIC VIEWS)
-- ============================================================================
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

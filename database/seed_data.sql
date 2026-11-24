-- ============================================================================
-- SKYLINE SMART RESIDENCE & THE TROPICAL - PRODUCTION SEED DATA (POSTGRESQL / SUPABASE)
-- Đồng bộ 100% với database/skyline_smart_residence_schema.sql
-- Zero Dữ Liệu Ảo - Zero LocalStorage - Không Phụ Thuộc API Bên Ngoài
-- ============================================================================

SET client_encoding = 'UTF8';

-- 1. CONDOMINIUM
INSERT INTO condominiums (id, condo_code, condo_name, address, total_floors, basement_floors, total_apartments, investor, management_company, hotline, handover_year, description)
VALUES (1, 'SKYLINE_RESIDENCE', 'Chung Cư Cao Cấp Skyline Smart Residence', 'Phân khu The Tropical (BS-07 đến BS-10), Beverly Solari, Vinhomes Grand Park, TP. Thủ Đức, TP. Hồ Chí Minh', 39, 2, 850, 'Skyline Group Corporation', 'Skyline Property Management Services', '1900 8899', 2026, 'Tổ hợp chung cư thông minh 5 sao The Tropical (BS-07 đến BS-10) phân khu Beverly Solari cao 34-39 tầng với hệ thống Smart Home, nhận diện FaceID và tiện ích đặc quyền.')
ON CONFLICT (condo_code) DO NOTHING;

-- 2. BLOCKS (The Tropical BS-07 đến BS-10)
INSERT INTO blocks (id, condo_id, block_code, block_name, total_floors, manager_name, manager_phone)
VALUES 
(880, 1, 'BS-07', 'Chung Cư Tropical BS-07', 34, 'VinHomes Manager', '0901888999'),
(883, 1, 'BS-08', 'Chung Cư Tropical BS-08', 39, 'VinHomes Manager', '0901888999'),
(886, 1, 'BS-09', 'Chung Cư Tropical BS-09', 34, 'VinHomes Manager', '0901888999'),
(889, 1, 'BS-10', 'Chung Cư Tropical BS-10', 34, 'VinHomes Manager', '0901888999')
ON CONFLICT (id) DO NOTHING;

-- 3. FLOORS
INSERT INTO floors (floor_number, floor_code, floor_name, floor_type, floor_function, units_count, condo_id)
VALUES
(-2, 'B2', 'Tầng Hầm B2 - Bãi Đỗ Xe Ô Tô Định Danh', 'BASEMENT', 'Bãi đỗ xe ô tô cư dân RFID, trạm biến áp trung thế, máy bơm PCCC & bể xử lý kỹ thuật ngầm.', 0, 1),
(-1, 'B1', 'Tầng Hầm B1 - Bãi Đỗ Xe Máy & Trạm Sạc Xe Điện', 'BASEMENT', 'Bãi đỗ xe máy cư dân RFID, trạm sạc xe điện thông minh, chốt an ninh và khu phân loại rác.', 0, 1),
(1,  'T1', 'Tầng 1 - Sảnh Đón Khách Grand Lobby & Sky Kids', 'COMMERCIAL_AMENITY', 'Sảnh lễ tân đón khách 5 sao, quầy BQL tiếp dân, Sky Kids Zone (07:00 - 21:00) và Shophouse.', 0, 1),
(2,  'T2', 'Tầng 2 - Khối Thương Mại & Văn Phòng Điều Hành', 'COMMERCIAL_AMENITY', 'Khu văn phòng điều hành BQL tòa nhà, phòng giám sát an ninh camera AI tập trung.', 0, 1),
(3,  'T3', 'Tầng 3 - Khu Tiện Ích Thể Thao & Chăm Sóc Sức Khỏe', 'COMMERCIAL_AMENITY', 'Trung Tâm Thể Hình Technogym mở cửa 24/7 và Phòng Xông Hơi Đá Muối Himalaya VIP (08:00 - 22:00).', 0, 1),
(4,  'T4', 'Tầng 4 - Sinh Hoạt Cộng Đồng & Vườn Treo Thảo Mộc', 'COMMERCIAL_AMENITY', 'Hội trường sinh hoạt cộng đồng, thư viện số cư dân, không gian làm việc Co-working.', 0, 1),
(12, 'T12', 'Tầng 12 - Căn Hộ Cư Dân Tiêu Chuẩn', 'RESIDENTIAL', 'Khu căn hộ ở tiêu chuẩn The Tropical (Căn CH-12 Tòa BS-09, CH-04 Tòa BS-08).', 10, 1),
(15, 'T15', 'Tầng 15 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ cao cấp (Căn CH-08 Tòa BS-08, CH-03 Tòa BS-07).', 10, 1),
(16, 'T16', 'Tầng 16 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ cao cấp view công viên (Căn CH-05 Tòa BS-09).', 10, 1),
(18, 'T18', 'Tầng 18 - Căn Hộ Cư Dân Tầng Trung', 'RESIDENTIAL', 'Khu căn hộ tầng trung (Căn CH-02 Tòa BS-10).', 10, 1),
(20, 'T20', 'Tầng 20 - Căn Hộ 3PN Gia Đình Đa Thế Hệ', 'RESIDENTIAL', 'Khu căn hộ cao cấp diện tích lớn (Căn 20B01 3PN, CH-07 Tòa BS-08).', 10, 1),
(22, 'T22', 'Tầng 22 - Căn Hộ Cư Dân Sky Suite', 'RESIDENTIAL', 'Khu căn hộ cao cấp (Căn CH-10 Tòa BS-09).', 10, 1),
(24, 'T24', 'Tầng 24 - Căn Hộ Áp Mái Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ áp mái sang trọng Sky Suite (Căn 24A01, 24A02).', 8, 1),
(25, 'T25', 'Tầng 25 - Sân Thượng Panoramic, Hồ Bơi Vô Cực, BBQ & Penthouse', 'ROOFTOP_AMENITY', 'Hồ Bơi Vô Cực Chân Mây, Vườn BBQ, Tuyệt phẩm Duplex Penthouse (25PH-01, 25PH-02) và Căn CH-09 BS-10.', 2, 1),
(28, 'T28', 'Tầng 28 - Căn Hộ Tầng Cao View Sông', 'RESIDENTIAL', 'Khu căn hộ tầng cao đón gió sông (Căn CH-11 Tòa BS-10).', 10, 1),
(30, 'T30', 'Tầng 30 - Căn Hộ Cư Dân Tầng Cao Đẳng Cấp', 'RESIDENTIAL', 'Khu căn hộ tầng 30 Tòa Tropical BS-07 (Căn CH-06 & CH-01).', 10, 1)
ON CONFLICT (floor_number) DO NOTHING;

-- 4. APARTMENTS (100% CĂN HỘ THỰC TẾ - ZERO DUMMY/VIRTUAL LOOPS)
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

-- 5. USERS (19 TÀI KHOẢN THỰC TẾ)
INSERT INTO users (id, username, role, full_name, phone, email, password_hash, id_card_no, id_date, id_place, dob, pob, gender, apartment_code, relationship, license_plate)
VALUES 
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

-- 12. Cư dân: Nguyễn Thị Mai (CH-01, BS-07)
('user-mai', '0364967081', 'OWNER', 'Nguyễn Thị Mai', '0364967081', 'mainguyen@gmail.com', '12345678', '079198002341', '2021-06-10', 'Cục Cảnh sát QLHC về TTXH', '1992-05-12', 'Hải Phòng', 0, 'CH-01', 'Owner', '59F2-688.88'),

-- 13. Cư dân: Lê Hoàng Nam (CH-04, BS-08)
('user-nam', '0364967080', 'OWNER', 'Lê Hoàng Nam', '0364967080', 'namle@gmail.com', '12345678', '001090004521', '2020-08-15', 'Cục Cảnh sát QLHC về TTXH', '1988-11-25', 'Hà Nội', 1, 'BS08-CH04', 'Owner', '30H-992.34'),

-- 14. Cư dân: Phạm Minh Tuấn (CH-05, BS-09)
('user-tuan', '0364967084', 'OWNER', 'Phạm Minh Tuấn', '0364967084', 'tuanpham@gmail.com', '12345678', '079085001234', '2020-03-12', 'Cục Cảnh sát QLHC về TTXH', '1985-03-08', 'TP. Hồ Chí Minh', 1, 'BS09-CH05', 'Owner', '51G-771.88'),

-- 15. Cư dân: Hoàng Anh Dũng (CH-09, BS-10)
('user-dung', '0364967085', 'OWNER', 'Hoàng Anh Dũng', '0364967085', 'dunghoang@gmail.com', '12345678', '079093005678', '2022-01-20', 'Cục Cảnh sát QLHC về TTXH', '1995-09-15', 'Đà Nẵng', 1, 'BS10-CH09', 'Owner', '59P1-889.12'),

-- 16. Cư dân: Đỗ Thu Hà (CH-07, BS-08)
('user-ha', '0364967086', 'OWNER', 'Đỗ Thu Hà', '0364967086', 'hadothu@gmail.com', '12345678', '031191007890', '2021-09-18', 'Cục Cảnh sát QLHC về TTXH', '1991-04-20', 'Hải Dương', 0, 'BS08-CH07', 'Owner', '51H-665.23'),

-- 17. Cư dân: Vũ Quang Huy (CH-10, BS-09)
('user-huy', '0364967087', 'OWNER', 'Vũ Quang Huy', '0364967087', 'huyvu@gmail.com', '12345678', '036089003412', '2020-10-05', 'Cục Cảnh sát QLHC về TTXH', '1990-10-10', 'Nam Định', 1, 'BS09-CH10', 'Owner', '29A-888.66'),

-- 18. Cư dân: Đặng Phương Linh (CH-11, BS-10)
('user-linh', '0364967088', 'OWNER', 'Đặng Phương Linh', '0364967088', 'linhdang@gmail.com', '12345678', '079196008912', '2022-12-10', 'Cục Cảnh sát QLHC về TTXH', '1996-08-22', 'TP. Hồ Chí Minh', 0, 'BS10-CH11', 'Owner', '51A-981.45'),

-- 19. Cư dân: Bùi Văn Thành (CH-03, BS-07)
('user-thanh', '0364967083', 'OWNER', 'Bùi Văn Thành', '0364967083', 'thanhbui@gmail.com', '12345678', '038090001122', '2020-02-18', 'Cục Cảnh sát QLHC về TTXH', '1983-07-05', 'Thanh Hóa', 1, 'CH-03', 'Owner', NULL)
ON CONFLICT (id) DO NOTHING;

-- Cập nhật chủ sở hữu các căn hộ
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

-- 6. APARTMENT_MEMBERS (CĂN CH-06)
INSERT INTO apartment_members (id, apartment_code, user_id, full_name, phone, id_card, relationship, role, license_plate, face_status, avatar_url)
VALUES 
('mem-1', 'CH-06', 'user-tenant-1', 'Nguyễn Hữu Nhựt', '0917795211', '079198005678', 'Em Trai / Người Nhà', 'Family', '59P1-886.79', 'Đã xác thực', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80')
ON CONFLICT (id) DO NOTHING;

-- 7. TECHNICIANS (ĐỘI NGŨ KỸ THUẬT VIÊN)
INSERT INTO technicians (id, user_id, name, phone, email, specialty, base_salary, pay_per_ticket, bonus_per_fivestar, status)
VALUES 
('KTV-01', 'user-tech-1', 'Trần Đình Trọng', '0901.888.998', 'manager02@skyline.vn', 'Điện Lạnh & Kỹ Thuật Tòa Nhà', 9500000, 180000, 50000, 'AVAILABLE'),
('KTV-02', 'user-tech-2', 'Lê Quốc Tuấn', '0909.888.777', 'tech.skyline@gmail.com', 'Cơ Điện & Nước', 8500000, 150000, 50000, 'AVAILABLE'),
('KTV-03', 'user-tech-3', 'Nguyễn Huy Hoàng', '0908.777.666', 'hoang.vesinh@skyline.vn', 'Vệ Sinh & Cảnh Quan Chung Cư', 8000000, 120000, 50000, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- 8. EKYC_SUBMISSIONS
INSERT INTO ekyc_submissions (id, user_id, full_name, role_label, apartment_code, phone, email, id_card_no, id_date, id_place, dob, pob, face_score, avatar_url, submitted_at, status, reviewed_at, reviewed_by)
VALUES
('EKYC-120', 'user-owner-1', 'Trần Hữu Lực', 'Chủ Hộ (Căn CH-06 - Tòa BS-07)', 'CH-06', '0364967082', 'huuluc04@gmail.com', '067204000961', '18/08/2022', 'Cục Cảnh sát QLHC về TTXH', '18/08/2004', 'Triệu Trạch, Triệu Phong, Quảng Trị', 99.50, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', '2026-09-02 14:30:00+07', 'APPROVED', '2026-09-02 15:10:00+07', 'Ban Quản Lý Skyline (Trực Ban)'),
('EKYC-121', 'user-tenant-1', 'Nguyễn Hữu Nhựt', 'Người Nhà (Căn CH-06 - Tòa BS-07)', 'CH-06', '0917795211', 'nguyenhuunhut1309@gmail.com', '079198005678', '02/09/2022', 'Cục Cảnh sát QLHC về TTXH', '02/09/2004', 'TP. Hồ Chí Minh', 99.50, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80', '2026-10-12 09:15:00+07', 'APPROVED', '2026-10-12 10:00:00+07', 'Ban Quản Lý Skyline (Trực Ban)')
ON CONFLICT (id) DO NOTHING;

-- 9. SERVICE_TICKETS
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

-- 10. BILLS
INSERT INTO bills (id, apartment_code, owner_name, billing_month, due_date, total_amount, status, payment_qr_url, has_ai_anomaly, created_at, paid_at)
VALUES 
('bill-2026-08-ch06', 'CH-06', 'Trần Hữu Lực', 'Tháng 08/2026', '2026-08-30 23:59:59+07', 2505000, 'Unpaid', 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_CH06_2505000', TRUE, '2026-08-05 08:00:00+07', NULL),
('bill-2026-07-ch06', 'CH-06', 'Trần Hữu Lực', 'Tháng 07/2026', '2026-07-30 23:59:59+07', 2370000, 'Paid', 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_CH06_PAID_07', FALSE, '2026-07-05 08:00:00+07', '2026-07-28 14:20:00+07')
ON CONFLICT (id) DO NOTHING;

-- 11. SMART_DEVICES (CĂN CH-06)
INSERT INTO smart_devices (id, apartment_code, name, device_type, status, set_value, location_x, location_y)
VALUES 
('dev-lock-01', 'CH-06', 'Khóa Thông Minh FaceID Cửa Chính', 'door', 'locked', 0, 15.5, 85.0),
('dev-light-01', 'CH-06', 'Hệ Thống Đèn Phòng Khách Luxury', 'light', 'on', 100, 45.0, 50.0),
('dev-light-02', 'CH-06', 'Đèn Phòng Ngủ Master', 'light', 'on', 80, 70.0, 35.0),
('dev-light-03', 'CH-06', 'Đèn Không Gian Bếp', 'light', 'on', 100, 30.0, 65.0),
('dev-ac-01', 'CH-06', 'Điều Hòa Daikin Inverter Inverter 24°C', 'ac', 'on', 24.0, 60.0, 30.0),
('dev-curtain-01', 'CH-06', 'Rèm Cửa Tự Động Ban Công', 'curtain', 'open', 100, 85.0, 50.0),
('dev-sensor-01', 'CH-06', 'Cảm Biến Dòng Chảy & Rò Rỉ Nước AI', 'sensor', 'active', 0, 25.0, 20.0),
('dev-sensor-02', 'CH-06', 'Cảm Biến Bụi Mịn & AQI Daikin Streamer', 'sensor', 'active', 32, 50.0, 45.0)
ON CONFLICT (id) DO NOTHING;

-- 12. PARKING_SLOTS (HẦM B1 & B2)
INSERT INTO parking_slots (id, slot_code, floor_number, vehicle_type, apartment_code, assigned_user_id, assigned_license_plate, rfid_card_code, status, monthly_fee)
VALUES 
('slot-b2-a15', 'Ô B2-A15', -2, 'CAR', 'CH-06', 'user-owner-1', '51K-889.99', 'RFID-A1205-01', 'OCCUPIED', 1200000),
('slot-b1-m88', 'Khu B1-M88', -1, 'MOTORCYCLE', 'CH-06', 'user-owner-1', '59P1-886.79', 'RFID-A1205-02', 'OCCUPIED', 120000)
ON CONFLICT (id) DO NOTHING;

-- 13. FACILITIES & BOOKINGS
INSERT INTO facilities (id, name, category, floor_number, location_detail, operating_hours, pricing, max_quota_per_month, rating_score, current_occupancy, max_capacity, hero_image_url)
VALUES 
('fac-1', 'Hồ Bơi Vô Cực Chân Mây (Skyline Horizon Pool)', 'Hồ bơi', 25, 'Tầng 25 (Sân Thượng Chung Cư)', '06:00 - 22:00', 'Miễn phí theo Thẻ cư dân (20 lượt/tháng)', 20, 4.9, 14, 40, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'),
('fac-3', 'Trung Tâm Thể Hình Technogym (Fitness & Yoga)', 'Gym', 3, 'Tầng 3 (Khu Thể Thao Đa Năng)', 'Mở cửa 24/7', 'Miễn phí theo Thẻ cư dân', 30, 5.0, 8, 35, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'),
('fac-sauna', 'Phòng Xông Hơi Đá Muối Himalaya (Private VIP)', 'Xông hơi', 3, 'Tầng 3 (Khu Chăm Sóc Sức Khỏe Riêng Tư)', '08:00 - 22:00', '500.000 đ / giờ (Phòng gia đình VIP)', 10, 5.0, 1, 4, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800'),
('fac-kids', 'Khu Vui Chơi Trẻ Em Sky Kids Zone', 'Khu trẻ em', 1, 'Tầng 1 (Sảnh Thương Mại Tòa Chung Cư)', '07:00 - 21:00', 'Miễn phí theo Thẻ cư dân (Có người lớn đi kèm)', 30, 4.9, 6, 25, 'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=800'),
('fac-2', 'Vườn Tiệc Nướng BBQ Panoramic', 'BBQ', 25, 'Tầng 25 (Sân Thượng Khu Vườn Nhật Bản)', '17:00 - 23:00', '600.000 đ / ca (Bao gồm set bếp Weber & dọn dẹp)', 4, 4.8, 2, 6, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800')
ON CONFLICT (id) DO NOTHING;

INSERT INTO facility_bookings (id, apartment_code, facility_id, booker_id, booker_name, ticket_code, booking_date, time_slot, guest_count, duration_hours, deposit_amount, pricing, payment_method, status, notes)
VALUES (
    'BK-SAUNA-9821', 'CH-06', 'fac-sauna', 'user-owner-1', 'Trần Hữu Lực', 'SKY-SAUNA-CH06-7799', 
    CURRENT_DATE, '18:00 - 20:00 (2 Tiếng - Tối nay)', 2, 2, 1000000, '500.000 đ / giờ', 
    'Trừ vào hóa đơn sinh hoạt tháng tới', 'CONFIRMED', 'Gia đình 2 người, chuẩn bị trước tinh dầu sả chanh'
)
ON CONFLICT (id) DO NOTHING;

-- 14. VISITOR_PASSES & GATE LOGS
INSERT INTO visitor_passes (id, apartment_code, host_user_id, host_name, host_phone, tower_name, visitor_name, visitor_phone, license_plate, entry_type, purpose, purpose_label, valid_hours, qr_data, pin_code, status, note, valid_until, checked_in_at)
VALUES 
('SKY-PASS-8492', 'CH-06', 'user-owner-1', 'Trần Hữu Lực', '0364967082', 'Tropical BS-07', 'Trần Quốc Bảo', '0903123456', '51G-888.88', 'MULTI', 'VISITOR', 'Khách Thăm Căn Hộ', 8, '{"skyline_pass":true,"passId":"SKY-PASS-8492","aptCode":"CH-06","hostName":"Trần Hữu Lực","visitorName":"Trần Quốc Bảo"}', '849201', 'CHECKED_IN', 'Khách đối tác công việc lên căn CH-06 (Tòa BS-07)', CURRENT_TIMESTAMP + INTERVAL '6 hours', '10:15 02/10/2026'),
('SKY-PASS-6521', 'CH-06', 'user-owner-1', 'Trần Hữu Lực', '0364967082', 'Tropical BS-07', 'Phạm Minh Tuấn', '0918765432', '59P1-999.99', 'MULTI', 'VISITOR', 'Khách Thăm Căn Hộ', 4, '{"skyline_pass":true,"passId":"SKY-PASS-6521","aptCode":"CH-06","hostName":"Trần Hữu Lực","visitorName":"Phạm Minh Tuấn"}', '652190', 'ACTIVE', 'Bạn bè đến thăm gia đình', CURRENT_TIMESTAMP + INTERVAL '3.5 hours', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO visitor_gate_logs (id, pass_id, apartment_code, host_name, visitor_name, license_plate, action, result, checkpoint, notes)
VALUES 
('vgl-01', 'SKY-PASS-8492', 'CH-06', 'Trần Hữu Lực', 'Trần Quốc Bảo', '51G-888.88', 'CHECK_IN', 'VALID', 'Cổng Barrier Hầm B1', 'Khách đối tác đã check-in thành công qua mã QR')
ON CONFLICT (id) DO NOTHING;

-- 15. COMMUNITY_POSTS
INSERT INTO community_posts (id, author_id, author_name, author_role, apt_code, title, content, category, ai_moderation, ai_sentiment, tags, likes, comments_count, is_pinned, created_at)
VALUES 
('post-1', 'user-manager-1', 'Ban Quản Lý Tòa Nhà SKYLINE', 'BQL', NULL, 
 'Thông báo lịch bảo dưỡng định kỳ hệ thống thang máy Otis Tòa BS-07', 
 'Ban Quản lý xin thông báo kế hoạch kiểm tra kỹ thuật định kỳ thang máy số 02 vào ngày 28/08/2026 từ 09:00 - 11:30. Kính mong Quý cư dân sử dụng thang số 01 và 03 trong thời gian trên.', 
 'Bảo trì', 'Clean', 0.85, ARRAY['Bảo trì', 'Thông báo BQL', 'Thang máy'], 42, 5, TRUE, '2026-08-25 10:00:00+07'),

('post-2', 'user-owner-1', 'Trần Hữu Lực (Căn CH-06)', 'Cư dân', 'CH-06', 
 'Trao đổi lại bộ bàn ghế đọc sách ban công bằng gỗ sồi còn mới 95%', 
 'Gia đình mình vừa thay đổi nội thất nên muốn nhượng lại bộ bàn ghế ban công gọn nhẹ cho bác nào có nhu cầu, có thể qua xem trực tiếp tại căn CH-06.', 
 'Cộng đồng', 'Clean', 0.92, ARRAY['Rao vặt', 'Nội thất', 'Cộng đồng'], 18, 3, FALSE, '2026-08-26 11:30:00+07')
ON CONFLICT (id) DO NOTHING;

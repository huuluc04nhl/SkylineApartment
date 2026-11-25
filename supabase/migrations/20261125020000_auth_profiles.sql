-- ============================================================================
-- MIGRATION 20261125020000: SUPABASE AUTH PROFILES & TRIGGER
-- Đặt role và apartment_code ở bảng public.profiles (id = auth.users.id),
-- KHÔNG đặt trong user_metadata mà user tự sửa được.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    legacy_user_id VARCHAR(50) UNIQUE,
    email VARCHAR(100),
    phone VARCHAR(20),
    full_name VARCHAR(150) NOT NULL DEFAULT 'Cư Dân SKYLINE',
    role VARCHAR(30) NOT NULL DEFAULT 'TENANT' CHECK (role IN ('ADMIN', 'OWNER', 'TENANT', 'TECHNICIAN', 'RECEPTIONIST')),
    apartment_code VARCHAR(30) REFERENCES public.apartments(apt_code) ON DELETE SET NULL,
    relationship VARCHAR(50) DEFAULT 'Tenant' CHECK (relationship IN ('Owner', 'Family', 'Tenant', 'Staff')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_apt ON public.profiles(apartment_code);

-- Bật RLS (không cho phép truy cập công khai)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Trigger tự động tạo profile mặc định an toàn khi có user mới trong auth.users
-- Không đọc role hay apartment_code từ raw_user_meta_data để chống tự leo thang quyền.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, phone, full_name, role, apartment_code, relationship)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.phone,
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''), 'Cư Dân SKYLINE'),
        'TENANT',
        NULL,
        'Tenant'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

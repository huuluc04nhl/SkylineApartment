-- Drop legacy default password_hash on public.users; passwords live solely in Supabase Auth.
ALTER TABLE public.users ALTER COLUMN password_hash DROP DEFAULT;

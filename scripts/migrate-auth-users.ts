/**
 * Script migrate tài khoản từ bảng public.users vào Supabase auth.users & public.profiles.
 * Chạy 1 lần ở local bằng: npx tsx scripts/migrate-auth-users.ts
 * Sinh mật khẩu ngẫu nhiên cho từng tài khoản và in ra terminal (KHÔNG dùng mật khẩu cố định).
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

function generateRandomPassword(length = 16): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length) + '!A9';
}

function resolveInitialPassword(role?: string | null): string {
  const upper = (role || '').toUpperCase();
  const roleKey =
    upper === 'TECHNICIAN'
      ? 'E2E_TECH_PASSWORD'
      : upper === 'RECEPTIONIST'
      ? 'E2E_RECEPTION_PASSWORD'
      : `E2E_${upper}_PASSWORD`;
  const fromEnv = process.env[roleKey] || process.env.E2E_DEFAULT_PASSWORD;
  return fromEnv && fromEnv.trim() ? fromEnv.trim() : generateRandomPassword(16);
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: users, error: usersErr } = await admin
    .from('users')
    .select('id, username, email, phone, full_name, role, apartment_code, relationship, avatar_url');

  if (usersErr) throw new Error(`Lỗi đọc bảng users: ${usersErr.message}`);
  if (!users || users.length === 0) {
    console.log('Không có user nào trong bảng public.users.');
    return;
  }

  const { data: existingList, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw new Error(`Lỗi list auth.users: ${listErr.message}`);
  const byEmail = new Map(existingList.users.map((u) => [u.email?.toLowerCase(), u]));

  console.log('=== KẾT QUẢ MIGRATE TÀI KHOẢN SANG SUPABASE AUTH ===');
  for (const u of users) {
    const email = (u.email || `${u.username}@skyline.local`).toLowerCase().trim();
    let authUser = byEmail.get(email);
    let generatedPassword: string | null = null;

    if (!authUser) {
      generatedPassword = resolveInitialPassword(u.role);
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { full_name: u.full_name },
      });
      if (createErr || !created.user) {
        console.error(`[FAIL] ${email}:`, createErr?.message);
        continue;
      }
      authUser = created.user;
    }

    const { error: profileErr } = await admin.from('profiles').upsert({
      id: authUser.id,
      legacy_user_id: u.id,
      email,
      phone: u.phone,
      full_name: u.full_name,
      role: u.role,
      apartment_code: u.apartment_code,
      relationship: u.relationship || 'Tenant',
      avatar_url: u.avatar_url,
    });

    if (profileErr) {
      console.error(`[PROFILE ERR] ${email}:`, profileErr.message);
      continue;
    }

    if (generatedPassword) {
      console.log(`[CREATED] ${email} | phone=${u.phone} | role=${u.role} | password=${generatedPassword}`);
    } else {
      console.log(`[SYNCED]  ${email} | phone=${u.phone} | role=${u.role} (đã tồn tại trong auth.users)`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

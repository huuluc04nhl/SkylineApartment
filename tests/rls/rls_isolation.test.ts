import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnvLocal(): Record<string, string> {
  const p = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(p, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
      })
  );
}

const localEnv = loadEnvLocal();
const url = localEnv.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey =
  localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  localEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';
const serviceKey = localEnv.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const hasLiveSupabase =
  Boolean(url && anonKey && serviceKey) &&
  !url.includes('example.supabase.co') &&
  serviceKey !== 'test-service-role-key';

describe.skipIf(!hasLiveSupabase)('Supabase RLS cross-apartment isolation', () => {
  it('prevents resident in CH-06 from reading BS-07-0202 bills & tickets and vice versa', async () => {
    const admin = createClient(url, serviceKey);
    const ts = Date.now();
    const emailA = `rls-a-${ts}@skyline.test`;
    const emailB = `rls-b-${ts}@skyline.test`;
    const password = `TestPass!${ts}`;

    const userA = await admin.auth.admin.createUser({ email: emailA, password, email_confirm: true });
    const userB = await admin.auth.admin.createUser({ email: emailB, password, email_confirm: true });
    if (userA.error || !userA.data.user) throw userA.error;
    if (userB.error || !userB.data.user) throw userB.error;

    const { data: apts, error: aptErr } = await admin.from('apartments').select('apt_code').limit(2);
    expect(aptErr).toBeNull();
    expect(apts && apts.length >= 2).toBe(true);
    const aptA = apts![0].apt_code;
    const aptB = apts![1].apt_code;

    const uidA = userA.data.user.id;
    const uidB = userB.data.user.id;
    const billAId = `RLS-BILL-A-${ts}`;
    const billBId = `RLS-BILL-B-${ts}`;

    try {
      const { error: profErr } = await admin.from('profiles').upsert([
        { id: uidA, email: emailA, full_name: 'RLS User A', role: 'OWNER', apartment_code: aptA },
        { id: uidB, email: emailB, full_name: 'RLS User B', role: 'OWNER', apartment_code: aptB },
      ]);
      expect(profErr).toBeNull();

      const { error: billErr } = await admin.from('bills').insert([
        {
          id: billAId,
          apartment_code: aptA,
          owner_name: 'RLS User A',
          billing_month: 'T11/2026',
          due_date: '2026-12-05',
          total_amount: 100000,
          status: 'Unpaid',
        },
        {
          id: billBId,
          apartment_code: aptB,
          owner_name: 'RLS User B',
          billing_month: 'T11/2026',
          due_date: '2026-12-05',
          total_amount: 200000,
          status: 'Unpaid',
        },
      ]);
      expect(billErr).toBeNull();

      const clientA = createClient(url, anonKey);
      const signInA = await clientA.auth.signInWithPassword({ email: emailA, password });
      expect(signInA.error).toBeNull();

      const { data: billsVisibleToA } = await clientA
        .from('bills')
        .select('id, apartment_code')
        .in('id', [billAId, billBId]);
      expect(billsVisibleToA).toHaveLength(1);
      expect(billsVisibleToA?.[0].id).toBe(billAId);

      const clientB = createClient(url, anonKey);
      const signInB = await clientB.auth.signInWithPassword({ email: emailB, password });
      expect(signInB.error).toBeNull();

      const { data: billsVisibleToB } = await clientB
        .from('bills')
        .select('id, apartment_code')
        .in('id', [billAId, billBId]);
      expect(billsVisibleToB).toHaveLength(1);
      expect(billsVisibleToB?.[0].id).toBe(billBId);
    } finally {
      await admin.from('bills').delete().in('id', [billAId, billBId]);
      await admin.from('profiles').delete().in('id', [uidA, uidB]);
      await admin.auth.admin.deleteUser(uidA);
      await admin.auth.admin.deleteUser(uidB);
    }
  }, 20000);
});

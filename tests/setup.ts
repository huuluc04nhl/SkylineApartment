import { vi } from 'vitest';

// Provide safe test defaults for env validation when running in CI without real secrets
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.VNP_TMN_CODE = process.env.VNP_TMN_CODE || 'TESTTMN';
process.env.VNP_HASH_SECRET =
  process.env.VNP_HASH_SECRET || 'TESTSECRETKEYFORVNPAYUNITTESTS123456';
process.env.VNP_URL =
  process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
process.env.NEXT_PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
process.env.NEXT_PUBLIC_DEMO_MODE = 'false';

vi.mock('server-only', () => ({}));

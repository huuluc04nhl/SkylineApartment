import 'server-only';
import { z } from 'zod';
import { getPublicEnv, publicEnvSchema } from './env.public';

export { getPublicEnv, publicEnvSchema };

export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Thiếu SUPABASE_SERVICE_ROLE_KEY'),
  RESIDENT_CARD_SECRET: z.string().min(32, 'RESIDENT_CARD_SECRET phải tối thiểu 32 ký tự').optional(),
  GEMINI_API_KEY: z.string().min(1, 'Thiếu GEMINI_API_KEY').optional(),
  VNP_TMN_CODE: z.string().min(1, 'Thiếu VNP_TMN_CODE'),
  VNP_HASH_SECRET: z.string().min(1, 'Thiếu VNP_HASH_SECRET'),
  VNP_URL: z.string().url('VNP_URL phải là URL hợp lệ').default('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
});

export function getServerEnv() {
  getPublicEnv();
  const parsed = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESIDENT_CARD_SECRET: process.env.RESIDENT_CARD_SECRET || undefined,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
    VNP_TMN_CODE: process.env.VNP_TMN_CODE,
    VNP_HASH_SECRET: process.env.VNP_HASH_SECRET,
    VNP_URL: process.env.VNP_URL || undefined,
  });

  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Thiếu hoặc sai biến môi trường server: ${missing}`);
  }
  return parsed.data;
}

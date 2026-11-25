import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

const memoryAttempts = new Map<string, { count: number; resetAt: number }>();

function checkMemoryRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number,
  consume: boolean
): boolean {
  const now = Date.now();
  const existing = memoryAttempts.get(key);
  if (!existing || now > existing.resetAt) {
    if (consume) {
      memoryAttempts.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    }
    return true;
  }
  if (existing.count >= maxAttempts) {
    return false;
  }
  if (consume) {
    existing.count += 1;
  }
  return true;
}

/**
 * Kiểm tra và cập nhật giới hạn tần suất bền vững trên Postgres (`check_rate_limit`).
 * Fallback về bộ nhớ tiến trình chỉ khi RPC chưa sẵn sàng (ví dụ môi trường test chưa nối DB).
 */
export async function checkRateLimit(
  key: string,
  maxAttempts = 20,
  windowSeconds = 60,
  consume = true
): Promise<boolean> {
  try {
    const { data, error } = await (supabaseAdmin as any).rpc('check_rate_limit', {
      p_key: key,
      p_max_attempts: maxAttempts,
      p_window_seconds: windowSeconds,
      p_consume: consume,
    });
    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch {
    // Fallback to in-memory counter if RPC is unavailable
  }

  return checkMemoryRateLimit(key, maxAttempts, windowSeconds, consume);
}

export async function resetRateLimit(key: string): Promise<void> {
  memoryAttempts.delete(key);
  try {
    await (supabaseAdmin as any).rpc('reset_rate_limit', { p_key: key });
  } catch {
    // Ignore if RPC is unavailable
  }
}

export function extractClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim() || 'unknown';
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

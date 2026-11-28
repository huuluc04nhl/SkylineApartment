import 'server-only';
import crypto from 'crypto';

const TOKEN_PREFIX = 'SKYLINE_CARD_V1.';

export interface ResidentCardTokenPayload {
  sub: string;
  apt: string;
  role: string;
  iat: number;
  exp: number;
}

function getCardSigningSecret(): string {
  const secret = process.env.RESIDENT_CARD_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!secret) {
    throw new Error('Thiếu biến môi trường RESIDENT_CARD_SECRET để ký thẻ cư dân.');
  }
  return secret;
}

export function signResidentCardToken(
  params: { userId: string; apartmentCode: string; role: string },
  ttlSeconds = 60
): { token: string; expiresAt: string; expiresIn: number } {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;
  const payload: ResidentCardTokenPayload = {
    sub: params.userId,
    apt: params.apartmentCode,
    role: params.role,
    iat,
    exp,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getCardSigningSecret())
    .update(encodedPayload)
    .digest('base64url');

  return {
    token: `${TOKEN_PREFIX}${encodedPayload}.${sig}`,
    expiresAt: new Date(exp * 1000).toISOString(),
    expiresIn: ttlSeconds,
  };
}

export function verifyResidentCardToken(
  rawToken: string,
  nowEpochSeconds = Math.floor(Date.now() / 1000)
):
  | { valid: true; payload: ResidentCardTokenPayload }
  | { valid: false; reason: 'INVALID_FORMAT' | 'INVALID_SIGNATURE' | 'EXPIRED' } {
  const clean = (rawToken || '').trim();
  if (!clean.startsWith(TOKEN_PREFIX)) {
    return { valid: false, reason: 'INVALID_FORMAT' };
  }

  const body = clean.slice(TOKEN_PREFIX.length);
  const parts = body.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, reason: 'INVALID_FORMAT' };
  }

  const [encodedPayload, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getCardSigningSecret())
    .update(encodedPayload)
    .digest('base64url');

  const a = Buffer.from(providedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  let payload: ResidentCardTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, reason: 'INVALID_FORMAT' };
  }

  if (!payload || typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
    return { valid: false, reason: 'INVALID_FORMAT' };
  }

  if (payload.exp <= nowEpochSeconds) {
    return { valid: false, reason: 'EXPIRED' };
  }

  return { valid: true, payload };
}

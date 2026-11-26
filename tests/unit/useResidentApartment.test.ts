import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/authContext', () => ({
  useAuth: () => ({ currentUser: null }),
}));

import { resolveResidentApartment } from '@/lib/hooks/useResidentApartment';

describe('resolveResidentApartment (no CH-06 fallback)', () => {
  it('returns missing=true and empty aptCode when user has no apartment_code', () => {
    expect(resolveResidentApartment(null)).toEqual({ aptCode: '', missing: true });
    expect(resolveResidentApartment({ role: 'OWNER', apartment_code: '' })).toEqual({ aptCode: '', missing: true });
    expect(resolveResidentApartment({ role: 'TENANT', apartment_code: '   ' })).toEqual({ aptCode: '', missing: true });
    expect(resolveResidentApartment({ role: 'OWNER', apartment_code: undefined })).toEqual({ aptCode: '', missing: true });
  });

  it('returns trimmed aptCode and missing=false when user has an assigned apartment', () => {
    expect(resolveResidentApartment({ role: 'OWNER', apartment_code: ' BS08-CH08 ' })).toEqual({
      aptCode: 'BS08-CH08',
      missing: false,
    });
  });
});

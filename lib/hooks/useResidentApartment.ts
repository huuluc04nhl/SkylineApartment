'use client';

import { useAuth } from '@/lib/authContext';
import type { User } from '@/lib/dataStore';

export interface ResidentApartmentState {
  aptCode: string;
  missing: boolean;
}

export function resolveResidentApartment(user?: Partial<User> | null): ResidentApartmentState {
  const raw = typeof user?.apartment_code === 'string' ? user.apartment_code.trim() : '';
  return {
    aptCode: raw,
    missing: raw.length === 0,
  };
}

export function useResidentApartment(user?: Partial<User> | null): ResidentApartmentState {
  const { currentUser } = useAuth();
  return resolveResidentApartment(user ?? currentUser);
}

import { EnrolledFaceProfile, FaceBiometricSamples } from './biometricFaceEngine';
export type { EnrolledFaceProfile, FaceBiometricSamples } from './biometricFaceEngine';
import { FaceEnrollmentRecord } from './db/schema';

const faceEnrollCache: FaceEnrollmentRecord[] = [];

export function getAllEnrolledFaceProfiles(): EnrolledFaceProfile[] {
  const seen = new Set<string>();
  const list: EnrolledFaceProfile[] = [];

  faceEnrollCache.forEach(p => {
    const hasValidDescriptor = Array.isArray(p.descriptor) && p.descriptor.length === 128 && p.descriptor.some(v => v !== 0);
    if (!seen.has(p.userId) && hasValidDescriptor) {
      seen.add(p.userId);
      list.push({
        userId: p.userId,
        fullName: p.fullName,
        phone: p.phone,
        apartmentCode: p.apartmentCode || '',
        avatarUrl: p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.fullName)}&background=1C2533&color=C5A880`,
        faceScore: p.faceScore || 99,
        descriptor: p.descriptor,
        samples: p.samples as any || { front: '', left: '', right: '', smile: '' },
        enrolledAt: p.enrolledAt,
        status: p.status,
      });
    }
  });
  return list;
}

export function getEnrolledFaceProfile(userId: string): EnrolledFaceProfile | null {
  if (!userId) return null;
  const clean = userId.toLowerCase().trim();
  const rec = faceEnrollCache.find(p =>
    p.userId.toLowerCase() === clean ||
    (p.phone && p.phone.trim() === userId.trim())
  );
  if (!rec) return null;
  const hasValidDescriptor = Array.isArray(rec.descriptor) && rec.descriptor.length === 128 && rec.descriptor.some(v => v !== 0);
  if (!hasValidDescriptor) return null;

  return {
    userId: rec.userId,
    fullName: rec.fullName,
    phone: rec.phone,
    apartmentCode: rec.apartmentCode || '',
    avatarUrl: rec.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.fullName)}&background=1C2533&color=C5A880`,
    faceScore: rec.faceScore || 99,
    descriptor: rec.descriptor,
    samples: rec.samples as any || { front: '', left: '', right: '', smile: '' },
    enrolledAt: rec.enrolledAt,
    status: rec.status,
  };
}

export function saveEnrolledFaceProfile(profile: EnrolledFaceProfile): boolean {
  const rec: FaceEnrollmentRecord = {
    userId: profile.userId,
    fullName: profile.fullName,
    phone: profile.phone,
    apartmentCode: profile.apartmentCode,
    avatarUrl: profile.avatarUrl,
    faceScore: profile.faceScore,
    descriptor: profile.descriptor,
    samples: profile.samples,
    enrolledAt: profile.enrolledAt,
    status: profile.status,
  };

  const idx = faceEnrollCache.findIndex(p => p.userId === profile.userId);
  if (idx >= 0) {
    faceEnrollCache[idx] = rec;
  } else {
    faceEnrollCache.push(rec);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_faceid_enrolled', { detail: profile }));
  }
  return true;
}

export function updateEnrolledFaceStatus(userId: string, status: 'ACTIVE' | 'PENDING' | 'PENDING_OWNER' | 'REVOKED'): EnrolledFaceProfile | null {
  const idx = faceEnrollCache.findIndex(p => p.userId === userId);
  if (idx < 0) return null;

  faceEnrollCache[idx] = { ...faceEnrollCache[idx], status };
  const updatedRec = faceEnrollCache[idx];
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_faceid_enrolled', { detail: updatedRec }));
  }

  return {
    userId: updatedRec.userId,
    fullName: updatedRec.fullName,
    phone: updatedRec.phone,
    apartmentCode: updatedRec.apartmentCode || '',
    avatarUrl: updatedRec.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedRec.fullName)}&background=1C2533&color=C5A880`,
    faceScore: updatedRec.faceScore || 99,
    descriptor: updatedRec.descriptor,
    samples: updatedRec.samples as any || { front: '', left: '', right: '', smile: '' },
    enrolledAt: updatedRec.enrolledAt,
    status: updatedRec.status,
  };
}

export function removeEnrolledFaceProfile(userId: string): void {
  const idx = faceEnrollCache.findIndex(p => p.userId === userId);
  if (idx >= 0) faceEnrollCache.splice(idx, 1);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_faceid_enrolled', { detail: { userId, removed: true } }));
  }
}

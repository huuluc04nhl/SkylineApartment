/**
 * e-KYC Resident Identity Verification & FaceID Access Store
 * Client/Server e-KYC Store backed by skylineDb and /api/ekyc.
 * Zero LocalStorage. Zero External Mock APIs.
 */

import { updateApartmentMember } from './userStore';
import { skylineDb } from './db';
import { EkycSubmissionRecord } from './db/schema';

export type EkycStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'VERIFIED' | 'PENDING_OWNER';

export interface EkycRequest {
  id: string;
  userId: string;
  fullName: string;
  roleLabel: string;
  apartmentCode: string;
  phone: string;
  email?: string;
  idCardNo: string;
  idDate: string;
  idPlace: string;
  dob?: string;
  pob?: string;
  faceScore: number;
  avatarUrl: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  faceSamples?: {
    front: string;
    left?: string;
    right?: string;
    smile?: string;
  };
  submittedAt: string;
  status: EkycStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  isSimulation?: boolean;
  algorithm?: string;
}

export function submissionRecordToRequest(rec: EkycSubmissionRecord): EkycRequest {
  return {
    id: rec.id,
    userId: rec.userId,
    fullName: rec.fullName,
    roleLabel: rec.roleLabel,
    apartmentCode: rec.apartmentCode,
    phone: rec.phone,
    email: rec.email,
    idCardNo: rec.idCardNo,
    idDate: rec.idDate || '',
    idPlace: rec.idPlace || '',
    dob: rec.dob,
    pob: rec.pob,
    faceScore: rec.faceScore || 0,
    avatarUrl: rec.avatarUrl,
    idCardFrontUrl: rec.idCardFrontUrl || '',
    idCardBackUrl: rec.idCardBackUrl || '',
    faceSamples: rec.faceSamples as any,
    submittedAt: rec.submittedAt,
    status: rec.status as EkycStatus,
    reviewedAt: rec.reviewedAt,
    reviewedBy: rec.reviewedBy,
    rejectionReason: rec.rejectionReason,
    isSimulation: rec.isSimulation,
    algorithm: rec.algorithm
  };
}

export const INITIAL_EKYC_REQUESTS: EkycRequest[] = skylineDb.ekycSubmissions.find().map(submissionRecordToRequest);

export function getEkycRequests(): EkycRequest[] {
  return skylineDb.ekycSubmissions.find().map(submissionRecordToRequest);
}

export function saveEkycRequests(requests: EkycRequest[]): void {
  requests.forEach(r => {
    const existing = skylineDb.ekycSubmissions.findById(r.id);
    const rec: EkycSubmissionRecord = {
      id: r.id,
      userId: r.userId,
      fullName: r.fullName,
      roleLabel: r.roleLabel,
      apartmentCode: r.apartmentCode,
      phone: r.phone,
      email: r.email,
      idCardNo: r.idCardNo,
      idDate: r.idDate,
      idPlace: r.idPlace,
      dob: r.dob,
      pob: r.pob,
      faceScore: r.faceScore,
      avatarUrl: r.avatarUrl,
      idCardFrontUrl: r.idCardFrontUrl,
      idCardBackUrl: r.idCardBackUrl,
      faceSamples: r.faceSamples,
      submittedAt: r.submittedAt,
      status: r.status,
      reviewedAt: r.reviewedAt,
      reviewedBy: r.reviewedBy,
      rejectionReason: r.rejectionReason,
      isSimulation: r.isSimulation,
      algorithm: r.algorithm
    };
    if (existing) {
      skylineDb.ekycSubmissions.update(r.id, rec);
    } else {
      skylineDb.ekycSubmissions.insert(rec);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('skyline_ekyc_updated'));
  }
}

/**
 * Tìm hồ sơ e-KYC theo số điện thoại, email hoặc user ID
 */
export function getEkycForUser(userIdentifier: string): EkycRequest | undefined {
  const requests = getEkycRequests();
  const clean = (userIdentifier || '').toLowerCase().trim();
  return requests.find(r => 
    r.userId.toLowerCase() === clean || 
    r.phone.toLowerCase() === clean || 
    (r.email && r.email.toLowerCase() === clean) ||
    r.idCardNo === clean
  );
}

/**
 * Cập nhật ảnh thẻ CCCD
 */
export function updateEkycCardImages(userIdentifier: string, front: string, back: string): void {
  const clean = (userIdentifier || '').toLowerCase().trim();
  const existing = skylineDb.ekycSubmissions.findOne(r => 
    r.userId.toLowerCase() === clean || 
    r.phone.toLowerCase() === clean || 
    (r.email && r.email.toLowerCase() === clean) ||
    r.idCardNo === clean
  );

  if (existing) {
    const patch: Partial<EkycSubmissionRecord> = {};
    if (front) patch.idCardFrontUrl = front;
    if (back) patch.idCardBackUrl = back;
    skylineDb.ekycSubmissions.update(existing.id, patch);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('skyline_ekyc_updated'));
    }
  }
}

/**
 * Nộp hồ sơ e-KYC mới
 */
export function submitEkycRequest(data: {
  userId: string;
  fullName: string;
  roleLabel?: string;
  apartmentCode?: string;
  phone: string;
  email?: string;
  idCardNo: string;
  idDate?: string;
  idPlace?: string;
  dob?: string;
  pob?: string;
  avatarUrl: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  faceSamples?: {
    front: string;
    left?: string;
    right?: string;
    smile?: string;
  };
  faceScore?: number;
  status?: EkycStatus;
  isSimulation?: boolean;
  algorithm?: string;
}): EkycRequest {
  const existing = skylineDb.ekycSubmissions.findOne(r => 
    Boolean(
      r.userId === data.userId || 
      r.phone === data.phone || 
      (data.email && r.email === data.email) ||
      (data.idCardNo && r.idCardNo === data.idCardNo)
    )
  );

  const now = new Date();
  const submittedAt = `${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${now.toLocaleDateString('vi-VN')}`;

  const rec: EkycSubmissionRecord = {
    id: existing ? existing.id : `EKYC-${Date.now().toString().slice(-4)}`,
    userId: data.userId,
    fullName: data.fullName,
    roleLabel: data.roleLabel || 'Cư Dân Căn Hộ',
    apartmentCode: data.apartmentCode || 'CH-06',
    phone: data.phone,
    email: data.email,
    idCardNo: data.idCardNo,
    idDate: data.idDate || '',
    idPlace: data.idPlace || 'Cục Cảnh sát QLHC về TTXH',
    dob: data.dob || '',
    pob: data.pob || '',
    faceScore: data.faceScore !== undefined ? data.faceScore : 0,
    avatarUrl: data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=1C2533&color=C5A880`,
    idCardFrontUrl: data.idCardFrontUrl || existing?.idCardFrontUrl || '',
    idCardBackUrl: data.idCardBackUrl || existing?.idCardBackUrl || '',
    faceSamples: data.faceSamples || existing?.faceSamples,
    submittedAt,
    status: data.status || 'PENDING',
    isSimulation: data.isSimulation,
    algorithm: data.algorithm,
  };

  if (existing) {
    skylineDb.ekycSubmissions.update(existing.id, rec);
  } else {
    skylineDb.ekycSubmissions.insert(rec);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('skyline_ekyc_updated'));
  }

  return submissionRecordToRequest(rec);
}

/**
 * BQL duyệt hồ sơ e-KYC
 */
export function approveEkycRequest(id: string, approverName: string = 'VinHomes Manager'): EkycRequest | null {
  const existing = skylineDb.ekycSubmissions.findById(id);
  if (!existing) return null;

  const now = new Date();
  const reviewedAt = `${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${now.toLocaleDateString('vi-VN')}`;

  const updatedRec = skylineDb.ekycSubmissions.update(id, {
    status: 'APPROVED',
    reviewedAt,
    reviewedBy: approverName,
    rejectionReason: undefined
  });

  if (existing.apartmentCode) {
    try {
      updateApartmentMember(existing.apartmentCode, existing.userId, {
        faceStatus: 'Đã Kích Hoạt FaceID',
        avatarUrl: existing.avatarUrl,
        idCard: existing.idCardNo,
      });
      if (existing.phone) {
        updateApartmentMember(existing.apartmentCode, existing.phone, {
          faceStatus: 'Đã Kích Hoạt FaceID',
          avatarUrl: existing.avatarUrl,
          idCard: existing.idCardNo,
        });
      }
    } catch (e) {
      console.warn('Sync updateApartmentMember in approveEkycRequest:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('skyline_ekyc_updated'));
  }

  return updatedRec ? submissionRecordToRequest(updatedRec) : null;
}

/**
 * BQL từ chối hồ sơ e-KYC
 */
export function rejectEkycRequest(id: string, reason: string, approverName: string = 'VinHomes Manager'): EkycRequest | null {
  const existing = skylineDb.ekycSubmissions.findById(id);
  if (!existing) return null;

  const now = new Date();
  const reviewedAt = `${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${now.toLocaleDateString('vi-VN')}`;

  const updatedRec = skylineDb.ekycSubmissions.update(id, {
    status: 'REJECTED',
    reviewedAt,
    reviewedBy: approverName,
    rejectionReason: reason || 'Ảnh chụp CCCD hoặc khuôn mặt không đạt tiêu chuẩn độ nét.'
  });

  if (existing.apartmentCode) {
    try {
      updateApartmentMember(existing.apartmentCode, existing.userId, {
        faceStatus: 'BQL Yêu Cầu Chụp Lại',
      });
      if (existing.phone) {
        updateApartmentMember(existing.apartmentCode, existing.phone, {
          faceStatus: 'BQL Yêu Cầu Chụp Lại',
        });
      }
    } catch (e) {
      console.warn('Sync updateApartmentMember in rejectEkycRequest:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('skyline_ekyc_updated'));
  }

  return updatedRec ? submissionRecordToRequest(updatedRec) : null;
}

/**
 * Chủ hộ duyệt người nhà
 */
export function confirmEkycByOwner(userId: string): EkycRequest | null {
  const clean = userId.toLowerCase().trim();
  const existing = skylineDb.ekycSubmissions.findOne(r => r.userId.toLowerCase() === clean || r.phone.toLowerCase() === clean);
  if (!existing) return null;

  const updatedRec = skylineDb.ekycSubmissions.update(existing.id, {
    status: 'PENDING'
  });

  if (existing.apartmentCode) {
    try {
      updateApartmentMember(existing.apartmentCode, existing.userId, {
        faceStatus: 'Đang Chờ BQL Phê Duyệt',
      });
      if (existing.phone) {
        updateApartmentMember(existing.apartmentCode, existing.phone, {
          faceStatus: 'Đang Chờ BQL Phê Duyệt',
        });
      }
    } catch (e) {
      console.warn('Sync updateApartmentMember in confirmEkycByOwner:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('skyline_ekyc_updated'));
  }

  return updatedRec ? submissionRecordToRequest(updatedRec) : null;
}

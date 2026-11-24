// ============================================================================
// SKYLINE USER API CLIENT - SKYLINE SMART RESIDENCE (100% PURE API DRIVEN)
// Standardized API client for Skyline Smart Residence operations
// ============================================================================

import { getAllEnrolledFaceProfiles } from './faceEnrollStore';

export interface SkylineUserInfo {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  full_name?: string;
  email: string;
  phone: string;
  avatar_url?: string;
  avatar?: string;
  gender?: 0 | 1;
  dob?: string;
  pob?: string;
  id_number?: string;
  id_card_no?: string;
  id_date?: string;
  id_place?: string;
  province?: string;
  intro?: string;
  website?: string;
  license_plate?: string;
  role: 'ADMIN' | 'OWNER' | 'TENANT' | 'TECHNICIAN';
  apartment_code?: string;
  access_token?: string;
}

export interface SkylineLoginResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  user?: SkylineUserInfo;
}

/**
 * 1. Login API (POST /api/user/login)
 */
export async function skylineLogin(
  username: string, 
  password?: string,
  isOtpAuth?: boolean
): Promise<SkylineLoginResponse> {
  const payload = {
    username: username.trim(),
    password: password || '',
    isOtpAuth: !!isOtpAuth,
    fbtoken: 'SKYLINE_FCM_TOKEN_' + Date.now(),
    system: 'SKYLINE',
    device: 'Web Browser (Skyline Smart Residence)',
    ip_address: '127.0.0.1',
    location: 'TP. Ho Chi Minh, Vietnam',
  };

  const res = await fetch('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || 'Lỗi xác thực đăng nhập: ' + res.status);
  }

  return data;
}

/**
 * 2. Get User Info API (POST /api/user or GET)
 */
export async function skylineGetUserInfo(accessToken?: string): Promise<SkylineUserInfo | null> {
  try {
    const res = await fetch('/api/user', {
      method: accessToken ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: accessToken ? JSON.stringify({ access_token: accessToken }) : undefined,
    });

    if (res.ok) {
      const data = await res.json();
      return data.user || data;
    }
  } catch (err) {
    console.warn('Skyline GetUserInfo error', err);
  }

  return null;
}

/**
 * 3. Update User Info API (POST /api/user/updateInfo)
 */
export async function skylineUpdateInfo(info: Partial<SkylineUserInfo>): Promise<{ success: boolean; user?: SkylineUserInfo }> {
  const res = await fetch('/api/user/updateInfo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(info),
  });

  if (!res.ok) {
    throw new Error('Skyline UpdateInfo API failed');
  }

  return await res.json();
}

/**
 * 4. Update Password API (POST /api/user/updatePass)
 */
export async function skylineUpdatePassword(
  oldPass: string, 
  newPass: string,
  options?: {
    confirmPass?: string;
    targetUserId?: string;
    targetUsername?: string;
  }
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/user/updatePass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      old_password: oldPass, 
      password: newPass,
      confirm_password: options?.confirmPass || newPass,
      target_user_id: options?.targetUserId,
      target_username: options?.targetUsername,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Cập nhật mật khẩu không thành công');
  }

  return data;
}

/**
 * 5. Update Avatar API (POST /api/user/updateAvatar)
 */
export async function skylineUpdateAvatar(avatarBase64: string): Promise<{ success: boolean; avatar_url?: string }> {
  const res = await fetch('/api/user/updateAvatar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar: avatarBase64 }),
  });

  if (!res.ok) {
    throw new Error('Skyline UpdateAvatar API failed');
  }

  return await res.json();
}

/**
 * 6. Update CCCD e-KYC API (POST /api/user/updateCccd)
 */
export async function skylineUpdateCccd(payload: {
  front?: string;
  back?: string;
  number: string;
  date?: string;
  place?: string;
  fullName?: string;
  fullname?: string;
  dob?: string;
  pob?: string;
  gender?: number | string;
}): Promise<{ success: boolean; message: string; user?: any; cccd?: any }> {
  const res = await fetch('/api/user/updateCccd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Skyline UpdateCccd API failed');
  }

  return await res.json();
}

/**
 * 7. Get Family Members API (GET /api/user/family)
 */
export async function skylineGetFamilyMembers(aptCode?: string): Promise<{ success: boolean; members: any[]; bqlAccounts?: any[]; owner?: any; owner_name?: string }> {
  const url = aptCode ? `/api/user/family?aptCode=${encodeURIComponent(aptCode)}` : '/api/user/family';
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Skyline GetFamily API failed');
  }

  return await res.json();
}

/**
 * 8. Search Resident Account from API (GET /api/user/family?search=...)
 */
export async function skylineSearchFamilyAccount(query: string): Promise<{ success: boolean; found: boolean; account?: any; message?: string }> {
  const res = await fetch(`/api/user/family?search=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Skyline SearchFamilyAccount API failed');
  }

  return await res.json();
}

/**
 * 9. Add Family Member API (POST /api/user/family)
 */
export async function skylineAddFamilyMember(payload: {
  accountId?: string;
  fullName: string;
  phone: string;
  role?: string;
  relationship?: string;
  idCard?: string;
  licensePlate?: string;
  avatarUrl?: string;
  username?: string;
}): Promise<{ success: boolean; message: string; members: any[] }> {
  const res = await fetch('/api/user/family', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Skyline AddFamily API failed');
  }

  return await res.json();
}

/**
 * 10. Remove Family Member API (DELETE /api/user/family)
 */
export async function skylineRemoveFamilyMember(memberId: string): Promise<{ success: boolean; message: string; members: any[] }> {
  const res = await fetch('/api/user/family', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId }),
  });

  if (!res.ok) {
    throw new Error('Skyline RemoveFamily API failed');
  }

  return await res.json();
}

/**
 * 10b. Update Family Member API (PUT /api/user/family)
 */
export async function skylineUpdateFamilyMember(payload: {
  memberId: string;
  relationship?: string;
  licensePlate?: string;
  fullName?: string;
  phone?: string;
  idCard?: string;
}): Promise<{ success: boolean; message: string; members: any[] }> {
  const res = await fetch('/api/user/family', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Skyline UpdateFamily API failed');
  }

  return await res.json();
}

/**
 * 11. FaceID Biometric Login API (POST /api/user/face-login)
 */
export async function skylineFaceLogin(payload: {
  faceImage?: string;
  faceVector?: number[] | string;
  targetUserId?: string;
  account?: string;
  isTestMode?: boolean;
  isCameraCapture?: boolean;
  uploadedFileName?: string;
  deviceType?: string;
  clientProfiles?: any[];
}): Promise<{
  success: boolean;
  user?: any;
  matchScore?: number;
  bestAngle?: string;
  sampleScores?: {
    front: number;
    left: number;
    right: number;
    smile: number;
  };
  message?: string;
}> {
  let clientProfiles = payload.clientProfiles;
  if (!clientProfiles) {
    try {
      clientProfiles = getAllEnrolledFaceProfiles();
    } catch {
      clientProfiles = undefined;
    }
  }

  const res = await fetch('/api/user/face-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      clientProfiles,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `FaceID Login thất bại (Mã lỗi: ${res.status})`);
  }

  return data;
}

/**
 * 12. FaceID Biometric 4-Step Enrollment API (POST /api/user/face-enroll)
 */
export async function skylineEnrollFaceId(payload: {
  userId: string;
  fullName?: string;
  apartmentCode?: string;
  phone?: string;
  email?: string;
  isFamilyMemberSelfEnroll?: boolean;
  submittedByRole?: string;
  samples: {
    front: string;
    left: string;
    right: string;
    smile: string;
  };
}): Promise<{ success: boolean; message: string; profile?: any; status?: string }> {
  const res = await fetch('/api/user/face-enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Lỗi gửi dữ liệu sinh trắc học FaceID lên máy chủ.');
  }

  return data;
}

/**
 * 12b. Chủ hộ xác nhận hồ sơ FaceID của người nhà và gửi BQL
 */
export async function skylineConfirmFamilyFaceIdByOwner(userId: string, apartmentCode?: string, phone?: string): Promise<{ success: boolean; message: string; profile?: any }> {
  const res = await fetch('/api/user/face-enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'CONFIRM_BY_OWNER',
      userId,
      phone,
      apartmentCode,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Lỗi khi chủ hộ xác nhận FaceID.');
  }

  return data;
}

/**
 * 13. Lấy hồ sơ 4 mẫu FaceID đã đăng ký từ Server (GET /api/user/face-enroll)
 * Hỗ trợ đồng bộ xuyên thiết bị (Mobile <-> Desktop <-> Admin)
 */
export async function skylineGetEnrolledFaceProfile(userId: string): Promise<any | null> {
  if (!userId) return null;
  try {
    const res = await fetch(`/api/user/face-enroll?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    if (data.success && data.profile) {
      return data.profile;
    }
    return null;
  } catch (e) {
    console.warn('Lỗi fetch skylineGetEnrolledFaceProfile:', e);
    return null;
  }
}

export interface SkylineFaceIdVerifyResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: any;
    embedding?: number[];
    cropped_face?: string;
    metrics?: {
      brightness: number;
      blur_score: number;
      liveness_score: number;
      pose?: { yaw: number; pitch: number; roll: number };
      bbox?: [number, number, number, number];
    };
  };
}

/**
 * 13b. Xác thực sinh trắc học FaceID chính thức qua máy chủ Skyline (POST /api/user/face-login)
 */
export async function skylineFaceIdVerify(accessToken: string): Promise<SkylineFaceIdVerifyResponse> {
  if (!accessToken) {
    throw new Error('Vui lòng cung cấp access_token để xác thực FaceID.');
  }

  const res = await fetch('/api/user/face-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `Xác thực FaceID thất bại (Mã lỗi: ${res.status})`);
  }

  return {
    success: true,
    data: {
      user: json.user,
      embedding: json.user?.face_vector ? JSON.parse(json.user.face_vector) : [],
    }
  };
}

/**
 * 14. Apartment Handover & Account Provisioning API (POST /api/user/handover)
 */
export async function skylineHandoverProvisionAccount(payload: {
  apartmentCode: string;
  fullName: string;
  phone: string;
  email?: string;
  idCard: string;
  dob?: string;
  pob?: string;
  avatarUrl?: string;
  handoverProtocol?: any;
}): Promise<{
  success: boolean;
  message: string;
  account?: {
    id: string;
    username: string;
    fullName: string;
    phone: string;
    email: string;
    idCard: string;
    apartmentCode: string;
    role: string;
    initialPassword: string;
    provisionedAt: string;
  };
  protocol?: any;
}> {
  const res = await fetch('/api/user/handover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || `Lỗi máy chủ khi cấp tài khoản cư dân (Mã lỗi: ${res.status})`);
  }

  return data;
}

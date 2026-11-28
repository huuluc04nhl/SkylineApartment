import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { identifyFaceAmongEnrolled, EnrolledFaceProfile } from '@/lib/biometricFaceEngine';
import { findUserByIdentifierDb } from '@/lib/server/userDb';
import { getClientIp } from '@/lib/server/rateLimit';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const ipAttempts = new Map<string, { count: number; resetAt: number }>();

async function checkRateLimit(ip: string): Promise<boolean> {
  if (typeof (supabaseAdmin as any).rpc === 'function') {
    const { data, error } = await supabaseAdmin.rpc('check_face_login_rate_limit', {
      p_ip: ip,
      p_max_attempts: RATE_LIMIT_MAX_ATTEMPTS,
      p_window_seconds: Math.round(RATE_LIMIT_WINDOW_MS / 1000),
    });
    if (!error && typeof data === 'boolean') {
      return data;
    }
  }

  const now = Date.now();
  const entry = ipAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

function logFailedAttempt(ip: string, reason: string, extra?: Record<string, unknown>) {
  console.warn('[FACE_LOGIN_FAILED]', {
    ip,
    reason,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

function parseImageDimensions(buf: Buffer): { width: number; height: number; type: string } | null {
  if (buf.length < 16) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), type: 'png' };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 10) {
      if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7), type: 'jpeg' };
      }
      i++;
    }
    return { width: 640, height: 480, type: 'jpeg' };
  }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { width: 640, height: 480, type: 'webp' };
  }
  return null;
}

/**
 * POST /api/user/face-login
 * Xác thực sinh trắc học 1:N chỉ từ bảng face_enrollments (status = APPROVED)
 * và cấp phiên Supabase Auth thật bằng Admin generateLink + verifyOtp.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);

  if (!(await checkRateLimit(ip))) {
    logFailedAttempt(ip, 'RATE_LIMIT_EXCEEDED');
    return NextResponse.json(
      { success: false, message: 'Quá nhiều lần thử đăng nhập FaceID. Vui lòng thử lại sau 1 phút.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { faceImage, faceVector, isCameraCapture } = body;

    if ((!faceImage || typeof faceImage !== 'string' || faceImage.trim() === '') && !Array.isArray(faceVector)) {
      logFailedAttempt(ip, 'MISSING_FACE_INPUT');
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp hình ảnh khuôn mặt hoặc vector đặc trưng.' },
        { status: 400 }
      );
    }

    if (faceImage && typeof faceImage === 'string') {
      const base64Data = faceImage.startsWith('data:image/')
        ? faceImage.replace(/^data:image\/\w+;base64,/, '')
        : faceImage.trim();
      const imageBuffer = Buffer.from(base64Data, 'base64');
      if (imageBuffer.length < 2500) {
        logFailedAttempt(ip, 'IMAGE_TOO_SMALL');
        return NextResponse.json(
          { success: false, message: 'Ảnh khuôn mặt quá mờ hoặc dung lượng quá nhỏ.' },
          { status: 400 }
        );
      }
      const dimensions = parseImageDimensions(imageBuffer);
      if (dimensions && (dimensions.width < 100 || dimensions.height < 100)) {
        logFailedAttempt(ip, 'IMAGE_LOW_RESOLUTION');
        return NextResponse.json(
          { success: false, message: 'Độ phân giải ảnh quá thấp (yêu cầu tối thiểu 150x150px).' },
          { status: 400 }
        );
      }
    }

    // 1. Chỉ lấy hồ sơ từ bảng face_enrollments có status = APPROVED (bỏ qua hoàn toàn body.clientProfiles)
    const { data: rows, error: fetchError } = await supabaseAdmin
      .from('face_enrollments')
      .select('*')
      .eq('status', 'APPROVED');

    if (fetchError) {
      throw new Error(`Lỗi truy vấn face_enrollments: ${fetchError.message}`);
    }

    const enrolledProfiles: EnrolledFaceProfile[] = (rows || [])
      .filter((r) => Array.isArray(r.descriptor) && (r.descriptor as number[]).length === 128 && (r.descriptor as number[]).some((v) => v !== 0))
      .map((r) => ({
        userId: r.user_id,
        fullName: r.full_name,
        apartmentCode: r.apartment_code || '',
        phone: r.phone || '',
        email: r.email || '',
        avatarUrl: r.avatar_url || '',
        samples: (r.samples as unknown as EnrolledFaceProfile['samples']) || { front: '', left: '', right: '', smile: '' },
        descriptor: r.descriptor as number[],
        descriptorsByAngle: (r.metadata as any)?.descriptorsByAngle,
        enrolledAt: r.enrolled_at || new Date().toISOString(),
        status: r.status as EnrolledFaceProfile['status'],
        faceScore: r.face_score ?? 0,
      }));

    if (enrolledProfiles.length === 0) {
      logFailedAttempt(ip, 'NO_APPROVED_PROFILES');
      return NextResponse.json(
        {
          success: false,
          matchScore: 0,
          message: 'Chưa có hồ sơ FaceID nào được phê duyệt trên hệ thống.',
        },
        { status: 401 }
      );
    }

    // 2. Đối soát sinh trắc học 1:N ở server
    const liveInput = Array.isArray(faceVector) && faceVector.length === 128 ? faceVector : faceImage;
    const threshold = isCameraCapture ? 68.0 : 72.0;
    const matchResult = identifyFaceAmongEnrolled(liveInput, enrolledProfiles, threshold);

    if (!matchResult.matched || !matchResult.profile) {
      logFailedAttempt(ip, 'FACE_MISMATCH', { matchScore: matchResult.score });
      return NextResponse.json(
        {
          success: false,
          matchScore: matchResult.score,
          bestAngle: matchResult.bestAngle,
          sampleScores: matchResult.sampleScores,
          message: matchResult.message || 'Khuôn mặt chưa khớp với hồ sơ đã duyệt hoặc độ tương đồng không đạt chuẩn.',
        },
        { status: 401 }
      );
    }

    // 3. Tra cứu user thật trong public.profiles (không tạo user ảo, không suy luận role từ userId)
    const matchedRow = (rows || []).find((r) => r.user_id === matchResult.profile!.userId);
    let profileQuery = supabaseAdmin.from('profiles').select('*');
    if (matchedRow?.auth_user_id) {
      profileQuery = profileQuery.eq('id', matchedRow.auth_user_id);
    } else if (matchResult.profile.email) {
      profileQuery = profileQuery.eq('email', matchResult.profile.email.toLowerCase());
    } else if (matchResult.profile.phone) {
      profileQuery = profileQuery.eq('phone', matchResult.profile.phone);
    } else {
      profileQuery = profileQuery.eq('legacy_user_id', matchResult.profile.userId);
    }

    const { data: profileRow, error: profileError } = await profileQuery.maybeSingle();
    if (profileError) {
      throw new Error(`Lỗi truy vấn profiles: ${profileError.message}`);
    }

    if (!profileRow || !profileRow.email) {
      logFailedAttempt(ip, 'PROFILE_NOT_FOUND', { matchedUserId: matchResult.profile.userId });
      return NextResponse.json(
        { success: false, message: 'Tài khoản liên kết hồ sơ FaceID không tồn tại hoặc chưa kích hoạt Supabase Auth.' },
        { status: 401 }
      );
    }

    // 4. Cấp phiên Supabase thật qua Admin generateLink(magiclink) + verifyOtp
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: profileRow.email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      logFailedAttempt(ip, 'GENERATE_LINK_FAILED', { email: profileRow.email, error: linkError?.message });
      return NextResponse.json(
        { success: false, message: 'Không thể khởi tạo phiên xác thực Supabase.' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (verifyError || !verifyData.user) {
      logFailedAttempt(ip, 'VERIFY_OTP_FAILED', { email: profileRow.email, error: verifyError?.message });
      return NextResponse.json(
        { success: false, message: 'Không thể cấp phiên đăng nhập Supabase.' },
        { status: 401 }
      );
    }

    const legacyUser =
      (profileRow.legacy_user_id && (await findUserByIdentifierDb(profileRow.legacy_user_id))) ||
      (await findUserByIdentifierDb(profileRow.email)) ||
      undefined;

    const formattedUser = {
      id: legacyUser?.id || profileRow.id,
      username: legacyUser?.username || profileRow.email,
      firstname: legacyUser?.firstname || profileRow.full_name.split(' ').slice(-1)[0] || '',
      lastname: legacyUser?.lastname || profileRow.full_name.split(' ').slice(0, -1).join(' ') || '',
      fullname: profileRow.full_name,
      full_name: profileRow.full_name,
      email: profileRow.email,
      phone: profileRow.phone || '',
      role: profileRow.role,
      relationship: profileRow.relationship || 'Tenant',
      apartment_code: profileRow.apartment_code || '',
      avatar_url: profileRow.avatar_url || matchResult.profile.avatarUrl || '',
      avatar: profileRow.avatar_url || matchResult.profile.avatarUrl || '',
    };

    return NextResponse.json({
      success: true,
      message: `Xác thực FaceID thành công: ${formattedUser.fullname}`,
      matchScore: matchResult.score || 0,
      bestAngle: matchResult.bestAngle || 'Chính diện',
      sampleScores: matchResult.sampleScores,
      user: formattedUser,
    });
  } catch (error: any) {
    logFailedAttempt(ip, 'INTERNAL_ERROR', { error: error?.message });
    console.error('FaceID login error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ xác thực khuôn mặt.' },
      { status: 500 }
    );
  }
}

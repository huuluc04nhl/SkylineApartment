import { NextResponse } from 'next/server';
import { getUserStore, StoredUser } from '@/lib/userStore';
import { identifyFaceAmongEnrolled } from '@/lib/biometricFaceEngine';
import { getAllEnrolledFaceProfiles, saveEnrolledFaceProfile } from '@/lib/faceEnrollStore';

function formatToDateInput(d?: string): string {
  if (!d) return '';
  const cleanD = d.replace(/[^\d\/\-\.]/g, '');
  const parts = cleanD.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    if (parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return d;
}

/**
 * Trích xuất kích thước và định dạng ảnh từ Buffer
 */
function parseImageDimensions(buf: Buffer): { width: number; height: number; type: string } | null {
  if (buf.length < 16) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
      type: 'png'
    };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 10) {
      if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) {
        return {
          height: buf.readUInt16BE(i + 5),
          width: buf.readUInt16BE(i + 7),
          type: 'jpeg'
        };
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
 * API chuẩn xác thực sinh trắc học FaceID 1:N
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { faceImage, faceVector, isCameraCapture } = body;

    // 1. Kiểm tra ảnh đầu vào hoặc vector đặc trưng
    if ((!faceImage || typeof faceImage !== 'string' || faceImage.trim() === '') && !Array.isArray(faceVector)) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp hình ảnh khuôn mặt.' },
        { status: 400 }
      );
    }

    let imageBuffer: Buffer | null = null;
    if (faceImage && typeof faceImage === 'string') {
      const base64Data = faceImage.startsWith('data:image/')
        ? faceImage.replace(/^data:image\/\w+;base64,/, '')
        : faceImage.trim();
      try {
        imageBuffer = Buffer.from(base64Data, 'base64');
      } catch {
        imageBuffer = null;
      }
    }

    // 2. Kiểm tra chất lượng và độ rõ nét
    if (imageBuffer) {
      if (imageBuffer.length < 2500) {
        return NextResponse.json(
          { success: false, message: 'Ảnh khuôn mặt quá mờ hoặc dung lượng quá nhỏ.' },
          { status: 400 }
        );
      }

      const dimensions = parseImageDimensions(imageBuffer);
      if (dimensions && (dimensions.width < 100 || dimensions.height < 100)) {
        return NextResponse.json(
          { success: false, message: 'Độ phân giải ảnh quá thấp (yêu cầu tối thiểu 150x150px).' },
          { status: 400 }
        );
      }
    }

    // 3. Cơ sở dữ liệu FaceID ĐÃ ĐĂNG KÝ MẪU CHÍNH THỨC (Chỉ lấy hồ sơ có vector 128-D thật)
    const serverProfiles = getAllEnrolledFaceProfiles();
    const enrolledProfiles = serverProfiles.filter(p =>
      p && Array.isArray(p.descriptor) && p.descriptor.length === 128 && p.descriptor.some(v => v !== 0)
    );

    // Đồng bộ hồ sơ 4 mẫu quét từ client (nếu có và phải có vector thật)
    if (Array.isArray(body.clientProfiles)) {
      body.clientProfiles.forEach((cp: any) => {
        if (cp && cp.userId && Array.isArray(cp.descriptor) && cp.descriptor.length === 128 && cp.descriptor.some((v: number) => v !== 0)) {
          if (!cp.apartmentCode) {
            cp.apartmentCode = 'CH-06';
          }
          if (!enrolledProfiles.some(p => p.userId === cp.userId)) {
            enrolledProfiles.push(cp);
            try {
              saveEnrolledFaceProfile(cp);
            } catch (e) {
              console.warn('Sync client profile error:', e);
            }
          }
        }
      });
    }

    // Đảm bảo hồ sơ có apartmentCode hợp lệ
    enrolledProfiles.forEach(p => {
      if (p && !p.apartmentCode) {
        p.apartmentCode = 'CH-06';
      }
    });

    if (enrolledProfiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          matchScore: 0,
          message: 'Chưa có hồ sơ sinh trắc học FaceID thực tế nào được kích hoạt trên hệ thống. Vui lòng đăng nhập bằng tài khoản và mật khẩu, sau đó hoàn tất quét 4 góc mặt tại mục Hồ Sơ Cá Nhân.',
        },
        { status: 401 }
      );
    }

    // 4. Nhận diện sinh trắc học 1:N đối soát với vector pixel chuẩn hóa
    const liveInput = (Array.isArray(faceVector) && faceVector.length === 128)
      ? faceVector
      : faceImage;

    const threshold = isCameraCapture ? 68.0 : 72.0;
    const matchResult = identifyFaceAmongEnrolled(liveInput, enrolledProfiles, threshold);

    if (matchResult.profile && !matchResult.profile.apartmentCode) {
      matchResult.profile.apartmentCode = 'CH-06';
    }

    // 5. Nếu không khớp bất kỳ khuôn mặt nào trong 4 mẫu
    if (!matchResult.matched || !matchResult.profile) {
      return NextResponse.json(
        {
          success: false,
          matchScore: matchResult.score,
          bestAngle: matchResult.bestAngle,
          sampleScores: matchResult.sampleScores,
          message: matchResult.message || 'Khuôn mặt chưa được đăng ký FaceID trên hệ thống hoặc độ tương đồng không đạt chuẩn an toàn.',
        },
        { status: 401 }
      );
    }

    // 5.1 Kiểm tra phê duyệt
    if (matchResult.profile.status === 'PENDING_OWNER') {
      return NextResponse.json(
        {
          success: false,
          matchScore: matchResult.score,
          bestAngle: matchResult.bestAngle,
          sampleScores: matchResult.sampleScores,
          message: `Hồ sơ 4 mẫu FaceID của cư dân ${matchResult.profile.fullName} (Căn ${matchResult.profile.apartmentCode}) đang chờ Chủ Hộ xác nhận trước khi gửi Ban Quản Lý phê duyệt. Vui lòng nhắc Chủ Hộ vào mục Quản lý người thân để xác nhận hoặc đăng nhập bằng Email / Mật khẩu.`,
        },
        { status: 403 }
      );
    }

    if (matchResult.profile.status === 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          matchScore: matchResult.score,
          bestAngle: matchResult.bestAngle,
          sampleScores: matchResult.sampleScores,
          message: `Hồ sơ 4 mẫu FaceID của cư dân ${matchResult.profile.fullName} (Căn ${matchResult.profile.apartmentCode}) đang chờ Ban Quản Lý phê duyệt. Vui lòng liên hệ BQL hoặc đăng nhập bằng Email / Mật khẩu.`,
        },
        { status: 403 }
      );
    }

    if (matchResult.profile.status === 'REVOKED') {
      return NextResponse.json(
        {
          success: false,
          matchScore: matchResult.score,
          message: `Quyền truy cập FaceID của cư dân ${matchResult.profile.fullName} đã bị thu hồi. Vui lòng liên hệ VinHomes Manager để kích hoạt lại.`,
        },
        { status: 403 }
      );
    }

    const matchedUserId = matchResult.profile.userId;
    const matchScore = matchResult.score;

    // 6. XÁC ĐỊNH DANH TÍNH CƯ DÂN ĐÃ KHỚP KHUÔN MẶT ĐÃ ĐƯỢC PHÊ DUYỆT
    let matchedUserRecord = getUserStore(matchedUserId);
    if (!matchedUserRecord && matchResult.profile.phone) {
      matchedUserRecord = getUserStore(matchResult.profile.phone);
    }
    if (!matchedUserRecord && matchResult.profile.email) {
      matchedUserRecord = getUserStore(matchResult.profile.email);
    }

    // Nếu người dùng không nằm trong bộ nhớ tạm, khởi tạo từ hồ sơ FaceID chính thức
    if (!matchedUserRecord) {
      const p = matchResult.profile;
      matchedUserRecord = {
        id: p.userId,
        username: p.email || p.phone || p.userId,
        fullname: p.fullName,
        full_name: p.fullName,
        email: p.email || '',
        phone: p.phone || '',
        role: (p.userId.includes('manager01') || p.email?.includes('admin'))
          ? 'ADMIN'
          : p.userId.includes('manager02')
            ? 'TECHNICIAN'
            : 'OWNER',
        apartment_code: p.apartmentCode || 'CH-06',
        avatar_url: p.avatarUrl || '',
      };
    }

    // 7. CẤP PHIÊN ĐĂNG NHẬP SINH TRẮC HỌC CHÍNH THỨC (BIOMETRIC SESSION TOKEN)
    const token = (matchedUserRecord as any).access_token || `SKYLINE_FACEID_SESSION_${matchedUserRecord.id}_${matchedUserRecord.role || 'RESIDENT'}_${Date.now()}`;

    let resolvedApt = matchedUserRecord.apartment_code || matchResult.profile?.apartmentCode || 'CH-06';
    if (matchedUserRecord.role === 'ADMIN') {
      resolvedApt = 'BQL_OFFICE';
    } else if (matchedUserRecord.role === 'TECHNICIAN') {
      resolvedApt = 'TECH_ROOM';
    }

    const formattedUser = {
      id: String(matchedUserRecord.id),
      username: matchedUserRecord.username || matchedUserRecord.email || matchedUserRecord.phone || '',
      firstname: matchedUserRecord.firstname || matchedUserRecord.fullname?.split(' ').slice(-1)[0] || '',
      lastname: matchedUserRecord.lastname || matchedUserRecord.fullname?.split(' ').slice(0, -1).join(' ') || '',
      fullname: matchedUserRecord.fullname || matchResult.profile.fullName,
      full_name: matchedUserRecord.fullname || matchResult.profile.fullName,
      email: matchedUserRecord.email || matchResult.profile.email || '',
      phone: matchedUserRecord.phone || matchResult.profile.phone || '',
      role: matchedUserRecord.role || 'OWNER',
      relationship: (matchedUserRecord.role === 'ADMIN' || matchedUserRecord.role === 'TECHNICIAN')
        ? 'Staff'
        : (matchedUserRecord.role === 'OWNER' ? 'Owner' : 'Family'),
      apartment_code: resolvedApt,
      avatar_url: matchedUserRecord.avatar_url || matchResult.profile.avatarUrl || '',
      avatar: matchedUserRecord.avatar_url || matchResult.profile.avatarUrl || '',
      id_number: matchedUserRecord.id_card_no || '',
      id_card_no: matchedUserRecord.id_card_no || '',
      dob: formatToDateInput(matchedUserRecord.dob),
      pob: matchedUserRecord.pob || '',
    };

    const res = NextResponse.json({
      success: true,
      message: `Xác thực FaceID thành công: ${formattedUser.fullname} (${formattedUser.apartment_code}) - Mẫu khớp: ${matchResult.bestAngle || 'Chính diện'}`,
      matchScore: matchScore || 0,
      bestAngle: matchResult.bestAngle || 'Chính diện',
      sampleScores: matchResult.sampleScores,
      access_token: token,
      user: formattedUser,
    });

    res.cookies.set('skyline_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 ngày
    });

    res.cookies.set('skyline_user_role', formattedUser.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (error: any) {
    console.error('FaceID login error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ xác thực khuôn mặt.' },
      { status: 500 }
    );
  }
}

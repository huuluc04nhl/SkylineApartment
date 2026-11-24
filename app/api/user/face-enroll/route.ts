import { NextResponse } from 'next/server';
import { extractFaceDescriptorFromBase64, analyzeBiometric4Samples, EnrolledFaceProfile } from '@/lib/biometricFaceEngine';
import { saveEnrolledFaceProfile, getEnrolledFaceProfile, getAllEnrolledFaceProfiles } from '@/lib/faceEnrollStore';
import { updateUserStore, getUserStore, updateApartmentMember } from '@/lib/userStore';
import { submitEkycRequest } from '@/lib/ekycStore';

/**
 * GET /api/user/face-enroll?userId=...
 * Đồng bộ hồ sơ 4 mẫu FaceID giữa Mobile, Desktop và Ban Quản Lý
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const profile = getEnrolledFaceProfile(userId);
      return NextResponse.json({
        success: true,
        profile: profile || null,
      });
    }

    const profiles = getAllEnrolledFaceProfiles();
    return NextResponse.json({
      success: true,
      profiles,
    });
  } catch (error: any) {
    console.error('Lỗi GET face-enroll:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi tải thông tin FaceID.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { 
      action,
      userId, 
      fullName, 
      apartmentCode, 
      phone, 
      email,
      samples,
      isFamilyMemberSelfEnroll,
      submittedByRole
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin định danh người dùng (userId).' },
        { status: 400 }
      );
    }

    // =========================================================================
    // CASE 1: CHỦ HỘ XÁC NHẬN HỒ SƠ FACEID CỦA NGƯỜI NHÀ ĐỂ GỬI BQL
    // =========================================================================
    if (action === 'CONFIRM_BY_OWNER') {
      let existingProfile = getEnrolledFaceProfile(userId);
      if (!existingProfile && phone) {
        existingProfile = getEnrolledFaceProfile(phone);
      }
      if (!existingProfile) {
        const all = getAllEnrolledFaceProfiles();
        existingProfile = all.find(p => 
          (p.userId && p.userId.toLowerCase().trim() === userId.toLowerCase().trim()) ||
          (p.phone && phone && p.phone.trim() === phone.trim()) ||
          (p.phone && p.phone.trim() === userId.trim())
        ) || null;
      }

      if (!existingProfile) {
        return NextResponse.json(
          { success: false, message: 'Không tìm thấy hồ sơ mẫu FaceID cần xác nhận.' },
          { status: 404 }
        );
      }

      existingProfile.status = 'PENDING';
      existingProfile.confirmedByOwner = true;
      existingProfile.confirmedByOwnerAt = new Date().toISOString();
      saveEnrolledFaceProfile(existingProfile);

      const targetApt = apartmentCode || existingProfile.apartmentCode || 'CH-06';
      updateApartmentMember(targetApt, userId, {
        faceStatus: 'Đang Chờ BQL Phê Duyệt',
      });
      if (existingProfile.phone && existingProfile.phone !== userId) {
        updateApartmentMember(targetApt, existingProfile.phone, {
          faceStatus: 'Đang Chờ BQL Phê Duyệt',
        });
      }

      const existingUser = getUserStore(userId);
      try {
        submitEkycRequest({
          userId,
          fullName: existingProfile.fullName,
          roleLabel: 'Người Nhà (Đã Chủ Hộ Xác Nhận)',
          apartmentCode: targetApt,
          phone: existingProfile.phone || existingUser?.phone || '',
          idCardNo: existingUser?.id_card_no || '079198005678',
          idDate: existingUser?.id_date || '10/01/2023',
          idPlace: existingUser?.id_place || 'Cục Cảnh sát QLHC về TTXH',
          avatarUrl: existingUser?.avatar_url || existingProfile.avatarUrl || '',
          idCardFrontUrl: existingUser?.cccd_front_url || '',
          idCardBackUrl: existingUser?.cccd_back_url || '',
          faceSamples: {
            front: existingProfile.samples.front,
            left: existingProfile.samples.left,
            right: existingProfile.samples.right,
            smile: existingProfile.samples.smile,
          },
          faceScore: existingProfile.faceScore || 0,
        });
      } catch (e) {
        console.warn('Submit e-KYC request to BQL error:', e);
      }

      return NextResponse.json({
        success: true,
        message: `Chủ hộ đã xác nhận hồ sơ FaceID cho thành viên "${existingProfile.fullName}" và gửi Ban Quản Lý phê duyệt thành công!`,
        profile: existingProfile,
      });
    }

    // =========================================================================
    // CASE 2: THU THẬP MẪU FACEID MỚI (BỞI CHỦ HỘ HOẶC NGƯỜI NHÀ TỰ QUÉT)
    // =========================================================================
    if (!samples || !samples.front || !samples.left || !samples.right || !samples.smile) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Quy trình thu thập sinh trắc học yêu cầu đầy đủ 4 mẫu góc mặt: Nhìn thẳng, Nghiêng trái, Nghiêng phải và Xác thực sống (Liveness).' 
        },
        { status: 400 }
      );
    }

    const ensureBase64DataUrl = (str: string): string => {
      if (!str || typeof str !== 'string') return '';
      const trimmed = str.trim();
      if (trimmed.startsWith('data:image/')) return trimmed;
      return `data:image/jpeg;base64,${trimmed}`;
    };

    const normalizedSamples = {
      front: ensureBase64DataUrl(samples.front),
      left: ensureBase64DataUrl(samples.left),
      right: ensureBase64DataUrl(samples.right),
      smile: ensureBase64DataUrl(samples.smile),
    };

    // 1. Phân tích sinh trắc học 4 góc thật bằng thuật toán thực tế (Anti-spoofing & Multi-angle fusion)
    const analysis = analyzeBiometric4Samples(normalizedSamples);
    if (!analysis.valid) {
      return NextResponse.json(
        {
          success: false,
          message: analysis.error || 'Dữ liệu sinh trắc học không hợp lệ hoặc phát hiện gian lận ảnh tĩnh.',
          details: analysis.details,
        },
        { status: 400 }
      );
    }

    // Lấy thông tin user hiện tại (giữ nguyên avatar_url, không ghi đè)
    const existingUser = getUserStore(userId);
    const targetApt = apartmentCode || existingUser?.apartment_code || 'CH-06';

    // Xác định luồng: Nếu là Người nhà tự quét (TENANT) -> status = 'PENDING_OWNER' (chờ chủ hộ duyệt)
    // Nếu do Chủ hộ đích thân quét hoặc Chủ hộ tự làm -> status = 'PENDING' (gửi thẳng BQL)
    const isPendingOwner = isFamilyMemberSelfEnroll || (submittedByRole === 'TENANT' && existingUser?.role !== 'OWNER');

    const faceProfile: EnrolledFaceProfile = {
      userId,
      fullName: fullName || existingUser?.fullname || 'Cư Dân Skyline',
      apartmentCode: targetApt,
      phone: phone || existingUser?.phone || '',
      email: email || existingUser?.email || (userId.includes('@') ? userId : ''),
      avatarUrl: existingUser?.avatar_url || '',
      samples: normalizedSamples,
      descriptor: (Array.isArray(body.descriptor) && body.descriptor.length === 128)
        ? body.descriptor
        : analysis.compositeDescriptor,
      descriptorsByAngle: body.descriptorsByAngle || analysis.descriptorsByAngle,
      enrolledAt: new Date().toISOString(),
      status: isPendingOwner ? 'PENDING_OWNER' : 'PENDING',
      confirmedByOwner: !isPendingOwner,
      confirmedByOwnerAt: !isPendingOwner ? new Date().toISOString() : undefined,
      faceScore: typeof body.faceScore === 'number' ? body.faceScore : analysis.faceScore,
      livenessVerified: true,
    };

    // 2. Lưu vào FaceEnrollStore (Bộ nhớ + File .skyline_faces.json trên server)
    saveEnrolledFaceProfile(faceProfile);

    // 3. Cập nhật trạng thái FaceID trong ApartmentMember
    updateApartmentMember(targetApt, userId, {
      faceStatus: isPendingOwner ? 'Chờ Chủ Hộ Xác Nhận' : 'Đang Chờ BQL Phê Duyệt',
    });

    // 4. Cập nhật User Store
    updateUserStore(userId, {
      updated_at: new Date().toISOString(),
    });

    // 5. Nếu không phải chờ chủ hộ xác nhận (đã được Chủ hộ bảo lãnh), gửi thẳng BQL
    if (!isPendingOwner) {
      try {
        submitEkycRequest({
          userId,
          fullName: faceProfile.fullName,
          roleLabel: existingUser?.role === 'OWNER' ? 'Chủ Hộ' : 'Cư Dân',
          apartmentCode: faceProfile.apartmentCode,
          phone: faceProfile.phone || '',
          idCardNo: existingUser?.id_card_no || '067204000961',
          idDate: existingUser?.id_date || '18/08/2022',
          idPlace: existingUser?.id_place || 'Cục Cảnh sát QLHC về TTXH',
          avatarUrl: existingUser?.avatar_url || '',
          idCardFrontUrl: existingUser?.cccd_front_url || '',
          idCardBackUrl: existingUser?.cccd_back_url || '',
          faceSamples: normalizedSamples,
          faceScore: faceProfile.faceScore,
        });
      } catch (e) {
        console.warn('Sync ekyc request error:', e);
      }
    }

    const message = isPendingOwner
      ? 'Đã thu thập 4 mẫu FaceID thành công! Hồ sơ đang chờ Chủ Hộ căn hộ xác nhận trước khi chuyển tới Ban Quản Lý.'
      : 'Thu thập 4 mẫu FaceID thành công! Hồ sơ đã được chuyển đến Ban Quản Lý để thẩm định và phê duyệt.';

    return NextResponse.json({
      success: true,
      message,
      status: faceProfile.status,
      profile: {
        userId: faceProfile.userId,
        fullName: faceProfile.fullName,
        apartmentCode: faceProfile.apartmentCode,
        enrolledAt: faceProfile.enrolledAt,
        status: faceProfile.status,
        confirmedByOwner: faceProfile.confirmedByOwner,
        faceScore: faceProfile.faceScore,
        livenessVerified: faceProfile.livenessVerified,
        poseVarianceScore: analysis.poseVarianceScore,
        samples: faceProfile.samples,
        details: analysis.details,
      },
    });
  } catch (error: any) {
    console.error('Lỗi API face-enroll:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi hệ thống khi lưu trữ mẫu FaceID.' },
      { status: 500 }
    );
  }
}

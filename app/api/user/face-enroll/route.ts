import { NextResponse } from 'next/server';
import { analyzeBiometric4Samples, EnrolledFaceProfile } from '@/lib/biometricFaceEngine';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { updateUserProfileDb, updateApartmentMemberDb } from '@/lib/server/userDb';
import { submitEkycRequestDb } from '@/lib/server/ekycDb';

/**
 * GET /api/user/face-enroll?userId=...
 * Chỉ cho phép khi đã đăng nhập; trả hồ sơ từ bảng face_enrollments
 */
export async function GET(req: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId) {
      if (session.role !== 'ADMIN' && userId !== session.profile.id && userId !== session.authUserId) {
        return NextResponse.json({ success: false, message: 'Không có quyền xem hồ sơ này' }, { status: 403 });
      }
      const { data, error } = await supabaseAdmin
        .from('face_enrollments')
        .select('*')
        .or(`user_id.eq.${userId},auth_user_id.eq.${userId}`)
        .maybeSingle();
      if (error) throw new Error((error instanceof Error ? error.message : String(error)));
      return NextResponse.json({ success: true, profile: data || null });
    }

    let query = supabaseAdmin.from('face_enrollments').select('*');
    if (session.role !== 'ADMIN') {
      query = query.eq('auth_user_id', session.authUserId);
    }
    const { data, error } = await query;
    if (error) throw new Error((error instanceof Error ? error.message : String(error)));
    return NextResponse.json({ success: true, profiles: data || [] });
  } catch (error: unknown) {
    console.error('Lỗi GET face-enroll:', error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi tải thông tin FaceID.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập trước khi đăng ký FaceID.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      action,
      userId: requestedUserId,
      fullName,
      apartmentCode,
      phone,
      email,
      samples,
      isFamilyMemberSelfEnroll,
      submittedByRole,
    } = body;

    const userId = requestedUserId || session.profile.id;

    if (action === 'CONFIRM_BY_OWNER') {
      const { data: existingProfile, error: findErr } = await supabaseAdmin
        .from('face_enrollments')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (findErr) throw new Error(findErr.message);
      if (!existingProfile) {
        return NextResponse.json(
          { success: false, message: 'Không tìm thấy hồ sơ mẫu FaceID cần xác nhận.' },
          { status: 404 }
        );
      }

      const { data: updatedProfile, error: updateErr } = await supabaseAdmin
        .from('face_enrollments')
        .update({ status: 'PENDING' })
        .eq('user_id', existingProfile.user_id)
        .select('*')
        .single();

      if (updateErr) throw new Error(updateErr.message);

      const targetApt = (apartmentCode || existingProfile.apartment_code || session.apartment_code || '').trim();
      if (!targetApt) {
        return NextResponse.json({ success: false, message: 'Thiếu mã căn hộ hợp lệ.' }, { status: 400 });
      }
      await updateApartmentMemberDb(targetApt, userId, {
        faceStatus: 'Đang Chờ BQL Phê Duyệt',
      });

      return NextResponse.json({
        success: true,
        message: `Chủ hộ đã xác nhận hồ sơ FaceID cho thành viên "${existingProfile.full_name}" và gửi Ban Quản Lý phê duyệt thành công!`,
        profile: updatedProfile,
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

    const existingUser = session.profile;
    const targetApt = (apartmentCode || existingUser.apartment_code || '').trim();
    if (!targetApt) {
      return NextResponse.json({ success: false, message: 'Thiếu mã căn hộ hợp lệ.' }, { status: 400 });
    }

    // Xác định luồng: Nếu là Người nhà tự quét (TENANT) -> status = 'PENDING_OWNER' (chờ chủ hộ duyệt)
    // Nếu do Chủ hộ đích thân quét hoặc Chủ hộ tự làm -> status = 'PENDING' (gửi thẳng BQL)
    const isPendingOwner = isFamilyMemberSelfEnroll || (submittedByRole === 'TENANT' && session.role !== 'OWNER');
    const finalStatus = isPendingOwner ? 'PENDING_OWNER' : 'PENDING';
    const finalDescriptor = (Array.isArray(body.descriptor) && body.descriptor.length === 128)
      ? body.descriptor
      : analysis.compositeDescriptor;
    const finalEmail = (email || session.email || '').toLowerCase();
    const finalFullName = fullName || existingUser.fullname || 'Cư Dân Skyline';
    const finalPhone = phone || existingUser.phone || '';
    const finalFaceScore = typeof body.faceScore === 'number' ? body.faceScore : analysis.faceScore;

    const faceProfile: EnrolledFaceProfile = {
      userId,
      fullName: finalFullName,
      apartmentCode: targetApt,
      phone: finalPhone,
      email: finalEmail,
      avatarUrl: existingUser.avatar_url || '',
      samples: normalizedSamples,
      descriptor: finalDescriptor,
      descriptorsByAngle: body.descriptorsByAngle || analysis.descriptorsByAngle,
      enrolledAt: new Date().toISOString(),
      status: finalStatus,
      confirmedByOwner: !isPendingOwner,
      confirmedByOwnerAt: !isPendingOwner ? new Date().toISOString() : undefined,
      faceScore: finalFaceScore,
      livenessVerified: true,
    };

    // 2. Lưu trực tiếp vào bảng face_enrollments trên Supabase
    const { error: upsertErr } = await supabaseAdmin.from('face_enrollments').upsert({
      user_id: userId,
      auth_user_id: session.authUserId,
      phone: finalPhone,
      email: finalEmail,
      full_name: finalFullName,
      apartment_code: targetApt,
      avatar_url: existingUser.avatar_url || null,
      descriptor: finalDescriptor,
      face_score: finalFaceScore,
      status: finalStatus,
      enrolled_at: faceProfile.enrolledAt,
      samples: normalizedSamples as any,
      metadata: {
        descriptorsByAngle: faceProfile.descriptorsByAngle || null,
        confirmedByOwner: !isPendingOwner,
      } as any,
    });
    if (upsertErr) {
      throw new Error(`Không thể lưu hồ sơ FaceID vào Supabase: ${upsertErr.message}`);
    }

    // 3. Cập nhật trạng thái FaceID trong ApartmentMember
    await updateApartmentMemberDb(targetApt, userId, {
      faceStatus: isPendingOwner ? 'Chờ Chủ Hộ Xác Nhận' : 'Đang Chờ BQL Phê Duyệt',
    });

    // 4. Cập nhật User Profile
    await updateUserProfileDb(userId, {});

    // 5. Nếu không phải chờ chủ hộ xác nhận (đã được Chủ hộ bảo lãnh), gửi thẳng BQL
    if (!isPendingOwner) {
      try {
        await submitEkycRequestDb({
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
  } catch (error: unknown) {
    console.error('Lỗi API face-enroll:', error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi hệ thống khi lưu trữ mẫu FaceID.' },
      { status: 500 }
    );
  }
}

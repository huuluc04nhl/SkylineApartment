import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import {
  listEkycSubmissionsDb,
  getEkycForUserDb,
  submitEkycRequestDb,
  approveEkycRequestDb,
  rejectEkycRequestDb,
  revokeEkycRequestDb,
  confirmEkycByOwnerDb,
  updateEnrolledFaceStatusDb,
  EkycRpcError,
} from '@/lib/server/ekycDb';
import { updateUserProfileDb, updateApartmentMemberDb } from '@/lib/server/userDb';
import { verifyFaceWithCccd } from '@/lib/ekycValidator';

/**
 * GET /api/ekyc
 * Returns e-KYC requests for BQL or own user
 */
export async function GET(req: Request) {
  const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (guard.session.role !== 'ADMIN') {
    const ownEkyc = await getEkycForUserDb(guard.session.profile.id);
    return NextResponse.json({
      success: true,
      ekyc: ownEkyc || null,
    });
  }

  if (userId) {
    const userEkyc = await getEkycForUserDb(userId);
    return NextResponse.json({
      success: true,
      ekyc: userEkyc || null,
    });
  }

  const allRequests = await listEkycSubmissionsDb();
  return NextResponse.json({
    success: true,
    requests: allRequests,
  });
}

/**
 * POST /api/ekyc
 * Submits e-KYC or handles BQL approve/reject/confirm
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    let sessionRole: string | undefined;
    let sessionApt: string | null = null;

    if (action === 'APPROVE' || action === 'REJECT' || action === 'REVOKE') {
      const adminGuard = await requireAuth(['ADMIN']);
      if (!adminGuard.ok) return adminGuard.response;
      sessionRole = adminGuard.session.role;
      sessionApt = adminGuard.session.apartment_code;
    } else if (action === 'CONFIRM_BY_OWNER') {
      const ownerGuard = await requireAuth(['ADMIN', 'OWNER']);
      if (!ownerGuard.ok) return ownerGuard.response;
      sessionRole = ownerGuard.session.role;
      sessionApt = ownerGuard.session.apartment_code;
    } else {
      const userGuard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
      if (!userGuard.ok) return userGuard.response;
      sessionRole = userGuard.session.role;
      sessionApt = userGuard.session.apartment_code;
    }

    // 1. Resident Submits e-KYC
    if (action === 'SUBMIT') {
      const {
        userId,
        fullName,
        roleLabel,
        apartmentCode,
        phone,
        email,
        idCardNo,
        idDate,
        idPlace,
        dob,
        pob,
        avatarUrl,
        idCardFrontUrl,
        idCardBackUrl,
        faceSamples,
        isFamilyMemberSelfEnroll,
        submittedByRole
      } = body;

      const resolvedApt = (
        sessionRole === 'ADMIN'
          ? apartmentCode
          : sessionApt || apartmentCode
      )?.trim();

      if (!resolvedApt) {
        return NextResponse.json(
          { success: false, message: 'Vui lòng cung cấp mã căn hộ hợp lệ khi gửi hồ sơ e-KYC.' },
          { status: 400 }
        );
      }

      // Không dùng isSimulation và faceScore do client gửi: tự tính điểm phía server,
      // nếu không xác minh tự động được thì ghi 0 (chưa xác minh) để BQL duyệt thủ công.
      const faceSource = faceSamples?.front || avatarUrl || '';
      const serverBio = verifyFaceWithCccd(faceSource, idCardFrontUrl || '');
      const verifiedServerScore = !serverBio.isSimulation ? serverBio.similarity : 0;

      const isPendingOwner = isFamilyMemberSelfEnroll || (submittedByRole === 'TENANT');
      const targetStatus = isPendingOwner ? 'PENDING_OWNER' : 'PENDING';

      const newRequest = await submitEkycRequestDb({
        userId: userId || phone,
        fullName,
        roleLabel,
        apartmentCode: resolvedApt,
        phone,
        email,
        idCardNo,
        idDate,
        idPlace,
        dob,
        pob,
        avatarUrl,
        idCardFrontUrl: idCardFrontUrl || '',
        idCardBackUrl: idCardBackUrl || '',
        faceSamples,
        faceScore: verifiedServerScore,
        status: targetStatus,
        isSimulation: false,
        algorithm: serverBio.isSimulation ? 'MANUAL_BQL_VERIFICATION' : 'PERCEPTUAL_COSINE_SIMILARITY',
      });

      // Synchronize apartment member face status
      try {
        await updateApartmentMemberDb(resolvedApt, userId || phone, {
          faceStatus: isPendingOwner ? 'Chờ Chủ Hộ Xác Nhận' : 'Đang Chờ BQL Phê Duyệt',
          avatarUrl: avatarUrl,
          idCard: idCardNo,
        });
        await updateEnrolledFaceStatusDb(userId || phone, targetStatus);
      } catch (memErr) {
        console.warn('Sync member face status on submit error:', memErr);
      }

      return NextResponse.json({
        success: true,
        message: isPendingOwner
          ? 'Hồ sơ định danh e-KYC đã được gửi tới Chủ Hộ để xác nhận trước khi chuyển Ban Quản Lý.'
          : 'Hồ sơ định danh e-KYC đã được gửi đến Ban Quản Lý thẩm duyệt thành công.',
        ekyc: newRequest,
      });
    }

    // 1b. Owner Confirms Family Member e-KYC (chỉ xác nhận cho thành viên cùng apartment_code từ phiên)
    if (action === 'CONFIRM_BY_OWNER') {
      const { userId, phone } = body;
      const targetId = userId || phone;
      const actorApt = sessionRole === 'ADMIN' ? null : (sessionApt || '__NONE__');
      const confirmed = await confirmEkycByOwnerDb(targetId, actorApt);

      if (confirmed) {
        try {
          await updateApartmentMemberDb(confirmed.apartmentCode, confirmed.userId, {
            faceStatus: 'Đang Chờ BQL Phê Duyệt',
          });
        } catch (e) {
          console.warn('Sync confirm by owner error:', e);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Chủ Hộ đã xác nhận hồ sơ của thành viên và gửi tới Ban Quản Lý thành công.',
        ekyc: confirmed,
      });
    }

    // 2. BQL Approves e-KYC (cập nhật đồng thời ekyc_submissions + face_enrollments trong 1 RPC transaction)
    if (action === 'APPROVE') {
      const { id, approverName } = body;
      const approved = await approveEkycRequestDb(id, approverName || 'VinHomes Manager');
      if (!approved) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy hồ sơ e-KYC' }, { status: 404 });
      }

      try {
        await updateUserProfileDb(approved.userId, {
          fullname: approved.fullName,
          full_name: approved.fullName,
          id_number: approved.idCardNo,
          id_card_no: approved.idCardNo,
          id_date: approved.idDate,
          id_place: approved.idPlace,
          dob: approved.dob,
          pob: approved.pob,
          avatar_url: approved.avatarUrl,
        });
        if (approved.apartmentCode) {
          await updateApartmentMemberDb(approved.apartmentCode, approved.userId, {
            faceStatus: 'Đã Kích Hoạt FaceID',
            avatarUrl: approved.avatarUrl,
            idCard: approved.idCardNo,
          });
        }
      } catch (err) {
        console.warn('Sync userStore on ekyc approve error:', err);
      }

      return NextResponse.json({
        success: true,
        message: `Đã phê duyệt hồ sơ e-KYC của cư dân ${approved.fullName} & Cấp quyền FaceID thành công.`,
        ekyc: approved,
      });
    }

    // 3. BQL Rejects e-KYC
    if (action === 'REJECT') {
      const { id, reason, approverName } = body;
      const rejected = await rejectEkycRequestDb(id, reason, approverName);
      if (!rejected) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy hồ sơ e-KYC' }, { status: 404 });
      }

      try {
        if (rejected.apartmentCode) {
          await updateApartmentMemberDb(rejected.apartmentCode, rejected.userId, {
            faceStatus: 'BQL Yêu Cầu Chụp Lại',
          });
        }
      } catch (memErr) {
        console.warn('Sync member face status on reject error:', memErr);
      }

      return NextResponse.json({
        success: true,
        message: `Đã từ chối hồ sơ e-KYC của cư dân ${rejected.fullName}.`,
        ekyc: rejected,
      });
    }

    // 4. BQL Revokes e-KYC (Tạm khóa / Thu hồi quyền sau khi đã duyệt - Chỉ ADMIN)
    if (action === 'REVOKE') {
      const { id, reason, approverName } = body;
      const revoked = await revokeEkycRequestDb(
        id,
        reason || 'Ban Quản Lý đã tạm khóa / thu hồi quyền ra vào FaceID theo quy định vận hành.',
        approverName || 'VinHomes Manager'
      );
      if (!revoked) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy hồ sơ e-KYC' }, { status: 404 });
      }

      try {
        if (revoked.apartmentCode) {
          await updateApartmentMemberDb(revoked.apartmentCode, revoked.userId, {
            faceStatus: 'BQL Tạm Khóa / Thu Hồi Quyền',
          });
        }
      } catch (memErr) {
        console.warn('Sync member face status on revoke error:', memErr);
      }

      return NextResponse.json({
        success: true,
        message: `Đã thu hồi quyền ra vào FaceID của cư dân ${revoked.fullName}.`,
        ekyc: revoked,
      });
    }

    return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    if (error instanceof EkycRpcError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

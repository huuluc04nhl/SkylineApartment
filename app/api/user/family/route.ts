import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { 
  getApartmentMembers, 
  addApartmentMember, 
  updateApartmentMember,
  removeApartmentMember, 
  clearApartmentMembers,
  ApartmentMember,
  getUserStore,
  updateUserStore
} from '@/lib/userStore';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { submitEkycRequest } from '@/lib/ekycStore';

/**
 * Lọc tài khoản cư dân hợp lệ để thêm người nhà:
 * 1. TRỪ các tài khoản quản trị viên / nhân viên kỹ thuật (ADMIN, TECHNICIAN, STAFF)
 * 2. TRỪ tài khoản của chính Chủ Hộ đang đăng nhập
 * 3. Chỉ giữ lại các tài khoản cư dân / người nhà phù hợp (TENANT, OWNER, RESIDENT)
 */
function isEligibleFamilyAccount(u: any, hostUser?: any): boolean {
  if (!u) return false;
  const username = (u.username || '').toLowerCase().trim();
  const email = (u.email || '').toLowerCase().trim();
  const role = (u.role || '').toUpperCase().trim();

  // Loại trừ tài khoản quản lý / kỹ thuật
  if (
    role === 'ADMIN' || 
    role === 'TECHNICIAN' || 
    role === 'RECEPTIONIST' || 
    role === 'STAFF'
  ) {
    return false;
  }

  // Loại trừ chính tài khoản Chủ Hộ đang đăng nhập
  if (hostUser) {
    if (u.id && hostUser.id && String(u.id) === String(hostUser.id)) return false;
    if (u.phone && hostUser.phone && u.phone === hostUser.phone) return false;
    if (username && hostUser.username && username === hostUser.username.toLowerCase()) return false;
  }

  return true;
}

/**
 * GET /api/user/family
 * 1. Returns apartment members list
 * 2. Returns pre-verified family accounts from database for this apartment
 * 3. Supports ?search=... to lookup user profile from system database by phone, CCCD, or username
 */
export async function GET(req: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }
    const localUser = session.profile;
    const url = new URL(req.url);
    const paramApt = url.searchParams.get('apartment') || url.searchParams.get('aptCode');
    const rawApt = (paramApt || localUser?.apartment_code || '').trim();
    if (!rawApt) {
      return NextResponse.json({ success: false, message: 'Thiếu mã căn hộ hợp lệ.' }, { status: 400 });
    }
    const aptCode = rawApt;
    const ownerName = localUser?.fullname || localUser?.full_name || 'Chủ Hộ';
    const searchQuery = url.searchParams.get('search')?.trim().toLowerCase();
    const actionQuery = url.searchParams.get('action');

    // Hỗ trợ xóa sạch dữ liệu người nhà ở căn hộ để đồng bộ lại
    if (actionQuery === 'CLEAR_LOCAL') {
      clearApartmentMembers(aptCode);
      return NextResponse.json({
        success: true,
        message: `Đã dọn dẹp sạch dữ liệu lưu tạm của Căn hộ ${aptCode} để đồng bộ mới theo Database.`,
        members: [],
        bqlAccounts: []
      });
    }

    // 1. If searching for an account by Phone / CCCD / Email / Name
    if (searchQuery) {
      const normalize = (str: string) =>
        (str || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();

      const qRaw = searchQuery.toLowerCase().trim();
      const qNorm = normalize(searchQuery);
      const qDigits = searchQuery.replace(/\D/g, '');

      const { data: dbUsersData, error: usersErr } = await supabaseAdmin.from('users').select('*');
      if (usersErr) throw new Error(`Supabase users select error: ${usersErr.message}`);
      const dbUsers = dbUsersData || [];
      const currentMembers = getApartmentMembers(aptCode);

      const matchedList = dbUsers.filter((u) => {
        if (!isEligibleFamilyAccount(u, localUser)) return false;

        const phoneDigits = (u.phone || '').replace(/\D/g, '');
        const idCardClean = (u.id_card_no || '').replace(/\s/g, '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const fullName = (u.full_name || '').toLowerCase();
        const fullNorm = normalize(u.full_name || '');

        return (
          (qDigits.length >= 3 && phoneDigits.includes(qDigits)) ||
          (qDigits.length >= 3 && idCardClean.includes(qDigits)) ||
          username.includes(qRaw) ||
          fullName.includes(qRaw) ||
          (qNorm.length >= 2 && fullNorm.includes(qNorm))
        );
      }).map((matched) => {
        const cleanAvatar = matched.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(matched.full_name)}&background=1C2533&color=C5A880`;
        return {
          id: matched.id,
          username: matched.username,
          fullName: matched.full_name,
          phone: matched.phone,
          idCard: matched.id_card_no || '',
          avatarUrl: cleanAvatar,
          licensePlate: matched.license_plate || '',
          role: 'Family',
          relationship: matched.relationship || 'Người Thân',
          dob: matched.dob || '',
          gender: matched.gender === 0 ? 'Nữ' : 'Nam',
          pob: matched.pob || '',
          apartmentCode: matched.apartment_code || aptCode,
          isAlreadyInUnit: currentMembers.some(
            (m) => m.id === matched.id || m.phone === matched.phone || m.username === matched.username
          ),
        };
      });

      if (matchedList.length > 0) {
        return NextResponse.json({
          success: true,
          found: true,
          account: matchedList[0],
          accounts: matchedList,
        });
      }

      return NextResponse.json({
        success: true,
        found: false,
        message: `Không tìm thấy tài khoản người nhà nào khớp với "${searchQuery}" trên hệ thống.`
      });
    }

    // 2. Fetch current registered members for this apartment
    const members = getApartmentMembers(aptCode);

    // 3. Eligible resident accounts registered in database
    const { data: dbUsersData, error: usersErr } = await supabaseAdmin.from('users').select('*');
    if (usersErr) throw new Error(`Supabase users select error: ${usersErr.message}`);
    const dbUsers = dbUsersData || [];
    const bqlAccounts = dbUsers
      .filter((u) => isEligibleFamilyAccount(u, localUser))
      .map((u) => {
        const cleanAvatar = u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=1C2533&color=C5A880`;
        return {
          id: u.id,
          username: u.username,
          fullName: u.full_name,
          email: u.email,
          phone: u.phone,
          idCard: u.id_card_no || '',
          idDate: u.id_date || '',
          idPlace: u.id_place || '',
          dob: u.dob || '',
          gender: u.gender === 0 ? 'Nữ' : 'Nam',
          pob: u.pob || '',
          avatarUrl: cleanAvatar,
          licensePlate: u.license_plate || '',
          role: 'Family',
          relationship: u.relationship || 'Người Thân',
          isAdded: members.some((m) => m.username === u.username || m.phone === u.phone || m.id === u.id),
        };
      });

    const owner = {
      id: localUser?.id || 'user-owner-1',
      fullName: ownerName,
      phone: localUser?.phone || '0364967082',
      email: localUser?.email || 'huuluc04@gmail.com',
      idCard: localUser?.id_number || localUser?.id_card_no || '067204000961',
      licensePlate: localUser?.license_plate || '51K-988.24',
      avatarUrl: localUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=1C2533&color=C5A880`,
      role: 'OWNER',
      relationship: 'Chủ Hộ (Chủ Sở Hữu)',
      faceStatus: 'Đã Kích Hoạt FaceID',
    };

    return NextResponse.json({
      success: true,
      apartment_code: aptCode,
      owner_name: ownerName,
      owner,
      members,
      bqlAccounts,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi tải danh sách thành viên gia đình từ Database.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/family
 * Add a family member strictly verified from database user records
 */
export async function POST(req: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }
    const currentUser = session.profile;
    const rawApt = (currentUser?.apartment_code || '').trim();
    if (!rawApt) {
      return NextResponse.json({ success: false, message: 'Tài khoản chưa được gán căn hộ hợp lệ.' }, { status: 400 });
    }
    const aptCode = rawApt;
    const ownerName = currentUser?.fullname || currentUser?.full_name || 'Chủ Hộ';
    const ownerPhone = currentUser?.phone || '';

    const body = await req.json();
    const { 
      accountId, 
      username, 
      phone, 
      fullName, 
      relationship = 'Vợ / Chồng', 
      licensePlate,
      idCard,
      avatarUrl,
      dob,
      gender,
      pob,
      idDate,
      idPlace,
      residenceType = 'Thường trú cùng chủ hộ',
      temporaryResidenceStatus = 'Đang Làm Thủ Tục',
      relationshipProof = 'Giấy xác nhận cư trú / Chủ hộ bảo lãnh',
      accessLevel = 'Toàn quyền (Căn hộ + Thang máy + Tiện ích VIP)',
      emergencyContact,
      vehicleType,
      note
    } = body;

    const identifier = accountId || username || phone;
    if (!identifier && !fullName) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng chọn tài khoản hợp lệ từ hệ thống.' },
        { status: 400 }
      );
    }

    // 1. Resolve user from Database
    let resolvedUser: any = undefined;
    if (identifier) {
      const { data: candidates, error: candErr } = await supabaseAdmin
        .from('users')
        .select('*')
        .or(`id.eq.${identifier},username.eq.${identifier},phone.eq.${identifier}`);
      if (candErr) throw new Error(`Supabase user lookup error: ${candErr.message}`);
      resolvedUser = (candidates || []).find((u) => isEligibleFamilyAccount(u, currentUser)) || candidates?.[0];
    }

    // Kiểm tra tính hợp lệ: Không cho phép thêm tài khoản admin/kỹ thuật hoặc chính chủ hộ
    if (resolvedUser && !isEligibleFamilyAccount(resolvedUser, currentUser)) {
      return NextResponse.json(
        { success: false, message: 'Tài khoản Ban Quản Lý / Kỹ Thuật hoặc tài khoản Chủ Hộ không thể đăng ký làm người nhà.' },
        { status: 400 }
      );
    }

    // 2. Build verified member object from Database record
    const finalFullName = (resolvedUser?.full_name || fullName || '').trim();
    const finalPhone = (resolvedUser?.phone || phone || '').trim();
    const finalIdCard = (resolvedUser?.id_card_no || idCard || '').trim();
    const finalAvatar = resolvedUser?.avatar_url || avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalFullName)}&background=1C2533&color=C5A880`;
    const finalLicense = (licensePlate || resolvedUser?.license_plate || '').trim();

    if (!finalFullName || !finalPhone) {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu tài khoản không hợp lệ (thiếu họ tên hoặc số điện thoại).' },
        { status: 400 }
      );
    }

    // 3. Update User Record in Database
    if (resolvedUser) {
      updateUserStore(resolvedUser.id, {
        apartment_code: aptCode,
        relationship: relationship,
        license_plate: finalLicense || resolvedUser.license_plate,
        dob: dob || resolvedUser.dob,
        pob: pob || resolvedUser.pob,
      });
    }

    // 4. Register in apartment member store (Initial status pending BQL approval)
    const newMember: ApartmentMember = {
      id: resolvedUser?.id || `mem-${Date.now()}`,
      username: resolvedUser?.username || username || finalPhone,
      fullName: finalFullName,
      role: 'Family',
      relationship: relationship,
      phone: finalPhone,
      email: resolvedUser?.email || body.email || '',
      idCard: finalIdCard,
      idDate: idDate || resolvedUser?.id_date || '',
      idPlace: idPlace || resolvedUser?.id_place || '',
      dob: dob || resolvedUser?.dob || '',
      gender: gender || (resolvedUser?.gender === 0 ? 'Nữ' : 'Nam'),
      pob: pob || resolvedUser?.pob || '',
      licensePlate: finalLicense,
      vehicleType: vehicleType || (finalLicense ? 'Xe máy' : 'Không có'),
      faceStatus: 'Đang Chờ BQL Phê Duyệt',
      avatarUrl: finalAvatar,
      addedDate: new Date().toLocaleDateString('vi-VN'),

      // Thông tin đồng bộ chuẩn phù hợp với Chủ Hộ bảo lãnh:
      apartmentCode: aptCode,
      tower: 'The Tropical (BS-07)',
      sponsorName: ownerName,
      sponsorPhone: ownerPhone,
      residenceType: residenceType,
      temporaryResidenceStatus: temporaryResidenceStatus,
      relationshipProof: relationshipProof,
      accessLevel: accessLevel,
      startDate: new Date().toLocaleDateString('vi-VN'),
      emergencyContact: emergencyContact || ownerPhone,
      note: note || '',
    };

    const updated = addApartmentMember(aptCode, newMember);

    // 5. Automatically create/sync e-KYC dossier for BQL to review and approve
    try {
      submitEkycRequest({
        userId: newMember.id,
        fullName: finalFullName,
        roleLabel: `Người Nhà (${relationship} - Căn ${aptCode}) - Chủ Hộ ${ownerName} Bảo Lãnh`,
        apartmentCode: aptCode,
        phone: finalPhone,
        idCardNo: finalIdCard,
        avatarUrl: finalAvatar,
        dob: newMember.dob,
        pob: newMember.pob,
        idDate: newMember.idDate,
        idPlace: newMember.idPlace,
        status: 'PENDING',
      });
    } catch (ekycErr) {
      console.warn('Auto create eKYC request for new member error:', ekycErr);
    }

    return NextResponse.json({
      success: true,
      message: `Đã thêm thành viên "${finalFullName}" (${relationship}) vào Căn hộ ${aptCode} thành công. Hồ sơ đang chờ Ban Quản Lý phê duyệt quyền ra vào.`,
      members: updated,
      member: newMember,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi khi xử lý thêm thành viên vào hệ thống.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/family
 * Unlink and revoke access of an apartment member
 */
export async function DELETE(req: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }
    const currentUser = session.profile;
    const rawApt = (currentUser?.apartment_code || '').trim();
    if (!rawApt) {
      return NextResponse.json({ success: false, message: 'Tài khoản chưa được gán căn hộ hợp lệ.' }, { status: 400 });
    }
    const aptCode = rawApt;

    const body = await req.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID thành viên cần hủy liên kết.' },
        { status: 400 }
      );
    }

    const updated = removeApartmentMember(aptCode, memberId);

    return NextResponse.json({
      success: true,
      message: 'Đã hủy liên kết tài khoản thành viên khỏi căn hộ.',
      members: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi xóa thành viên gia đình.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/family
 * Update member details (relationship, licensePlate, phone, CCCD, fullName)
 */
export async function PUT(req: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }
    const currentUser = session.profile;
    const rawApt = (currentUser?.apartment_code || '').trim();
    if (!rawApt) {
      return NextResponse.json({ success: false, message: 'Tài khoản chưa được gán căn hộ hợp lệ.' }, { status: 400 });
    }
    const aptCode = rawApt;

    const body = await req.json();
    const { 
      memberId, 
      relationship, 
      licensePlate, 
      fullName, 
      phone, 
      idCard 
    } = body;

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID thành viên cần cập nhật.' },
        { status: 400 }
      );
    }

    const updates: Partial<ApartmentMember> = {};
    if (relationship !== undefined) updates.relationship = relationship;
    if (licensePlate !== undefined) updates.licensePlate = licensePlate.trim();
    if (fullName !== undefined && fullName.trim()) updates.fullName = fullName.trim();
    if (phone !== undefined && phone.trim()) updates.phone = phone.trim();
    if (idCard !== undefined && idCard.trim()) updates.idCard = idCard.trim();

    // 1. Update apartment member store
    const updated = updateApartmentMember(aptCode, memberId, updates);

    // 2. Also update in userStore if matched
    try {
      const liveUser = getUserStore(memberId);
      if (liveUser && liveUser.id) {
        updateUserStore(liveUser.id, {
          relationship: updates.relationship || liveUser.relationship,
          license_plate: updates.licensePlate !== undefined ? updates.licensePlate : liveUser.license_plate,
          full_name: updates.fullName || liveUser.full_name,
          phone: updates.phone || liveUser.phone,
          id_card_no: updates.idCard || liveUser.id_card_no,
        });
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin thành viên thành công.',
      members: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi khi cập nhật thông tin thành viên.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { updateUserStore } from '@/lib/userStore';

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

export async function POST(req: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }
    const body = await req.json();
    const { 
      firstname, 
      lastname, 
      fullname,
      intro,
      phone, 
      email,
      gender,
      website,
      dob, 
      pob, 
      id_number, 
      id_date, 
      id_place, 
      province, 
      license_plate,
    } = body;

    let computedLastname = lastname || '';
    let computedFirstname = firstname || '';
    if (fullname && (!firstname || !lastname)) {
      const parts = fullname.trim().split(' ');
      computedFirstname = parts.slice(-1)[0] || '';
      computedLastname = parts.slice(0, -1).join(' ') || '';
    }

    const resolvedFullname = fullname || `${computedLastname} ${computedFirstname}`.trim();
    const extractedId = session.profile.id;
    const userIdentifier = extractedId || body.username || email || phone || 'user-owner-1';

    const updatedUser = updateUserStore(userIdentifier, {
      firstname: computedFirstname,
      lastname: computedLastname,
      fullname: resolvedFullname,
      full_name: resolvedFullname,
      intro: intro,
      phone: phone,
      email: email,
      gender: gender !== undefined ? (Number(gender) as 0 | 1) : 1,
      website: website,
      dob: formatToDateInput(dob),
      pob: pob || '',
      id_number: id_number,
      id_card_no: id_number,
      id_date: formatToDateInput(id_date),
      id_place: id_place,
      province: province,
      license_plate: license_plate,
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin thành viên thành công',
      user: updatedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi cập nhật thông tin người dùng.' },
      { status: 500 }
    );
  }
}

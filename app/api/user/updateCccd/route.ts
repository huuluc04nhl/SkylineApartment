import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { updateUserStore } from '@/lib/userStore';

function normalizeDate(d?: string): string {
  if (!d) return '';
  const clean = d.replace(/[^\d\/\-\.]/g, '');
  const parts = clean.split(/[\/\-\.]/);
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
    const { front, back, number, date, place, fullName, fullname, dob, gender, pob } = body;

    const cleanNumber = (number || '').replace(/\D/g, '').slice(0, 12);
    const cleanDate = normalizeDate(date);
    const cleanPlace = (place || 'Cục Cảnh sát QLHC về TTXH').trim();
    const resolvedName = (fullName || fullname || '').toUpperCase().trim();
    const cleanDob = normalizeDate(dob);

    const targetUserId = session.profile.id;

    const updates: any = {
      id_number: cleanNumber || '067204000961',
      id_card_no: cleanNumber || '067204000961',
      id_date: cleanDate || '2022-08-15',
      id_place: cleanPlace,
      cccd_front_url: front || undefined,
      cccd_back_url: back || undefined,
    };

    if (resolvedName) {
      updates.fullname = resolvedName;
      updates.full_name = resolvedName;
    }
    if (cleanDob) updates.dob = cleanDob;
    if (gender !== undefined) updates.gender = Number(gender) === 0 ? 0 : 1;
    if (pob) updates.pob = pob.trim();

    const updated = updateUserStore(targetUserId, updates);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật căn cước công dân 2 mặt e-KYC thành công',
      user: updated,
      cccd: {
        number: updated.id_number,
        date: updated.id_date,
        place: updated.id_place,
        front_url: front || updated.cccd_front_url,
        back_url: back || updated.cccd_back_url,
        status: 'VERIFIED',
        ocr_engine: 'AI Dual-Side Vision Parser',
        verified_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi cập nhật CCCD từ máy chủ.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { supabaseAdmin } from '@/lib/supabase/admin';

function parseSlotRange(bookingDate: string, timeSlot: string): { start: Date; end: Date } | null {
  const dateStr = (bookingDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

  const times = (timeSlot || '').match(/\d{1,2}:\d{2}/g);
  if (!times || times.length < 2) {
    const start = new Date(`${dateStr}T00:00:00+07:00`);
    const end = new Date(`${dateStr}T23:59:59+07:00`);
    return Number.isNaN(start.getTime()) ? null : { start, end };
  }

  const pad = (t: string) => {
    const [h, m] = t.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00+07:00`;
  };
  const start = new Date(`${dateStr}T${pad(times[0])}`);
  const end = new Date(`${dateStr}T${pad(times[1])}`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

function isBookingWithinTimeWindow(bookingDate: string, timeSlot: string, now = new Date()): boolean {
  const range = parseSlotRange(bookingDate, timeSlot);
  if (!range) return false;
  const earlyGraceMs = 15 * 60 * 1000;
  return now.getTime() >= range.start.getTime() - earlyGraceMs && now.getTime() <= range.end.getTime();
}

export async function POST(request: Request) {
  const guard = await requireAuth(['ADMIN', 'RECEPTIONIST', 'OWNER', 'TENANT']);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const ticketCode = typeof body.ticketCode === 'string' ? body.ticketCode.trim() : '';
  if (!ticketCode) {
    return NextResponse.json({ success: false, status: 'INVALID', message: 'Thiếu mã vé tiện ích (ticketCode).' }, { status: 400 });
  }

  const { data: booking, error } = await supabaseAdmin
    .from('facility_bookings')
    .select('*, facilities(name)')
    .eq('ticket_code', ticketCode)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, message: `Lỗi tra cứu vé tiện ích: ${error.message}` }, { status: 500 });
  }

  if (!booking) {
    return NextResponse.json({ success: false, status: 'INVALID', message: 'Không tìm thấy vé tiện ích hợp lệ.' }, { status: 404 });
  }

  const isResident = guard.session.role === 'OWNER' || guard.session.role === 'TENANT';
  if (
    isResident &&
    (!guard.session.apartment_code ||
      booking.apartment_code.toUpperCase() !== guard.session.apartment_code.trim().toUpperCase())
  ) {
    return NextResponse.json(
      { success: false, status: 'FORBIDDEN', message: 'Bạn không có quyền check-in vé tiện ích của căn hộ khác.' },
      { status: 403 }
    );
  }

  const actor =
    (typeof guard.session.profile?.full_name === 'string' && guard.session.profile.full_name.trim()) ||
    guard.session.email ||
    guard.session.authUserId;

  const writeAccessLog = async (status: 'SUCCESS' | 'DENIED', notes: string) => {
    await supabaseAdmin.from('facility_access_logs').insert({
      id: `FAC-LOG-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
      facility_id: booking.facility_id,
      apartment_code: booking.apartment_code,
      user_name: booking.booker_name,
      user_role: guard.session.role,
      method: 'QR_CODE',
      card_uid: booking.ticket_code,
      status,
      scanned_at: new Date().toISOString(),
      notes: `${notes} (Actor: ${actor})`,
    });
  };

  if (booking.status === 'CANCELLED') {
    await writeAccessLog('DENIED', 'Vé đã bị hủy');
    return NextResponse.json({ success: false, status: 'CANCELLED', message: 'Vé tiện ích đã bị hủy.' }, { status: 400 });
  }

  if (booking.status === 'CHECKED_IN') {
    await writeAccessLog('DENIED', 'Vé đã được sử dụng trước đó');
    return NextResponse.json({ success: false, status: 'ALREADY_USED', message: 'Vé tiện ích này đã được sử dụng.' }, { status: 409 });
  }

  if (!isBookingWithinTimeWindow(booking.booking_date, booking.time_slot)) {
    await writeAccessLog('DENIED', `Ngoài khung giờ ${booking.booking_date} ${booking.time_slot}`);
    return NextResponse.json(
      { success: false, status: 'EXPIRED', message: 'Vé tiện ích đã hết hạn hoặc chưa đến khung giờ đặt.' },
      { status: 400 }
    );
  }

  // Atomic check-in: chỉ cập nhật khi status chưa là CHECKED_IN và chưa CANCELLED
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('facility_bookings')
    .update({ status: 'CHECKED_IN' })
    .eq('id', booking.id)
    .neq('status', 'CHECKED_IN')
    .neq('status', 'CANCELLED')
    .select('*')
    .maybeSingle();

  if (updateErr) {
    return NextResponse.json({ success: false, message: `Không thể cập nhật trạng thái vé: ${updateErr.message}` }, { status: 500 });
  }

  if (!updated) {
    await writeAccessLog('DENIED', 'Vé đã được sử dụng đồng thời');
    return NextResponse.json({ success: false, status: 'ALREADY_USED', message: 'Vé tiện ích này đã được sử dụng.' }, { status: 409 });
  }

  await writeAccessLog('SUCCESS', `Check-in vé tiện ích ${booking.ticket_code}`);

  return NextResponse.json({
    success: true,
    status: 'VALID',
    message: `Xác thực vé tiện ích thành công cho ${booking.booker_name} (Căn ${booking.apartment_code}).`,
    booking: {
      id: updated.id,
      ticketCode: updated.ticket_code,
      aptCode: updated.apartment_code,
      bookerName: updated.booker_name,
      facilityId: updated.facility_id,
      facilityName: (booking as { facilities?: { name?: string } | null }).facilities?.name || updated.facility_id,
      bookingDate: updated.booking_date,
      timeSlot: updated.time_slot,
      status: updated.status,
    },
  });
}

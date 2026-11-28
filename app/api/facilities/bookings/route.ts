import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { generateFacilityTicketCode } from '@/lib/facilityStore';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const requestedApt = searchParams.get('aptCode');
    const effectiveApt =
      guard.session.role === 'ADMIN'
        ? requestedApt
        : guard.session.apartment_code || '__NONE__';

    let query = guard.supabase
      .from('facility_bookings')
      .select('*, facilities(name)')
      .order('created_at', { ascending: false });

    if (effectiveApt) {
      query = query.ilike('apartment_code', effectiveApt.trim());
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase facility_bookings select error: ${(error instanceof Error ? error.message : String(error))}`);

    const bookings = (data || []).map((row: any) => ({
      id: row.id,
      aptCode: row.apartment_code,
      facilityId: row.facility_id,
      facilityName: row.facilities?.name || row.facility_id,
      bookingDate: row.booking_date,
      timeSlot: row.time_slot,
      bookerName: row.booker_name,
      guestCount: row.guest_count ?? 1,
      notes: row.notes ?? undefined,
      ticketCode: row.ticket_code,
      pricing: row.pricing || '',
      durationHours: row.duration_hours ?? 1,
      depositAmount: row.deposit_amount ?? 0,
      paymentMethod: row.payment_method ?? undefined,
      status: row.status || 'CONFIRMED',
      createdAt: row.created_at || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, bookings });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    if (!body.id || !body.facilityId) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin đặt tiện ích.' }, { status: 400 });
    }

    const aptCode = (
      guard.session.role === 'ADMIN'
        ? body.aptCode
        : guard.session.apartment_code
    )?.trim();
    if (!aptCode) {
      return NextResponse.json({ success: false, message: 'Thiếu mã căn hộ hợp lệ.' }, { status: 400 });
    }

    let ticketCode =
      typeof body.ticketCode === 'string' && /^FAC-[A-Z0-9-]+-[A-Z2-7]{8}$/i.test(body.ticketCode.trim())
        ? body.ticketCode.trim().toUpperCase()
        : generateFacilityTicketCode(aptCode);

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await guard.supabase
        .from('facility_bookings')
        .upsert({
          id: body.id,
          apartment_code: aptCode,
          facility_id: body.facilityId,
          booker_id: guard.session.authUserId,
          booker_name: guard.session.profile.fullname || 'Cư Dân Skyline',
          ticket_code: ticketCode,
          booking_date: body.bookingDate || new Date().toISOString().slice(0, 10),
          time_slot: body.timeSlot || '',
          guest_count: body.guestCount ?? 1,
          duration_hours: body.durationHours ?? 1,
          deposit_amount: body.depositAmount ?? 0,
          pricing: body.pricing || '',
          payment_method: body.paymentMethod || null,
          status: body.status || 'CONFIRMED',
          notes: body.notes || null,
        })
        .select('*')
        .single();

      if (!error) {
        return NextResponse.json({
          success: true,
          booking: { ...data, ticketCode: data.ticket_code },
        });
      }

      const isUniqueViolation =
        (error as { code?: string }).code === '23505' ||
        /duplicate key|unique constraint/i.test((error instanceof Error ? error.message : String(error)) || '');
      if (!isUniqueViolation || attempt === 4) {
        throw new Error(`Supabase facility_bookings upsert error: ${(error instanceof Error ? error.message : String(error))}`);
      }
      ticketCode = generateFacilityTicketCode(aptCode);
    }

    return NextResponse.json({ success: false, message: 'Không thể cấp mã vé tiện ích duy nhất.' }, { status: 500 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    if (!body.id || !body.status) {
      return NextResponse.json({ success: false, message: 'Thiếu id hoặc status.' }, { status: 400 });
    }

    const { data, error } = await guard.supabase
      .from('facility_bookings')
      .update({
        status: body.status,
        notes: body.notes ?? undefined,
      })
      .eq('id', body.id)
      .select('*')
      .maybeSingle();

    if (error) throw new Error(`Supabase facility_bookings update error: ${(error instanceof Error ? error.message : String(error))}`);
    if (!data) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy lượt đặt tiện ích.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, booking: data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

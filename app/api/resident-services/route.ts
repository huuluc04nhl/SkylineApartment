import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';

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
      .from('resident_service_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (effectiveApt) {
      query = query.ilike('apt_code', effectiveApt.trim());
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase resident_service_bookings select error: ${error.message}`);

    const bookings = (data || []).map((r) => ({
      id: r.id,
      bookingCode: r.booking_code,
      aptCode: r.apt_code,
      serviceId: r.service_id,
      serviceName: r.service_name,
      category: r.category,
      residentName: r.resident_name,
      residentPhone: r.resident_phone,
      scheduledDate: r.scheduled_time.split(' ')[0] || '',
      scheduledTimeSlot: r.scheduled_time,
      notes: r.notes ?? undefined,
      totalPrice: r.total_price,
      status: r.status,
      assignedStaff: r.assigned_staff ?? undefined,
      staffPhone: r.staff_phone ?? undefined,
      createdAt: r.created_at || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    if (!body.id || !body.bookingCode || !body.serviceId) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin đặt dịch vụ.' }, { status: 400 });
    }

    const aptCode = (
      guard.session.role === 'ADMIN'
        ? body.aptCode
        : guard.session.apartment_code
    )?.trim();
    if (!aptCode) {
      return NextResponse.json({ success: false, message: 'Thiếu mã căn hộ hợp lệ.' }, { status: 400 });
    }

    const { data, error } = await guard.supabase
      .from('resident_service_bookings')
      .upsert({
        id: body.id,
        booking_code: body.bookingCode,
        apt_code: aptCode,
        service_id: body.serviceId,
        service_name: body.serviceName,
        category: body.category,
        resident_name: guard.session.profile.fullname || 'Cư Dân Skyline',
        resident_phone: guard.session.profile.phone || '',
        scheduled_time: `${body.scheduledDate || ''} ${body.scheduledTimeSlot || ''}`.trim(),
        notes: body.notes || null,
        total_price: Number(body.totalPrice || 0),
        status: body.status || 'CONFIRMED',
        assigned_staff: body.assignedStaff || null,
        staff_phone: body.staffPhone || null,
      })
      .select('*')
      .single();

    if (error) throw new Error(`Supabase resident_service_bookings upsert error: ${error.message}`);
    return NextResponse.json({ success: true, booking: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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
      .from('resident_service_bookings')
      .update({ status: body.status })
      .eq('id', body.id)
      .select('*')
      .maybeSingle();

    if (error) throw new Error(`Supabase resident_service_bookings update error: ${error.message}`);
    if (!data) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn dịch vụ.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, booking: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

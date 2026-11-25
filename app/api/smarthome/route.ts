import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const requestedApt = searchParams.get('aptCode');
    const aptCode = (
      guard.session.role === 'ADMIN'
        ? requestedApt || ''
        : guard.session.apartment_code || '__NONE__'
    ).trim();
    if (!aptCode) {
      return NextResponse.json({ success: false, message: 'Vui lòng cung cấp aptCode.' }, { status: 400 });
    }

    const [devicesRes, rulesRes, pinsRes, logsRes] = await Promise.all([
      guard.supabase.from('smart_devices').select('*').ilike('apartment_code', aptCode),
      guard.supabase.from('smart_automation_rules').select('*').ilike('apartment_code', aptCode),
      guard.supabase.from('smart_guest_pins').select('*').ilike('apartment_code', aptCode),
      guard.supabase
        .from('smart_door_access_logs')
        .select('*')
        .ilike('apartment_code', aptCode)
        .order('timestamp', { ascending: false })
        .limit(30),
    ]);

    if (devicesRes.error) throw new Error(devicesRes.error.message);
    if (rulesRes.error) throw new Error(rulesRes.error.message);
    if (pinsRes.error) throw new Error(pinsRes.error.message);
    if (logsRes.error) throw new Error(logsRes.error.message);

    return NextResponse.json({
      success: true,
      devices: devicesRes.data || [],
      rules: rulesRes.data || [],
      guestPins: pinsRes.data || [],
      doorAccessLogs: logsRes.data || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const aptCode = (
      guard.session.role === 'ADMIN'
        ? body.apartmentCode
        : guard.session.apartment_code
    )?.trim();
    if (!aptCode) {
      return NextResponse.json({ success: false, message: 'Thiếu mã căn hộ hợp lệ.' }, { status: 400 });
    }

    if (Array.isArray(body.devices) && body.devices.length > 0) {
      const { error } = await guard.supabase.from('smart_devices').upsert(
        body.devices.map((d: any) => ({
          id: d.id,
          apartment_code: aptCode,
          name: d.name,
          device_type: d.device_type,
          status: String(d.status),
          set_value: Number(d.set_value ?? 0),
          last_active: new Date().toISOString(),
        }))
      );
      if (error) throw new Error(error.message);
    }

    if (body.guestPin) {
      const p = body.guestPin;
      const { error } = await guard.supabase.from('smart_guest_pins').upsert({
        id: p.id,
        apartment_code: aptCode,
        pin_code: p.pin,
        label: p.label,
        status: p.status || 'ACTIVE',
        max_uses: p.maxUses ?? 5,
        used_count: p.usedCount ?? 0,
        expires_at: p.expiresAt,
      });
      if (error) throw new Error(error.message);
    }

    if (body.doorLog) {
      const l = body.doorLog;
      const { error } = await guard.supabase.from('smart_door_access_logs').insert({
        id: l.id,
        apartment_code: aptCode,
        user_name: l.userName,
        role: l.role,
        method: l.method,
        status: l.status,
        detail: l.detail,
        timestamp: l.timestamp || new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

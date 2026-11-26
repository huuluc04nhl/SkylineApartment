import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const guard = await requireAuth(['ADMIN', 'TECHNICIAN', 'RECEPTIONIST']);
    if (!guard.ok) return guard.response;

    const { data, error } = await supabaseAdmin
      .from('security_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, alerts: data ?? [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Lỗi tải cảnh báo an ninh.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'TECHNICIAN']);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu id cảnh báo.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('security_alerts')
      .update({ status: String(body.status || 'Resolved') })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy cảnh báo.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, alert: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Lỗi cập nhật cảnh báo.' }, { status: 500 });
  }
}

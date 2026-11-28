import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    const { data, error } = await supabaseAdmin
      .from('building_devices')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw new Error((error instanceof Error ? error.message : String(error)));

    return NextResponse.json({ success: true, devices: data ?? [] });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi tải thiết bị.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'TECHNICIAN']);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ success: false, message: 'Tên thiết bị không được để trống.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('building_devices')
      .insert({
        id: body.id || `dev-${Date.now()}`,
        name,
        category: String(body.category || 'Khác'),
        location: String(body.location || 'Tòa BS-07'),
        health_score: Number(body.health_score ?? 90),
        predict_date: body.predict_date || null,
        last_maintenance: body.last_maintenance || new Date().toISOString().split('T')[0],
        status: String(body.status || 'Hoạt động tốt'),
      })
      .select('*')
      .single();
    if (error) throw new Error((error instanceof Error ? error.message : String(error)));

    return NextResponse.json({ success: true, device: data }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi thêm thiết bị.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'TECHNICIAN']);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu id thiết bị.' }, { status: 400 });
    }

    const patch: Database['public']['Tables']['building_devices']['Update'] = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.category !== undefined) patch.category = body.category;
    if (body.location !== undefined) patch.location = body.location;
    if (body.health_score !== undefined) patch.health_score = Number(body.health_score);
    if (body.predict_date !== undefined) patch.predict_date = body.predict_date;
    if (body.last_maintenance !== undefined) patch.last_maintenance = body.last_maintenance;
    if (body.status !== undefined) patch.status = body.status;

    const { data, error } = await supabaseAdmin
      .from('building_devices')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw new Error((error instanceof Error ? error.message : String(error)));
    if (!data) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy thiết bị.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, device: data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi cập nhật thiết bị.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'TECHNICIAN']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const id = (searchParams.get('id') || '').trim();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu id thiết bị.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('building_devices').delete().eq('id', id);
    if (error) throw new Error((error instanceof Error ? error.message : String(error)));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi xóa thiết bị.' }, { status: 500 });
  }
}

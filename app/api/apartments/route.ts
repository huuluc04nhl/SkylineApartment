import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import {
  listApartmentsDb,
  getApartmentByCodeDb,
  createApartmentDb,
  updateApartmentDb,
  deleteApartmentDb,
} from '@/lib/server/apartmentDb';

const BLOCK_ID_MAP: Record<string, number> = {
  'BS-07': 880,
  'BS-08': 883,
  'BS-09': 886,
  'BS-10': 889,
};

export async function GET(req: Request) {
  try {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const block = searchParams.get('block') || undefined;
    const apartments = await listApartmentsDb(block);
    return NextResponse.json({ success: true, apartments });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi tải danh sách căn hộ.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN']);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const aptCode = String(body.apt_code || body.code || '').trim().toUpperCase();
    const towerCode = String(body.tower_code || body.tower || 'BS-07').trim().toUpperCase();
    const floorNumber = Number(body.floor_number ?? body.floor ?? 0);
    const aptType = String(body.apt_type || body.type || '1PN').trim();

    if (!aptCode || !floorNumber) {
      return NextResponse.json(
        { success: false, message: 'Thiếu mã căn hộ (code) hoặc số tầng (floor).' },
        { status: 400 }
      );
    }

    const existing = await getApartmentByCodeDb(aptCode);
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Căn hộ ${aptCode} đã tồn tại.` },
        { status: 409 }
      );
    }

    const blockId = Number(body.block_id) || BLOCK_ID_MAP[towerCode] || 880;
    const clearArea = Number(body.clear_area ?? body.area ?? 45);
    const priceBillion = Number(body.price_billion ?? body.priceBillion ?? 3.0);

    const apartment = await createApartmentDb({
      id: body.id || `apt-${towerCode.toLowerCase()}-${aptCode.toLowerCase()}`,
      apt_code: aptCode,
      block_id: blockId,
      tower_code: towerCode,
      floor_number: floorNumber,
      wing: String(body.wing || 'NORTH').toUpperCase(),
      apt_type: aptType,
      type_label: String(body.type_label || body.typeLabel || aptType),
      wall_area: Number(body.wall_area ?? body.wallArea ?? clearArea),
      clear_area: clearArea,
      bedrooms: Number(body.bedrooms ?? 1),
      bathrooms: Number(body.bathrooms ?? 1),
      balcony_direction: body.balcony_direction || body.direction || 'Đông Nam',
      main_door_direction: body.main_door_direction || body.mainDoorDirection || 'Tây Bắc',
      price_billion: priceBillion,
      price_vnd: Number(body.price_vnd ?? body.priceVnd ?? priceBillion * 1_000_000_000),
      status: String(body.status || 'VACANT').toUpperCase(),
      owner_id: body.owner_id ?? null,
      handover_date: body.handover_date || body.handoverDate || null,
      handover_protocol: body.handover_protocol || null,
      description: body.description || null,
      vehicles: Array.isArray(body.vehicles) ? body.vehicles : [],
    });

    return NextResponse.json({ success: true, apartment }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi tạo căn hộ mới.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN']);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const aptCode = String(body.apt_code || body.code || '').trim().toUpperCase();
    if (!aptCode) {
      return NextResponse.json(
        { success: false, message: 'Thiếu mã căn hộ cần cập nhật.' },
        { status: 400 }
      );
    }

    const patch: Record<string, unknown> = {};
    if (body.status !== undefined) patch.status = body.status;
    if (body.price_billion !== undefined || body.priceBillion !== undefined) {
      patch.price_billion = Number(body.price_billion ?? body.priceBillion);
    }
    if (body.price_vnd !== undefined || body.priceVnd !== undefined) {
      patch.price_vnd = Number(body.price_vnd ?? body.priceVnd);
    }
    if (body.clear_area !== undefined || body.area !== undefined) {
      patch.clear_area = Number(body.clear_area ?? body.area);
    }
    if (body.wall_area !== undefined || body.wallArea !== undefined) {
      patch.wall_area = Number(body.wall_area ?? body.wallArea);
    }
    if (body.description !== undefined) patch.description = body.description;
    if (body.handover_date !== undefined || body.handoverDate !== undefined) {
      patch.handover_date = body.handover_date ?? body.handoverDate;
    }
    if (body.handover_protocol !== undefined) patch.handover_protocol = body.handover_protocol;
    if (body.owner_id !== undefined) patch.owner_id = body.owner_id;
    if (Array.isArray(body.vehicles)) patch.vehicles = body.vehicles;

    const apartment = await updateApartmentDb(aptCode, patch);
    if (!apartment) {
      return NextResponse.json(
        { success: false, message: `Không tìm thấy căn hộ ${aptCode}.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, apartment });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi cập nhật căn hộ.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    let aptCode = (searchParams.get('code') || '').trim().toUpperCase();
    if (!aptCode) {
      const body = await req.json().catch(() => ({}));
      aptCode = String(body.apt_code || body.code || '').trim().toUpperCase();
    }

    if (!aptCode) {
      return NextResponse.json(
        { success: false, message: 'Thiếu mã căn hộ cần xóa.' },
        { status: 400 }
      );
    }

    const deleted = await deleteApartmentDb(aptCode);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: `Không tìm thấy căn hộ ${aptCode}.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi xóa căn hộ.' },
      { status: 500 }
    );
  }
}

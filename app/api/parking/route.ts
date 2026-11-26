import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import {
  listParkingSlotsDb,
  assignParkingSlotDb,
  releaseParkingSlotDb,
  ParkingConflictError,
} from '@/lib/server/parkingDb';

export async function GET(req: Request) {
  try {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const requestedApt = searchParams.get('apartment_code') || undefined;
    const isResident = guard.session.role === 'OWNER' || guard.session.role === 'TENANT';
    const aptFilter = isResident ? guard.session.apartment_code || '__NONE__' : requestedApt;

    const slots = await listParkingSlotsDb(aptFilter);
    return NextResponse.json({ success: true, slots });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi tải dữ liệu bãi đỗ xe.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN']);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const slotCode = String(body.slotCode || body.slot_code || '').trim().toUpperCase();
    const apartmentCode = String(body.apartmentCode || body.apartment_code || '').trim().toUpperCase();
    const licensePlate = String(body.licensePlate || body.assigned_license_plate || '').trim().toUpperCase();
    const rawType = String(body.vehicleType || body.vehicle_type || 'CAR').toUpperCase();
    const vehicleType: 'CAR' | 'MOTORCYCLE' = rawType === 'MOTORBIKE' || rawType === 'MOTORCYCLE' ? 'MOTORCYCLE' : 'CAR';
    const floorNumber = Number(body.floorNumber ?? body.floor_number ?? (vehicleType === 'CAR' ? -2 : -1));
    const monthlyFee = Number(body.monthlyFee ?? body.monthly_fee ?? (vehicleType === 'CAR' ? 1200000 : 120000));

    if (!slotCode || !apartmentCode || !licensePlate) {
      return NextResponse.json(
        { success: false, message: 'Thiếu mã vị trí đỗ (slotCode), mã căn hộ hoặc biển số xe.' },
        { status: 400 }
      );
    }

    const slot = await assignParkingSlotDb({
      slotCode,
      floorNumber,
      vehicleType,
      apartmentCode,
      licensePlate,
      rfidCardCode: body.rfidCardCode || body.rfid_card_code || null,
      monthlyFee,
      assignedUserId: body.assignedUserId || null,
    });

    return NextResponse.json({ success: true, slot }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ParkingConflictError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi gán vị trí đỗ xe.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const slotCode = searchParams.get('slotCode') || body.slotCode || body.slot_code || undefined;
    const apartmentCode = searchParams.get('apartmentCode') || body.apartmentCode || body.apartment_code || undefined;
    const licensePlate = searchParams.get('licensePlate') || body.licensePlate || body.assigned_license_plate || undefined;

    if (!slotCode && !(apartmentCode && licensePlate)) {
      return NextResponse.json(
        { success: false, message: 'Thiếu slotCode hoặc (apartmentCode + licensePlate).' },
        { status: 400 }
      );
    }

    const released = await releaseParkingSlotDb({ slotCode, apartmentCode, licensePlate });
    if (!released) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy vị trí đỗ xe tương ứng.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi thu hồi vị trí đỗ xe.' },
      { status: 500 }
    );
  }
}

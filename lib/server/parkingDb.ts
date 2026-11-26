import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';

type ParkingSlotRow = Database['public']['Tables']['parking_slots']['Row'];

export class ParkingConflictError extends Error {
  status = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ParkingConflictError';
  }
}

export async function listParkingSlotsDb(aptCode?: string): Promise<ParkingSlotRow[]> {
  let query = supabaseAdmin.from('parking_slots').select('*').order('slot_code', { ascending: true });
  if (aptCode) {
    query = query.ilike('apartment_code', aptCode.trim());
  }
  const { data, error } = await query;
  if (error) throw new Error(`Supabase parking_slots select error: ${error.message}`);
  return data ?? [];
}

export async function assignParkingSlotDb(params: {
  slotCode: string;
  floorNumber: number;
  vehicleType: 'CAR' | 'MOTORCYCLE';
  apartmentCode: string;
  licensePlate: string;
  rfidCardCode?: string | null;
  monthlyFee: number;
  assignedUserId?: string | null;
}): Promise<ParkingSlotRow> {
  const cleanSlot = params.slotCode.trim().toUpperCase();
  const cleanApt = params.apartmentCode.trim().toUpperCase();
  const cleanPlate = params.licensePlate.trim().toUpperCase();

  const { data: existing, error: checkErr } = await supabaseAdmin
    .from('parking_slots')
    .select('*')
    .ilike('slot_code', cleanSlot)
    .maybeSingle();
  if (checkErr) throw new Error(`Supabase parking_slots check error: ${checkErr.message}`);

  if (existing && existing.status === 'OCCUPIED' && existing.apartment_code && existing.apartment_code.toUpperCase() !== cleanApt) {
    throw new ParkingConflictError(`Vị trí đỗ ${cleanSlot} đã được gán cho căn hộ ${existing.apartment_code}.`);
  }

  const { data, error } = await supabaseAdmin
    .from('parking_slots')
    .upsert(
      {
        id: existing?.id || `slot-${cleanSlot.toLowerCase()}`,
        slot_code: cleanSlot,
        floor_number: params.floorNumber,
        vehicle_type: params.vehicleType,
        apartment_code: cleanApt,
        assigned_user_id: params.assignedUserId ?? null,
        assigned_license_plate: cleanPlate,
        rfid_card_code: params.rfidCardCode || existing?.rfid_card_code || `RFID-${cleanSlot}`,
        status: 'OCCUPIED',
        monthly_fee: params.monthlyFee,
      },
      { onConflict: 'slot_code' }
    )
    .select('*')
    .single();

  if (error) throw new Error(`Supabase parking_slots upsert error: ${error.message}`);
  return data;
}

export async function releaseParkingSlotDb(params: {
  slotCode?: string;
  apartmentCode?: string;
  licensePlate?: string;
}): Promise<boolean> {
  let query = supabaseAdmin.from('parking_slots').update({
    status: 'VACANT',
    apartment_code: null,
    assigned_user_id: null,
    assigned_license_plate: null,
  });

  if (params.slotCode) {
    query = query.ilike('slot_code', params.slotCode.trim());
  } else if (params.apartmentCode && params.licensePlate) {
    query = query
      .ilike('apartment_code', params.apartmentCode.trim())
      .ilike('assigned_license_plate', params.licensePlate.trim());
  } else {
    return false;
  }

  const { data, error } = await query.select('id');
  if (error) throw new Error(`Supabase parking_slots release error: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

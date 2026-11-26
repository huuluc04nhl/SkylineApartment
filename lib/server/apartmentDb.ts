import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';

type ApartmentRow = Database['public']['Tables']['apartments']['Row'];
type ApartmentInsert = Database['public']['Tables']['apartments']['Insert'];
type ApartmentUpdate = Database['public']['Tables']['apartments']['Update'];

export async function listApartmentsDb(blockCode?: string): Promise<ApartmentRow[]> {
  let query = supabaseAdmin.from('apartments').select('*').order('apt_code', { ascending: true });
  if (blockCode) {
    query = query.ilike('tower_code', blockCode.trim());
  }
  const { data, error } = await query;
  if (error) throw new Error(`Supabase apartments select error: ${error.message}`);
  return data ?? [];
}

export async function getApartmentByCodeDb(aptCode: string): Promise<ApartmentRow | null> {
  const { data, error } = await supabaseAdmin
    .from('apartments')
    .select('*')
    .ilike('apt_code', aptCode.trim())
    .maybeSingle();
  if (error) throw new Error(`Supabase apartment select error: ${error.message}`);
  return data ?? null;
}

export async function createApartmentDb(input: ApartmentInsert): Promise<ApartmentRow> {
  const { data, error } = await supabaseAdmin
    .from('apartments')
    .insert(input)
    .select('*')
    .single();
  if (error) throw new Error(`Supabase apartments insert error: ${error.message}`);
  return data;
}

export async function updateApartmentDb(aptCode: string, patch: ApartmentUpdate): Promise<ApartmentRow | null> {
  const { data, error } = await supabaseAdmin
    .from('apartments')
    .update(patch)
    .ilike('apt_code', aptCode.trim())
    .select('*')
    .maybeSingle();
  if (error) throw new Error(`Supabase apartments update error: ${error.message}`);
  return data ?? null;
}

export async function deleteApartmentDb(aptCode: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('apartments')
    .delete()
    .ilike('apt_code', aptCode.trim())
    .select('id');
  if (error) throw new Error(`Supabase apartments delete error: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

export async function assignApartmentResidentDb(params: {
  aptCode: string;
  ownerId: string;
  handoverDate: string;
  protocolCode: string;
}): Promise<ApartmentRow | null> {
  const { data, error } = await supabaseAdmin
    .from('apartments')
    .update({
      status: 'OCCUPIED',
      owner_id: params.ownerId,
      handover_date: params.handoverDate,
      handover_protocol: params.protocolCode,
    })
    .ilike('apt_code', params.aptCode.trim())
    .select('*')
    .maybeSingle();

  if (error) throw new Error(`Supabase apartments handover update error: ${error.message}`);
  return data ?? null;
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { askGeminiConcierge, generateSmartProjectFallback, extractAiSuggestions, extractAiAction, ConciergeContext } from '@/lib/geminiClient';
import { findUserByIdentifierDb, listApartmentMembersDb } from '@/lib/server/userDb';
import { listBillsWithDetailsDb } from '@/lib/server/billingDb';
import { listTicketsDb } from '@/lib/server/ticketDb';
import { listVisitorPassesDb } from '@/lib/server/visitorDb';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let userMessage = '';
  let fallbackContext: ConciergeContext = {
    aptCode: '',
    userName: 'Cư dân Skyline',
    userRole: 'OWNER',
  };

  try {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    const allowed = await checkRateLimit(`ai:${guard.session.authUserId}`, 20, 60);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Bạn gửi quá nhiều yêu cầu AI. Vui lòng thử lại sau 1 phút.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      message,
      history,
      bookings,
      visitors,
      tickets,
      bills,
      members,
      language,
    } = body;

    userMessage = message || '';

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tin nhắn không được để trống.' },
        { status: 400 }
      );
    }

    const sessionUser = guard.session.profile;
    const targetApt = (guard.session.apartment_code || '').trim();
    const residentPhone = sessionUser.phone || '';
    const dynamicUser = targetApt ? await findUserByIdentifierDb(targetApt) : undefined;

    // Always resolve authoritative data from Supabase for the session's apartment
    const [actualBills, actualTickets, actualVisitors, actualMembers, bookingsRes] = await Promise.all([
      targetApt ? listBillsWithDetailsDb(targetApt) : Promise.resolve([]),
      targetApt ? listTicketsDb(targetApt, residentPhone) : Promise.resolve([]),
      targetApt ? listVisitorPassesDb({ apartmentCode: targetApt }) : Promise.resolve([]),
      targetApt ? listApartmentMembersDb(targetApt) : Promise.resolve([]),
      targetApt
        ? supabaseAdmin.from('facility_bookings').select('*').ilike('apartment_code', targetApt).order('created_at', { ascending: false }).limit(10)
        : Promise.resolve({ data: [] }),
    ]);
    const actualBookings: NonNullable<ConciergeContext['bookings']> = (bookingsRes?.data || []).map((b) => ({
      id: b.id,
      facilityId: b.facility_id,
      facilityName: b.facility_id,
      bookingDate: b.booking_date,
      timeSlot: b.time_slot,
      ticketCode: b.ticket_code,
      status: (b.status as 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED') || 'CONFIRMED',
    }));

    const context: ConciergeContext = {
      aptCode: targetApt,
      userName: sessionUser.fullname || sessionUser.full_name || dynamicUser?.fullname || dynamicUser?.full_name || 'Cư dân Skyline',
      userRole: guard.session.role,
      phone: residentPhone || dynamicUser?.phone || '',
      email: guard.session.email || sessionUser.email || dynamicUser?.email || '',
      idCard: dynamicUser?.id_number || dynamicUser?.id_card_no || '',
      licensePlate: dynamicUser?.license_plate || '',
      bookings: actualBookings,
      tickets: actualTickets,
      visitors: actualVisitors,
      bills: actualBills,
      members: actualMembers,
      language: language === 'en' ? 'en' : 'vi',
    };

    fallbackContext = context;

    const rawReply = await askGeminiConcierge(message, history || [], context);
    const { cleanText: textAfterAction, action } = extractAiAction(rawReply);
    const { cleanText, suggestions } = extractAiSuggestions(textAfterAction);

    return NextResponse.json({
      success: true,
      reply: cleanText,
      suggestions,
      action,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Handled error in /api/ai/concierge:', error);
    // Never fail the user: return instant smart project data answer using resident's prompt!
    const fallbackAnswer = generateSmartProjectFallback(userMessage || '', fallbackContext);
    const { cleanText: textAfterAction, action } = extractAiAction(fallbackAnswer);
    const { cleanText, suggestions } = extractAiSuggestions(textAfterAction);
    return NextResponse.json({
      success: true,
      reply: cleanText,
      suggestions,
      action,
      timestamp: new Date().toISOString(),
      isFallback: true,
    });
  }
}


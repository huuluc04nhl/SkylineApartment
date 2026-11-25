import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { askGeminiConcierge, generateSmartProjectFallback, extractAiSuggestions, extractAiAction, ConciergeContext } from '@/lib/geminiClient';
import { findUserByIdentifierDb, listApartmentMembersDb } from '@/lib/server/userDb';
import { getBills } from '@/lib/billingStore';
import { listTicketsDb } from '@/lib/server/ticketDb';
import { getAllVisitorPasses } from '@/lib/visitorStore';
import { getFacilityBookings } from '@/lib/facilityStore';

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

    // Dynamic resolution of actual project data if not supplied by client
    const actualBookings = Array.isArray(bookings) ? bookings : getFacilityBookings(targetApt);
    const actualTickets = Array.isArray(tickets) && tickets.length > 0 ? tickets : await listTicketsDb(targetApt, residentPhone);

    const actualVisitors = Array.isArray(visitors) ? visitors : getAllVisitorPasses();
    const actualBills = Array.isArray(bills) && bills.length > 0 ? bills : getBills(targetApt, sessionUser.fullname || sessionUser.full_name || '');
    const actualMembers = Array.isArray(members)
      ? members
      : targetApt
        ? await listApartmentMembersDb(targetApt)
        : [];

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
  } catch (error: any) {
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


import { getInitialsAvatar } from '@/lib/avatarHelper';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { registerOwnerUserDb } from '@/lib/server/userDb';
import { assignApartmentResidentDb } from '@/lib/server/apartmentDb';
import { ApartmentHandoverProtocol } from '@/lib/apartmentStore';

/**
 * POST /api/user/handover
 * API Cáº¥p tÃ i khoáº£n CÆ° DÃ¢n & BÃ n Giao CÄƒn Há»™ ChÃ­nh Thá»©c (Chá»‰ ADMIN)
 */
export async function POST(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN']);
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const { 
      apartmentCode, 
      fullName, 
      phone, 
      email, 
      idCard, 
      dob, 
      pob, 
      avatarUrl, 
      handoverProtocol 
    } = body;

    // 1. Kiá»ƒm tra tÃ­nh há»£p lá»‡ cá»§a dá»¯ liá»‡u Ä‘áº§u vÃ o
    if (!apartmentCode || typeof apartmentCode !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Vui lÃ²ng cung cáº¥p mÃ£ cÄƒn há»™ cáº§n bÃ n giao.' },
        { status: 400 }
      );
    }

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { success: false, message: 'Vui lÃ²ng cung cáº¥p há» tÃªn chá»§ há»™ / ngÆ°á»i tiáº¿p nháº­n.' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json(
        { success: false, message: 'Vui lÃ²ng cung cáº¥p sá»‘ Ä‘iá»‡n thoáº¡i lÃ m tÃ i khoáº£n Ä‘Äƒng nháº­p.' },
        { status: 400 }
      );
    }

    if (!idCard || typeof idCard !== 'string' || idCard.trim().length < 9) {
      return NextResponse.json(
        { success: false, message: 'Vui lÃ²ng cung cáº¥p sá»‘ tháº» CCCD há»£p lá»‡ (9 Ä‘áº¿n 12 sá»‘).' },
        { status: 400 }
      );
    }

    const cleanCode = apartmentCode.trim().toUpperCase();
    const cleanPhone = phone.trim();
    const cleanName = fullName.trim();
    const cleanIdCard = idCard.trim();
    const cleanEmail = email?.trim() || `${cleanPhone}@skyline.residence.vn`;
    const cleanAvatar = avatarUrl || getInitialsAvatar('Skyline Resident');

    // 2. Cáº¥p tÃ i khoáº£n CÆ° DÃ¢n chÃ­nh thá»©c trÃªn Supabase Auth + profiles + users
    const provisionedUser = await registerOwnerUserDb({
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      cccd: cleanIdCard,
      apartmentCode: cleanCode,
      dob: dob?.trim() || '1992-06-15',
      pob: pob?.trim() || 'TP. Há»“ ChÃ­ Minh',
      avatarUrl: cleanAvatar
    });

    // 3. Chuáº©n hÃ³a BiÃªn báº£n bÃ n giao ká»¹ thuáº­t (Handover Protocol)
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const protocolCode = handoverProtocol?.protocolCode || `BBBG-SKYLINE-${cleanCode}-${dateCode}`;

    const finalProtocol: ApartmentHandoverProtocol = {
      protocolCode,
      handoverDate: handoverProtocol?.handoverDate || todayStr,
      handoverOfficer: handoverProtocol?.handoverOfficer || 'VinHomes Manager',
      keysCount: Number(handoverProtocol?.keysCount) || 3,
      cardsCount: Number(handoverProtocol?.cardsCount) || 2,
      initialElectricMeter: Number(handoverProtocol?.initialElectricMeter) || 0,
      initialWaterMeter: Number(handoverProtocol?.initialWaterMeter) || 0,
      notes: handoverProtocol?.notes || 'ÄÃ£ nghiá»‡m thu ká»¹ thuáº­t bÃ n giao cÄƒn há»™, bÃ n giao chÃ¬a khÃ³a cÆ¡ vÃ  cáº¥p tháº» tá»« cÆ° dÃ¢n.'
    };

    // 4. Cáº­p nháº­t há»“ sÆ¡ cÄƒn há»™ trong Supabase sang tráº¡ng thÃ¡i OCCUPIED
    await assignApartmentResidentDb({
      aptCode: cleanCode,
      ownerId: provisionedUser.id,
      handoverDate: new Date().toISOString().slice(0, 10),
      protocolCode: finalProtocol.protocolCode,
    });

    return NextResponse.json({
      success: true,
      message: `ÄÃ£ cáº¥p tÃ i khoáº£n cÆ° dÃ¢n chÃ­nh thá»©c cho chá»§ há»™ ${cleanName} vÃ  bÃ n giao cÄƒn há»™ ${cleanCode} thÃ nh cÃ´ng.`,
      account: {
        id: provisionedUser.id,
        username: provisionedUser.username,
        fullName: provisionedUser.fullname || provisionedUser.full_name,
        phone: provisionedUser.phone,
        email: provisionedUser.email,
        idCard: provisionedUser.id_number || provisionedUser.id_card_no,
        apartmentCode: provisionedUser.apartment_code,
        role: 'OWNER',
        initialPassword: 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢ (ÄÆ°á»£c cáº¥p qua email/Ä‘áº·t láº¡i máº­t kháº©u)',
        provisionedAt: new Date().toISOString()
      },
      protocol: finalProtocol
    });
  } catch (error: any) {
    console.error('Handover provision API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Lá»—i mÃ¡y chá»§ khi xá»­ lÃ½ cáº¥p tÃ i khoáº£n bÃ n giao: ' + (error?.message || '') 
      },
      { status: 500 }
    );
  }
}

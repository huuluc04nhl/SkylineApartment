import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { signResidentCardToken } from '@/lib/server/cardToken';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT', 'TECHNICIAN', 'RECEPTIONIST']);
  if (!guard.ok) return guard.response;

  try {
    const signed = signResidentCardToken(
      {
        userId: guard.session.authUserId,
        apartmentCode: guard.session.apartment_code || '',
        role: guard.session.role,
      },
      60
    );

    return NextResponse.json({
      success: true,
      ...signed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Không thể tạo token thẻ cư dân.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

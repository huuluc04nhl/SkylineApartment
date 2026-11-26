import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import {
  listVotingTopicsDb,
  createVotingTopicDb,
  castVoteDb,
  toggleVotingTopicStatusDb,
  VoteConflictError,
  VoteValidationError,
} from '@/lib/server/communityVotingDb';

export async function GET() {
  try {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    const topics = await listVotingTopicsDb();
    return NextResponse.json({ success: true, topics });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi tải danh sách biểu quyết.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const isVoteAction = body.action === 'VOTE' || (Boolean(body.topicId && body.optionId) && !body.title);

    if (isVoteAction) {
      const guard = await requireAuth(['OWNER']);
      if (!guard.ok) return guard.response;

      const aptCode = (guard.session.apartment_code || '').trim().toUpperCase();
      if (!aptCode) {
        return NextResponse.json(
          { success: false, message: 'Tài khoản chủ hộ chưa được gán mã căn hộ.' },
          { status: 400 }
        );
      }

      const topicId = String(body.topicId || '').trim();
      const optionId = String(body.optionId || '').trim();
      if (!topicId || !optionId) {
        return NextResponse.json(
          { success: false, message: 'Thiếu topicId hoặc optionId.' },
          { status: 400 }
        );
      }

      const topic = await castVoteDb({
        topicId,
        userId: guard.session.profile.id,
        aptCode,
        voterName: guard.session.profile.fullname || guard.session.profile.full_name || 'Chủ hộ',
        optionId,
      });

      return NextResponse.json({
        success: true,
        message: `Lá phiếu biểu quyết của Căn ${aptCode} đã được ghi nhận.`,
        topic,
      });
    }

    // Create voting topic: ADMIN only
    const guard = await requireAuth(['ADMIN']);
    if (!guard.ok) return guard.response;

    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const legalType = String(body.legalType || body.legal_type || 'Quy Chế Chung Cư').trim();
    const deadline = String(body.deadline || '').trim();
    const options = Array.isArray(body.options)
      ? body.options.map((o: any) => (typeof o === 'string' ? o : String(o?.text || ''))).filter(Boolean)
      : [];

    if (!title || !description || !deadline || options.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp tiêu đề, mô tả, hạn chót và ít nhất 2 phương án.' },
        { status: 400 }
      );
    }

    const topic = await createVotingTopicDb({
      title,
      description,
      legalType,
      createdBy: guard.session.profile.fullname || 'Ban Quản Trị Tòa Nhà',
      deadline,
      isOwnerOnly: body.isOwnerOnly ?? body.is_owner_only ?? true,
      totalEligibleApartments: Number(body.totalEligibleApartments || 200),
      summaryReport: body.summaryReport || '',
      options,
    });

    return NextResponse.json({ success: true, topic }, { status: 201 });
  } catch (error: any) {
    if (error instanceof VoteConflictError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 409 });
    }
    if (error instanceof VoteValidationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi xử lý biểu quyết.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN']);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const topicId = String(body.topicId || body.id || '').trim();
    if (!topicId) {
      return NextResponse.json({ success: false, message: 'Thiếu topicId.' }, { status: 400 });
    }

    const topic = await toggleVotingTopicStatusDb(topicId);
    if (!topic) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy chủ đề biểu quyết.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, topic });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi cập nhật trạng thái biểu quyết.' },
      { status: 500 }
    );
  }
}

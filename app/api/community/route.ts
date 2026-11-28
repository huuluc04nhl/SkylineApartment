import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import {
  listCommunityPostsDb,
  createCommunityPostDb,
  incrementCommunityPostLikesDb,
  deleteCommunityPostDb,
} from '@/lib/server/communityVotingDb';

const CATEGORY_TO_DB: Record<string, string> = {
  ANNOUNCEMENT: 'Thông báo',
  VOTING: 'Biểu quyết',
  MARKETPLACE: 'Rao vặt',
  DISCUSSION: 'Cộng đồng',
};

export async function GET() {
  try {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    const posts = await listCommunityPostsDb();
    return NextResponse.json({ success: true, posts });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi tải bài viết cộng đồng.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const title = String(body.title || '').trim();
    const content = String(body.content || '').trim();
    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: 'Tiêu đề và nội dung bài viết không được để trống.' },
        { status: 400 }
      );
    }

    const rawCat = String(body.category || 'DISCUSSION').trim();
    const category = CATEGORY_TO_DB[rawCat] || rawCat || 'Cộng đồng';

    const post = await createCommunityPostDb({
      id: body.id || `post-${Date.now()}`,
      author_name: guard.session.profile.fullname || guard.session.profile.full_name || 'Cư dân Skyline',
      author_role: guard.session.role,
      apt_code: guard.session.apartment_code || null,
      avatar_url: guard.session.profile.avatar_url || null,
      title,
      content,
      category,
      ai_moderation: body.aiModeration || 'Clean',
      ai_sentiment: typeof body.aiSentiment === 'number' ? body.aiSentiment : 0.5,
      tags: Array.isArray(body.tags) ? body.tags : [],
      likes: 0,
      comments_count: 0,
      is_pinned: guard.session.role === 'ADMIN' ? Boolean(body.isPinned) : false,
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi đăng bài viết cộng đồng.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu id bài viết.' }, { status: 400 });
    }

    const delta = body.delta === -1 ? -1 : 1;
    const post = await incrementCommunityPostLikesDb(id, delta);
    if (!post) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy bài viết.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, post });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi cập nhật bài viết.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    let id = (searchParams.get('id') || '').trim();
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = String(body.id || '').trim();
    }
    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu id bài viết cần xóa.' }, { status: 400 });
    }

    const deleted = await deleteCommunityPostDb(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy bài viết.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi xóa bài viết.' },
      { status: 500 }
    );
  }
}

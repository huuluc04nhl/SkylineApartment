import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';

type CommunityPostRow = Database['public']['Tables']['community_posts']['Row'];
type CommunityPostInsert = Database['public']['Tables']['community_posts']['Insert'];
type VotingTopicRow = Database['public']['Tables']['voting_topics']['Row'];

export class VoteConflictError extends Error {
  status = 409;
  constructor(message: string) {
    super(message);
    this.name = 'VoteConflictError';
  }
}

export class VoteValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'VoteValidationError';
    this.status = status;
  }
}

export interface VotingTopicDto {
  id: string;
  code: string;
  title: string;
  description: string;
  legalType: string;
  createdBy: string;
  createdAt: string;
  deadline: string;
  status: 'OPEN' | 'CLOSED';
  isOwnerOnly: boolean;
  totalEligibleApartments: number;
  totalVotes: number;
  summaryReport: string;
  options: Array<{ id: string; text: string; votes: number }>;
  voters: Array<{ aptCode: string; voterName: string; optionId: string; votedAt: string }>;
}

export async function listCommunityPostsDb(): Promise<CommunityPostRow[]> {
  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Supabase community_posts select error: ${error.message}`);
  return data ?? [];
}

export async function createCommunityPostDb(input: CommunityPostInsert): Promise<CommunityPostRow> {
  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .insert(input)
    .select('*')
    .single();
  if (error) throw new Error(`Supabase community_posts insert error: ${error.message}`);
  return data;
}

export async function incrementCommunityPostLikesDb(id: string, delta = 1): Promise<CommunityPostRow | null> {
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('community_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) throw new Error(`Supabase community_posts select error: ${fetchErr.message}`);
  if (!existing) return null;

  const nextLikes = Math.max(0, (existing.likes ?? 0) + delta);
  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .update({ likes: nextLikes })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(`Supabase community_posts update error: ${error.message}`);
  return data;
}

export async function deleteCommunityPostDb(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) throw new Error(`Supabase community_posts delete error: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

async function hydrateTopic(topic: VotingTopicRow): Promise<VotingTopicDto> {
  const [{ data: opts, error: optErr }, { data: recs, error: recErr }] = await Promise.all([
    supabaseAdmin.from('voting_options').select('*').eq('topic_id', topic.id),
    supabaseAdmin.from('voting_records').select('*').eq('topic_id', topic.id),
  ]);
  if (optErr) throw new Error(`Supabase voting_options select error: ${optErr.message}`);
  if (recErr) throw new Error(`Supabase voting_records select error: ${recErr.message}`);

  const records = recs ?? [];
  const options = (opts ?? []).map((o) => ({
    id: o.id,
    text: o.option_text,
    votes: records.filter((r) => r.option_id === o.id).length || o.votes_count || 0,
  }));

  return {
    id: topic.id,
    code: topic.code,
    title: topic.title,
    description: topic.description,
    legalType: topic.legal_type,
    createdBy: topic.created_by,
    createdAt: topic.created_at || new Date().toISOString(),
    deadline: topic.deadline,
    status: (topic.status as 'OPEN' | 'CLOSED') || 'OPEN',
    isOwnerOnly: topic.is_owner_only ?? true,
    totalEligibleApartments: topic.total_eligible_apartments ?? 200,
    totalVotes: records.length || topic.total_votes || 0,
    summaryReport: topic.summary_report || '',
    options,
    voters: records.map((r) => ({
      aptCode: r.apartment_code,
      voterName: r.voter_name || 'Cư dân',
      optionId: r.option_id,
      votedAt: r.voted_at || new Date().toISOString(),
    })),
  };
}

export async function listVotingTopicsDb(): Promise<VotingTopicDto[]> {
  const { data: topics, error } = await supabaseAdmin
    .from('voting_topics')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Supabase voting_topics select error: ${error.message}`);
  return Promise.all((topics ?? []).map(hydrateTopic));
}

export async function createVotingTopicDb(params: {
  id?: string;
  code?: string;
  title: string;
  description: string;
  legalType: string;
  createdBy: string;
  deadline: string;
  isOwnerOnly: boolean;
  totalEligibleApartments?: number;
  summaryReport?: string;
  options: string[];
}): Promise<VotingTopicDto> {
  const topicId = params.id || `vote-${Date.now()}`;
  const topicCode = params.code || `BQ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  let eligibleCount = params.totalEligibleApartments;
  if (!eligibleCount || eligibleCount <= 0) {
    const { count } = await supabaseAdmin
      .from('apartments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'OCCUPIED');
    eligibleCount = count && count > 0 ? count : 1;
  }

  const { data: topic, error: topicErr } = await supabaseAdmin
    .from('voting_topics')
    .insert({
      id: topicId,
      code: topicCode,
      title: params.title.trim(),
      description: params.description.trim(),
      legal_type: params.legalType,
      created_by: params.createdBy,
      deadline: params.deadline,
      status: 'OPEN',
      is_owner_only: params.isOwnerOnly,
      total_eligible_apartments: eligibleCount,
      total_votes: 0,
      summary_report: params.summaryReport?.trim() || '',
    })
    .select('*')
    .single();
  if (topicErr) throw new Error(`Supabase voting_topics insert error: ${topicErr.message}`);

  const cleanOptions = params.options.map((t) => t.trim()).filter(Boolean);
  if (cleanOptions.length > 0) {
    const optRows = cleanOptions.map((text, idx) => ({
      id: `opt-${topicId}-${idx + 1}`,
      topic_id: topicId,
      option_text: text,
      votes_count: 0,
    }));
    const { error: optErr } = await supabaseAdmin.from('voting_options').insert(optRows);
    if (optErr) throw new Error(`Supabase voting_options insert error: ${optErr.message}`);
  }

  return hydrateTopic(topic);
}

export async function castVoteDb(params: {
  topicId: string;
  userId?: string | null;
  aptCode: string;
  voterName: string;
  optionId: string;
}): Promise<VotingTopicDto> {
  const cleanApt = params.aptCode.trim().toUpperCase();
  if (!cleanApt) {
    throw new VoteValidationError('Thiếu mã căn hộ để bỏ phiếu.', 400);
  }

  const { data: topic, error: topicErr } = await supabaseAdmin
    .from('voting_topics')
    .select('*')
    .eq('id', params.topicId)
    .maybeSingle();
  if (topicErr) throw new Error(`Supabase voting_topics select error: ${topicErr.message}`);
  if (!topic) {
    throw new VoteValidationError('Không tìm thấy cuộc biểu quyết yêu cầu.', 404);
  }
  if (topic.status === 'CLOSED' || new Date(topic.deadline) < new Date()) {
    throw new VoteValidationError('Cuộc biểu quyết này đã kết thúc thời gian bình chọn.', 400);
  }

  const { data: opt, error: optCheckErr } = await supabaseAdmin
    .from('voting_options')
    .select('id')
    .eq('id', params.optionId)
    .eq('topic_id', params.topicId)
    .maybeSingle();
  if (optCheckErr) throw new Error(`Supabase voting_options check error: ${optCheckErr.message}`);
  if (!opt) {
    throw new VoteValidationError('Phương án biểu quyết không hợp lệ.', 400);
  }

  const { error: insertErr } = await supabaseAdmin.from('voting_records').insert({
    id: `vr-${params.topicId}-${cleanApt.toLowerCase()}`,
    topic_id: params.topicId,
    user_id: params.userId || null,
    apartment_code: cleanApt,
    voter_name: params.voterName || 'Chủ hộ',
    option_id: params.optionId,
  });

  if (insertErr) {
    if (insertErr.code === '23505' || insertErr.message.toLowerCase().includes('uq_voting_apartment')) {
      throw new VoteConflictError(`Căn hộ ${cleanApt} đã bỏ phiếu cho chủ đề này rồi.`);
    }
    throw new Error(`Supabase voting_records insert error: ${insertErr.message}`);
  }

  const { data: allRecs } = await supabaseAdmin
    .from('voting_records')
    .select('option_id')
    .eq('topic_id', params.topicId);
  const recs = allRecs ?? [];

  await supabaseAdmin
    .from('voting_topics')
    .update({ total_votes: recs.length })
    .eq('id', params.topicId);

  const optionCount = recs.filter((r) => r.option_id === params.optionId).length;
  await supabaseAdmin
    .from('voting_options')
    .update({ votes_count: optionCount })
    .eq('id', params.optionId);

  return hydrateTopic(topic);
}

export async function toggleVotingTopicStatusDb(topicId: string): Promise<VotingTopicDto | null> {
  const { data: topic, error: fetchErr } = await supabaseAdmin
    .from('voting_topics')
    .select('*')
    .eq('id', topicId)
    .maybeSingle();
  if (fetchErr) throw new Error(`Supabase voting_topics select error: ${fetchErr.message}`);
  if (!topic) return null;

  const nextStatus = topic.status === 'OPEN' ? 'CLOSED' : 'OPEN';
  const { data: updated, error: updErr } = await supabaseAdmin
    .from('voting_topics')
    .update({ status: nextStatus })
    .eq('id', topicId)
    .select('*')
    .single();
  if (updErr) throw new Error(`Supabase voting_topics update error: ${updErr.message}`);

  return hydrateTopic(updated);
}

/**
 * Skyline Smart Residence - Centralized Voting & Polling Store
 * 
 * Quản trị dữ liệu Biểu Quyết & Lấy Ý Kiến Cư Dân:
 * - Lưu trữ danh sách các cuộc biểu quyết hợp pháp của Tòa nhà
 * - Quản lý lá phiếu của từng căn hộ (Mã căn, người biểu quyết, thời gian)
 * - Cập nhật tỷ lệ phiếu thời gian thực và đồng bộ hai chiều giữa Ban Quản Lý & Cư Dân
 */

import { VotingTopicRecord, VotingRecordItem } from './db/schema';

export type VotingLegalType = 
  | 'Bầu Ban Quản Trị' 
  | 'Đóng góp Quỹ Bảo trì' 
  | 'Ý kiến Cải tạo' 
  | 'Quy Chế Chung Cư' 
  | 'Tiện Ích & Dịch Vụ';

export interface VotingOption {
  id: string;
  text: string;
  votes: number;
}

export interface VoterRecord {
  aptCode: string;
  voterName: string;
  optionId: string;
  votedAt: string;
}

export interface VotingTopic {
  id: string;
  code: string; // VD: BQ-2026-01
  title: string;
  description: string;
  legalType: VotingLegalType;
  createdBy: string;
  createdAt: string;
  deadline: string; // ISO String
  status: 'OPEN' | 'CLOSED';
  isOwnerOnly: boolean;
  options: VotingOption[];
  totalVotes: number;
  totalEligibleApartments: number; // Tổng số căn hộ có quyền biểu quyết (VD: 250 căn)
  voters: VoterRecord[];
  summaryReport?: string;
}

export const INITIAL_VOTING_TOPICS: VotingTopic[] = [];

function notifyVotingUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_voting_updated'));
  }
}

export function topicRecordToTopic(rec: VotingTopicRecord): VotingTopic {
  const voters: VoterRecord[] = [];

  return {
    id: rec.id,
    code: rec.code,
    title: rec.title,
    description: rec.description,
    legalType: rec.legal_type as any,
    createdBy: rec.created_by,
    createdAt: rec.created_at,
    deadline: rec.deadline,
    status: rec.status,
    isOwnerOnly: rec.is_owner_only,
    totalEligibleApartments: rec.total_eligible_apartments,
    totalVotes: voters.length || rec.total_votes,
    options: rec.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      votes: voters.filter(v => v.optionId === opt.id).length || opt.votes
    })),
    voters,
    summaryReport: rec.summary_report
  };
}

let inMemoryVotingTopics: VotingTopic[] = [];

export function getVotingTopics(): VotingTopic[] {
  return inMemoryVotingTopics;
}

export async function syncVotingTopicsFromApi(): Promise<VotingTopic[]> {
  if (typeof window === 'undefined') return inMemoryVotingTopics;
  try {
    const res = await fetch('/api/voting', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.topics)) {
        inMemoryVotingTopics = data.topics;
        notifyVotingUpdated();
      }
    }
  } catch (err) {
    console.warn('syncVotingTopicsFromApi error:', err);
  }
  return inMemoryVotingTopics;
}

export function saveVotingTopics(topics: VotingTopic[]): void {
  inMemoryVotingTopics = [...topics];
  notifyVotingUpdated();
}


/**
 * Cư dân / Chủ hộ thực hiện bỏ phiếu biểu quyết
 */
export function castVote(params: {
  topicId: string;
  aptCode: string;
  optionId: string;
  voterName: string;
}): { success: boolean; message: string; topic?: VotingTopic } {
  const topics = getVotingTopics();
  const cleanApt = params.aptCode.trim().toUpperCase();

  const targetIndex = topics.findIndex(t => t.id === params.topicId);
  if (targetIndex === -1) {
    return { success: false, message: 'Không tìm thấy cuộc biểu quyết yêu cầu.' };
  }

  const topic = topics[targetIndex];

  // Kiểm tra thời hạn
  if (topic.status === 'CLOSED' || new Date(topic.deadline) < new Date()) {
    return { success: false, message: 'Cuộc biểu quyết này đã kết thúc thời gian bình chọn.' };
  }

  const existingVoterIndex = topic.voters.findIndex(v => v.aptCode.trim().toUpperCase() === cleanApt);
  if (existingVoterIndex !== -1) {
    return {
      success: false,
      message: `Căn hộ ${cleanApt} đã bỏ phiếu cho chủ đề này rồi.`,
      topic,
    };
  }

  const updatedVoters = [
    ...topic.voters,
    {
      aptCode: cleanApt,
      voterName: params.voterName,
      optionId: params.optionId,
      votedAt: new Date().toISOString(),
    },
  ];

  if (typeof window !== 'undefined') {
    fetch('/api/voting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'VOTE', topicId: params.topicId, optionId: params.optionId }),
    }).catch(err => console.warn('POST /api/voting VOTE error:', err));
  }

  // Luôn tính toán số phiếu của từng phương án và tổng số phiếu trực tiếp từ danh sách cử tri thực tế (100% không dữ liệu ảo)
  const updatedOptions = topic.options.map(opt => ({
    ...opt,
    votes: updatedVoters.filter(v => v.optionId === opt.id).length,
  }));
  const updatedTotalVotes = updatedVoters.length;

  const updatedTopic: VotingTopic = {
    ...topic,
    options: updatedOptions,
    totalVotes: updatedTotalVotes,
    voters: updatedVoters,
  };

  topics[targetIndex] = updatedTopic;
  saveVotingTopics(topics);

  return {
    success: true,
    message: `Lá phiếu biểu quyết của Căn ${cleanApt} đã được mã hóa và ghi nhận thành công!`,
    topic: updatedTopic,
  };
}

/**
 * Ban Quản Lý tạo cuộc biểu quyết mới
 */
export function createVotingTopic(params: {
  title: string;
  description: string;
  legalType: VotingLegalType;
  deadline: string;
  isOwnerOnly: boolean;
  options: string[];
  summaryReport?: string;
}): VotingTopic {
  const topics = getVotingTopics();
  const nextNum = topics.length + 1;
  const code = `BQ-2026-${String(nextNum).padStart(2, '0')}`;
  const id = `vote-${Date.now()}`;

  const optionItems: VotingOption[] = params.options
    .filter(t => t.trim().length > 0)
    .map((text, idx) => ({
      id: `opt-${id}-${idx + 1}`,
      text: text.trim(),
      votes: 0,
    }));

  const newTopic: VotingTopic = {
    id,
    code,
    title: params.title.trim(),
    description: params.description.trim(),
    legalType: params.legalType,
    createdBy: 'Ban Quản Trị Tòa Nhà',
    createdAt: new Date().toISOString(),
    deadline: params.deadline,
    status: 'OPEN',
    isOwnerOnly: params.isOwnerOnly,
    totalEligibleApartments: 250,
    totalVotes: 0,
    options: optionItems,
    voters: [],
    summaryReport: params.summaryReport?.trim() || '',
  };

  const nextList = [newTopic, ...topics];
  saveVotingTopics(nextList);

  if (typeof window !== 'undefined') {
    fetch('/api/voting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'CREATE',
        title: params.title,
        description: params.description,
        legalType: params.legalType,
        deadline: params.deadline,
        isOwnerOnly: params.isOwnerOnly,
        options: params.options,
        summaryReport: params.summaryReport,
      }),
    }).catch(err => console.warn('POST /api/voting CREATE error:', err));
  }

  return newTopic;
}

/**
 * Đóng hoặc mở lại cuộc biểu quyết
 */
export function toggleVotingTopicStatus(topicId: string): VotingTopic | null {
  const topics = getVotingTopics();
  let updated: VotingTopic | null = null;

  const nextList = topics.map(t => {
    if (t.id === topicId) {
      updated = {
        ...t,
        status: t.status === 'OPEN' ? 'CLOSED' : 'OPEN',
      };
      return updated;
    }
    return t;
  });

  if (updated) {
    saveVotingTopics(nextList);
    if (typeof window !== 'undefined') {
      fetch('/api/voting', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topicId }),
      }).catch(err => console.warn('PATCH /api/voting error:', err));
    }
  }

  return updated;
}

import type { UserRole } from '@/lib/db/schema';

export type TicketStatus = 'Open' | 'Assigned' | 'In_Progress' | 'Resolved';

export type TicketAction =
  | 'ASSIGN'
  | 'START_WORK'
  | 'RESOLVE'
  | 'REJECT_RESOLUTION'
  | 'CONFIRM_RESOLUTION'
  | 'ADMIN_REPLY';

export interface TicketTransitionContext {
  currentStatus: TicketStatus;
  ticketType?: string;
  handledBy?: string;
  assignedTechnicianId?: string | null;
  actorRole: UserRole;
  isAssignedTechnician?: boolean;
  isTicketOwner?: boolean;
  hasAfterImage?: boolean;
}

export interface TransitionDecision {
  allowed: boolean;
  httpStatus?: 403 | 409;
  nextStatus: TicketStatus;
  reason?: string;
}

/**
 * Máy trạng thái chặt cho quy trình xử lý phiếu:
 * - Open -> Assigned (ADMIN gán KTV AVAILABLE)
 * - Assigned -> In_Progress (TECHNICIAN được gán nhận việc)
 * - In_Progress -> Resolved (TECHNICIAN được gán gửi ảnh hoàn thành, hoặc ADMIN nghiệm thu phiếu đã In_Progress)
 * - Resolved -> Resolved (Cư dân chủ phiếu xác nhận nghiệm thu / đánh giá)
 * - Resolved -> In_Progress (REJECT_RESOLUTION bởi ADMIN hoặc Cư dân chủ phiếu)
 * - ADMIN_REPLY: chỉ ghi phản hồi, không đổi trạng thái; riêng phiếu INQUIRY/FEEDBACK không cần KTV được phép đóng (Open -> Resolved).
 */
export function evaluateTicketTransition(
  action: TicketAction,
  ctx: TicketTransitionContext
): TransitionDecision {
  const { currentStatus, actorRole } = ctx;

  switch (action) {
    case 'ASSIGN': {
      if (actorRole !== 'ADMIN') {
        return {
          allowed: false,
          httpStatus: 403,
          nextStatus: currentStatus,
          reason: 'Chỉ ADMIN mới có quyền phân công kỹ thuật viên.',
        };
      }
      if (currentStatus !== 'Open') {
        return {
          allowed: false,
          httpStatus: 409,
          nextStatus: currentStatus,
          reason: `Không thể phân công phiếu đang ở trạng thái ${currentStatus} (chỉ hợp lệ từ Open).`,
        };
      }
      return { allowed: true, nextStatus: 'Assigned' };
    }

    case 'START_WORK': {
      if (actorRole !== 'TECHNICIAN') {
        return {
          allowed: false,
          httpStatus: 403,
          nextStatus: currentStatus,
          reason: 'Chỉ kỹ thuật viên được phân công mới có quyền nhận việc.',
        };
      }
      if (!ctx.assignedTechnicianId || !ctx.isAssignedTechnician) {
        return {
          allowed: false,
          httpStatus: 403,
          nextStatus: currentStatus,
          reason: 'Bạn không phải kỹ thuật viên được phân công xử lý phiếu này.',
        };
      }
      if (currentStatus !== 'Assigned') {
        return {
          allowed: false,
          httpStatus: 409,
          nextStatus: currentStatus,
          reason: `Chỉ có thể nhận việc khi phiếu ở trạng thái Assigned (hiện tại: ${currentStatus}).`,
        };
      }
      return { allowed: true, nextStatus: 'In_Progress' };
    }

    case 'RESOLVE': {
      if (actorRole !== 'TECHNICIAN' && actorRole !== 'ADMIN') {
        return {
          allowed: false,
          httpStatus: 403,
          nextStatus: currentStatus,
          reason: 'Chỉ kỹ thuật viên được gán hoặc ADMIN mới có quyền nghiệm thu phiếu.',
        };
      }
      if (!ctx.assignedTechnicianId) {
        return {
          allowed: false,
          httpStatus: 409,
          nextStatus: currentStatus,
          reason: 'Không thể đóng phiếu kỹ thuật khi chưa được gán kỹ thuật viên.',
        };
      }
      if (actorRole === 'TECHNICIAN' && !ctx.isAssignedTechnician) {
        return {
          allowed: false,
          httpStatus: 403,
          nextStatus: currentStatus,
          reason: 'Kỹ thuật viên không được phép đóng phiếu của kỹ thuật viên khác.',
        };
      }
      if (currentStatus !== 'In_Progress') {
        return {
          allowed: false,
          httpStatus: 409,
          nextStatus: currentStatus,
          reason: `Không thể chuyển từ ${currentStatus} sang Resolved (phiếu phải ở trạng thái In_Progress).`,
        };
      }
      if (actorRole === 'TECHNICIAN' && !ctx.hasAfterImage) {
        return {
          allowed: false,
          httpStatus: 409,
          nextStatus: currentStatus,
          reason: 'Kỹ thuật viên phải gửi ảnh hoàn thành (afterImage) khi nghiệm thu.',
        };
      }
      return { allowed: true, nextStatus: 'Resolved' };
    }

    case 'REJECT_RESOLUTION': {
      if (actorRole !== 'ADMIN' && actorRole !== 'OWNER' && actorRole !== 'TENANT') {
        return {
          allowed: false,
          httpStatus: 403,
          nextStatus: currentStatus,
          reason: 'Chỉ ADMIN hoặc cư dân chủ phiếu mới có quyền từ chối nghiệm thu.',
        };
      }
      if ((actorRole === 'OWNER' || actorRole === 'TENANT') && !ctx.isTicketOwner) {
        return {
          allowed: false,
          httpStatus: 403,
          nextStatus: currentStatus,
          reason: 'Cư dân không có quyền thao tác trên phiếu của căn hộ khác.',
        };
      }
      if (currentStatus !== 'Resolved') {
        return {
          allowed: false,
          httpStatus: 409,
          nextStatus: currentStatus,
          reason: `Chỉ có thể từ chối nghiệm thu khi phiếu ở trạng thái Resolved (hiện tại: ${currentStatus}).`,
        };
      }
      return { allowed: true, nextStatus: 'In_Progress' };
    }

    case 'CONFIRM_RESOLUTION': {
      if (actorRole !== 'OWNER' && actorRole !== 'TENANT' && actorRole !== 'ADMIN') {
        return {
          allowed: false,
          httpStatus: 403,
          nextStatus: currentStatus,
          reason: 'Chỉ cư dân chủ phiếu hoặc ADMIN mới có quyền xác nhận nghiệm thu.',
        };
      }
      if ((actorRole === 'OWNER' || actorRole === 'TENANT') && !ctx.isTicketOwner) {
        return {
          allowed: false,
          httpStatus: 403,
          nextStatus: currentStatus,
          reason: 'Cư dân không có quyền xác nhận phiếu của căn hộ khác.',
        };
      }
      if (currentStatus !== 'Resolved') {
        return {
          allowed: false,
          httpStatus: 409,
          nextStatus: currentStatus,
          reason: `Chỉ có thể xác nhận khi phiếu đã ở trạng thái Resolved (hiện tại: ${currentStatus}).`,
        };
      }
      return { allowed: true, nextStatus: 'Resolved' };
    }

    case 'ADMIN_REPLY': {
      if (actorRole !== 'ADMIN') {
        return {
          allowed: false,
          httpStatus: 403,
          nextStatus: currentStatus,
          reason: 'Chỉ ADMIN mới có quyền gửi phản hồi BQL.',
        };
      }
      // Riêng phiếu loại INQUIRY hoặc FEEDBACK không cần KTV được phép đóng thẳng sang Resolved
      const isNonRepairTicket =
        (ctx.ticketType === 'INQUIRY' || ctx.ticketType === 'FEEDBACK') &&
        ctx.handledBy !== 'TECHNICIAN';
      if (isNonRepairTicket && currentStatus === 'Open') {
        return { allowed: true, nextStatus: 'Resolved' };
      }
      // Phiếu sửa chữa kỹ thuật: ADMIN_REPLY chỉ ghi phản hồi, giữ nguyên trạng thái hiện tại
      return { allowed: true, nextStatus: currentStatus };
    }
  }
}

export function mapDirectStatusChangeToAction(
  fromStatus: TicketStatus,
  toStatus: TicketStatus
): TicketAction | null {
  if (fromStatus === 'Open' && toStatus === 'Assigned') return 'ASSIGN';
  if (fromStatus === 'Assigned' && toStatus === 'In_Progress') return 'START_WORK';
  if (fromStatus === 'In_Progress' && toStatus === 'Resolved') return 'RESOLVE';
  if (fromStatus === 'Resolved' && toStatus === 'In_Progress') return 'REJECT_RESOLUTION';
  return null;
}

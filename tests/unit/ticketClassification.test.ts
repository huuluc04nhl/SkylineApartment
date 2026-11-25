import { describe, it, expect } from 'vitest';
import { classifyTicket } from '@/lib/ticketClassification';

describe('ticketClassification', () => {
  it('classifies urgent water/electric repair issues to TECHNICIAN with priority 1', () => {
    const res = classifyTicket('Ống nước bị vỡ ống tràn nước ra sàn phòng khách', 'Nước');
    expect(res.type).toBe('REPAIR');
    expect(res.handledBy).toBe('TECHNICIAN');
    expect(res.urgent).toBe(true);
    expect(res.priority).toBe(1);
  });

  it('classifies standard repair issues to TECHNICIAN with priority 2', () => {
    const res = classifyTicket('Điều hòa không mát cần kiểm tra', 'Điện');
    expect(res.type).toBe('REPAIR');
    expect(res.handledBy).toBe('TECHNICIAN');
    expect(res.urgent).toBe(false);
    expect(res.priority).toBe(2);
  });

  it('classifies resident feedback/inquiry appropriately', () => {
    const res = classifyTicket('Hồ bơi mở cửa mấy giờ vậy ban quản lý?', 'Tiện ích');
    expect(res.type).toBe('FEEDBACK');
    expect(res.handledBy).not.toBe('TECHNICIAN');
  });
});

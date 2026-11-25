-- ============================================================================
-- MIGRATION 20261125010000: ADD TICKET_EVENTS TABLE
-- Ghi nhận lịch sử chuyển trạng thái và sự kiện xử lý phiếu (service_tickets)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_events (
    id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
    event_type VARCHAR(40) NOT NULL CHECK (event_type IN (
        'CREATED',
        'STATUS_CHANGED',
        'ASSIGNED',
        'AI_REPLIED',
        'ADMIN_REPLIED',
        'RESOLVED',
        'REJECTED',
        'RATED'
    )),
    old_status VARCHAR(50) CHECK (old_status IS NULL OR old_status IN ('Open', 'Assigned', 'In_Progress', 'Resolved')),
    new_status VARCHAR(50) CHECK (new_status IS NULL OR new_status IN ('Open', 'Assigned', 'In_Progress', 'Resolved')),
    actor_name VARCHAR(150),
    actor_role VARCHAR(30) CHECK (actor_role IS NULL OR actor_role IN ('ADMIN', 'OWNER', 'TENANT', 'TECHNICIAN', 'RECEPTIONIST', 'AI', 'SYSTEM')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_id ON ticket_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_events_created_at ON ticket_events(created_at DESC);

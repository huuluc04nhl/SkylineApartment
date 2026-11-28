-- Bảng chống replay cho token thẻ cư dân động (jti một lần)
CREATE TABLE IF NOT EXISTS public.card_token_uses (
  jti UUID PRIMARY KEY,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_card_token_uses_expires_at
  ON public.card_token_uses (expires_at);

ALTER TABLE public.card_token_uses ENABLE ROW LEVEL SECURITY;
-- Không tạo policy cho anon/authenticated: chỉ server dùng service_role được phép đọc/ghi/dọn jti.

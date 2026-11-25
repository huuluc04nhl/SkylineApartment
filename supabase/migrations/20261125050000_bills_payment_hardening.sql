-- Payment & Billing Hardening: audit columns, failure tracking, and idempotent transaction_ref

ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS confirmed_by VARCHAR(150),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS last_payment_error TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS bills_transaction_ref_unique_idx
  ON public.bills (transaction_ref)
  WHERE transaction_ref IS NOT NULL;

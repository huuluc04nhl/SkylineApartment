-- Migration: Postgres-backed rate limiting RPCs reusing public.login_attempts
-- Supports both per-user AI/Gemini rate limits and per-(IP + identifier) login rate limits.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_attempts INT DEFAULT 20,
  p_window_seconds INT DEFAULT 60,
  p_consume BOOLEAN DEFAULT TRUE
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.login_attempts%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT * INTO v_row FROM public.login_attempts WHERE ip = p_key FOR UPDATE;

  IF NOT FOUND OR v_now > v_row.reset_at THEN
    IF p_consume THEN
      INSERT INTO public.login_attempts (ip, attempt_count, reset_at)
      VALUES (p_key, 1, v_now + make_interval(secs => p_window_seconds))
      ON CONFLICT (ip) DO UPDATE
        SET attempt_count = 1,
            reset_at = EXCLUDED.reset_at;
    END IF;
    RETURN TRUE;
  END IF;

  IF v_row.attempt_count >= p_max_attempts THEN
    RETURN FALSE;
  END IF;

  IF p_consume THEN
    UPDATE public.login_attempts
    SET attempt_count = v_row.attempt_count + 1
    WHERE ip = p_key;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_rate_limit(p_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE ip = p_key;
END;
$$;

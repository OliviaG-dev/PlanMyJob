-- PlanMyJob — Monthly report sharing (bilan mensuel)
-- Run in Supabase SQL Editor after shares migration

CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year int NOT NULL CHECK (year >= 2000 AND year <= 2100),
  month int NOT NULL CHECK (month >= 0 AND month <= 11),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NULL,
  revoked_at timestamptz NULL,
  snapshot jsonb NOT NULL,
  public_notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS monthly_reports_token_idx ON public.monthly_reports(token);
CREATE INDEX IF NOT EXISTS monthly_reports_user_period_idx
  ON public.monthly_reports(user_id, year, month);

ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS monthly_reports_select_own ON public.monthly_reports;
CREATE POLICY monthly_reports_select_own ON public.monthly_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS monthly_reports_insert_own ON public.monthly_reports;
CREATE POLICY monthly_reports_insert_own ON public.monthly_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS monthly_reports_update_own ON public.monthly_reports;
CREATE POLICY monthly_reports_update_own ON public.monthly_reports
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS monthly_reports_delete_own ON public.monthly_reports;
CREATE POLICY monthly_reports_delete_own ON public.monthly_reports
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.monthly_reports TO authenticated;
GRANT SELECT ON TABLE public.monthly_reports TO service_role;

CREATE OR REPLACE FUNCTION public.get_public_monthly_report(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report public.monthly_reports%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_report FROM public.monthly_reports WHERE token = trim(p_token);

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_report.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'revoked');
  END IF;

  IF v_report.expires_at IS NOT NULL AND v_report.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  RETURN v_report.snapshot || jsonb_build_object(
    'publicNotes', v_report.public_notes,
    'expiresAt', v_report.expires_at,
    'sharedAt', v_report.created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_monthly_report(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

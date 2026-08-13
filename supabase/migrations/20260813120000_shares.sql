-- PlanMyJob — Secure candidature sharing
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- After run: wait ~10s or reload API schema (Project Settings → API)

CREATE TABLE IF NOT EXISTS public.shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidature_id uuid NOT NULL REFERENCES public.candidatures(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NULL,
  revoked_at timestamptz NULL,
  snapshot jsonb NOT NULL,
  public_notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shares_token_idx ON public.shares(token);
CREATE INDEX IF NOT EXISTS shares_user_candidature_idx ON public.shares(user_id, candidature_id);

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shares_select_own ON public.shares;
CREATE POLICY shares_select_own ON public.shares
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS shares_insert_own ON public.shares;
CREATE POLICY shares_insert_own ON public.shares
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.candidatures c
      WHERE c.id = candidature_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS shares_update_own ON public.shares;
CREATE POLICY shares_update_own ON public.shares
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS shares_delete_own ON public.shares;
CREATE POLICY shares_delete_own ON public.shares
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shares TO authenticated;
GRANT SELECT ON TABLE public.shares TO service_role;

CREATE OR REPLACE FUNCTION public.create_share(
  p_candidature_id uuid,
  p_expires_at timestamptz,
  p_snapshot jsonb,
  p_public_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_token text;
  v_share public.shares%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.candidatures
    WHERE id = p_candidature_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'candidature not found';
  END IF;

  v_token := encode(gen_random_bytes(32), 'base64');
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');

  INSERT INTO public.shares (user_id, candidature_id, token, expires_at, snapshot, public_notes)
  VALUES (v_user_id, p_candidature_id, v_token, p_expires_at, p_snapshot, NULLIF(trim(p_public_notes), ''))
  RETURNING * INTO v_share;

  RETURN jsonb_build_object(
    'id', v_share.id,
    'token', v_share.token,
    'expiresAt', v_share.expires_at,
    'createdAt', v_share.created_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_share(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share public.shares%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_share FROM public.shares WHERE token = trim(p_token);

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_share.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'revoked');
  END IF;

  IF v_share.expires_at IS NOT NULL AND v_share.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  RETURN v_share.snapshot || jsonb_build_object(
    'publicNotes', v_share.public_notes,
    'expiresAt', v_share.expires_at,
    'sharedAt', v_share.created_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_share(p_share_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shares
  SET revoked_at = now(), updated_at = now()
  WHERE id = p_share_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'share not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_share(uuid, timestamptz, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_share(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_share(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- Verification (optional — should return 1 row each):
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shares';
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('create_share', 'get_public_share', 'revoke_share');

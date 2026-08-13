-- Renforce l'insertion : l'utilisateur ne peut partager que ses candidatures
-- Exécuter dans Supabase SQL Editor si ce n'est pas déjà fait

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

NOTIFY pgrst, 'reload schema';

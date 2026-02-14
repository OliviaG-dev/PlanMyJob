-- Colonne pour la temporalité « CV envoyé » : date de passage en statut cv_envoye.
-- À exécuter dans l’éditeur SQL Supabase (Table Editor > SQL Editor).

ALTER TABLE candidatures
ADD COLUMN IF NOT EXISTS cv_envoye_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN candidatures.cv_envoye_at IS 'Date de passage en statut CV envoyé (pour afficher la temporalité sur la fiche candidature).';

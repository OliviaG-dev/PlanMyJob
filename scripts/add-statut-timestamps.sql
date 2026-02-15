-- Migration : ajout des colonnes timestamp pour les changements de statut
-- À exécuter dans l'éditeur SQL Supabase

ALTER TABLE candidatures
  ADD COLUMN IF NOT EXISTS entretien_rh_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS entretien_technique_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attente_reponse_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refus_at TIMESTAMPTZ;

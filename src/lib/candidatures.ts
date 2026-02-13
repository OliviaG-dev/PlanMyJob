import { supabase } from "./supabase";
import type { Candidature, Statut, StatutSuivi } from "../types/candidature";
import type { AddCandidatureFormData } from "../pages/Candidatures/AddCandidatureModal";

type CandidatureRow = {
  id: string;
  user_id: string;
  entreprise: string;
  poste: string;
  lien_offre: string | null;
  statut: string;
  statut_suivi: string | null;
  date_candidature: string | null;
  priorite: string | null;
  notes: string | null;
  localisation: string | null;
  type_contrat: string | null;
  teletravail: string | null;
  source: string | null;
  note_personnelle: number | null;
  salaire_ou_fourchette: string | null;
  created_at: string;
  updated_at: string;
};

function rowToCandidature(row: CandidatureRow): Candidature {
  return {
    id: row.id,
    entreprise: row.entreprise,
    poste: row.poste,
    lienOffre: row.lien_offre ?? undefined,
    statut: row.statut as Candidature["statut"],
    statutSuivi: (row.statut_suivi as Candidature["statutSuivi"]) ?? undefined,
    dateCandidature: row.date_candidature ?? undefined,
    priorite: (row.priorite as Candidature["priorite"]) ?? undefined,
    notes: row.notes ?? undefined,
    localisation: row.localisation ?? undefined,
    typeContrat: (row.type_contrat as Candidature["typeContrat"]) ?? undefined,
    teletravail: (row.teletravail as Candidature["teletravail"]) ?? undefined,
    source: (row.source as Candidature["source"]) ?? undefined,
    notePersonnelle: row.note_personnelle ?? undefined,
    salaireOuFourchette: row.salaire_ou_fourchette ?? undefined,
    createdAt: row.created_at,
  };
}

export async function fetchCandidatures(
  userId: string
): Promise<Candidature[]> {
  const { data, error } = await supabase
    .from("candidatures")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as CandidatureRow[]).map(rowToCandidature);
}

export async function fetchCandidature(
  userId: string,
  candidatureId: string
): Promise<Candidature | null> {
  const { data, error } = await supabase
    .from("candidatures")
    .select("*")
    .eq("id", candidatureId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToCandidature(data as CandidatureRow) : null;
}

export async function insertCandidature(
  userId: string,
  form: AddCandidatureFormData
): Promise<Candidature> {
  const row = {
    user_id: userId,
    entreprise: form.entreprise.trim(),
    poste: form.poste.trim(),
    lien_offre: form.lienOffre.trim() || null,
    statut: form.statut,
    statut_suivi: form.statutSuivi,
    date_candidature: form.dateCandidature || null,
    priorite: null,
    notes: form.notes.trim() || null,
    localisation: form.localisation.trim() || null,
    type_contrat: form.typeContrat,
    teletravail: form.teletravail,
    source: form.source,
    note_personnelle: form.notePersonnelle,
    salaire_ou_fourchette: form.salaireOuFourchette.trim() || null,
  };

  const { data, error } = await supabase
    .from("candidatures")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return rowToCandidature(data as CandidatureRow);
}

export type UpdateCandidaturePayload = {
  statut?: Statut;
  statutSuivi?: StatutSuivi;
};

export async function updateCandidature(
  userId: string,
  candidatureId: string,
  payload: UpdateCandidaturePayload
): Promise<Candidature> {
  const row: Record<string, unknown> = {};
  if (payload.statut !== undefined) row.statut = payload.statut;
  if (payload.statutSuivi !== undefined) row.statut_suivi = payload.statutSuivi;
  if (Object.keys(row).length === 0) {
    const current = await fetchCandidatures(userId);
    const found = current.find((c) => c.id === candidatureId);
    if (!found) throw new Error("Candidature introuvable");
    return found;
  }

  const { data, error } = await supabase
    .from("candidatures")
    .update(row)
    .eq("id", candidatureId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return rowToCandidature(data as CandidatureRow);
}

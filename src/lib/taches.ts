import { supabase } from "./supabase";
import type { Tache, PrioriteTache } from "../types/tache";

type TacheRow = {
  id: string;
  user_id: string;
  semaine_debut: string;
  titre: string;
  priorite: string;
  terminee: boolean;
  candidature_id: string | null;
  ordre: number;
  created_at: string;
  updated_at: string;
};

function rowToTache(row: TacheRow): Tache {
  return {
    id: row.id,
    semaineDebut: row.semaine_debut,
    titre: row.titre,
    priorite: row.priorite as PrioriteTache,
    terminee: row.terminee,
    candidatureId: row.candidature_id ?? undefined,
    ordre: row.ordre,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchTaches(
  userId: string,
  semaineDebuts: string[]
): Promise<Tache[]> {
  if (semaineDebuts.length === 0) return [];

  const { data, error } = await supabase
    .from("taches")
    .select("*")
    .eq("user_id", userId)
    .in("semaine_debut", semaineDebuts)
    .order("ordre", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as TacheRow[]).map(rowToTache);
}

export async function insertTache(
  userId: string,
  data: {
    semaineDebut: string;
    titre: string;
    priorite?: PrioriteTache;
    candidatureId?: string;
  }
): Promise<Tache> {
  const { data: maxOrder } = await supabase
    .from("taches")
    .select("ordre")
    .eq("user_id", userId)
    .eq("semaine_debut", data.semaineDebut)
    .order("ordre", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ordre = (maxOrder as { ordre: number } | null)?.ordre ?? -1;

  const row = {
    user_id: userId,
    semaine_debut: data.semaineDebut,
    titre: data.titre.trim(),
    priorite: data.priorite ?? "normale",
    terminee: false,
    candidature_id: data.candidatureId ?? null,
    ordre: ordre + 1,
  };

  const { data: inserted, error } = await supabase
    .from("taches")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return rowToTache(inserted as TacheRow);
}

export async function updateTache(
  userId: string,
  tacheId: string,
  payload: {
    titre?: string;
    priorite?: PrioriteTache;
    terminee?: boolean;
  }
): Promise<Tache> {
  const row: Record<string, unknown> = {};
  if (payload.titre !== undefined) row.titre = payload.titre.trim();
  if (payload.priorite !== undefined) row.priorite = payload.priorite;
  if (payload.terminee !== undefined) row.terminee = payload.terminee;

  if (Object.keys(row).length === 0) {
    const { data } = await supabase
      .from("taches")
      .select("*")
      .eq("id", tacheId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) throw new Error("Tâche introuvable");
    return rowToTache(data as TacheRow);
  }

  const { data, error } = await supabase
    .from("taches")
    .update(row)
    .eq("id", tacheId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return rowToTache(data as TacheRow);
}

export async function deleteTache(
  userId: string,
  tacheId: string
): Promise<void> {
  const { error } = await supabase
    .from("taches")
    .delete()
    .eq("id", tacheId)
    .eq("user_id", userId);

  if (error) throw error;
}

import { supabase } from "./supabase";
import type { Projet } from "../types/projet";

type ProjetRow = {
  id: string;
  user_id: string;
  titre: string;
  description: string;
  created_at: string;
};

function rowToProjet(row: ProjetRow): Projet {
  return {
    id: row.id,
    titre: row.titre,
    description: row.description,
    createdAt: row.created_at,
  };
}

export async function fetchProjets(userId: string): Promise<Projet[]> {
  const { data, error } = await supabase
    .from("projets")
    .select("id, titre, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as ProjetRow[]).map(rowToProjet);
}

export async function insertProjet(
  userId: string,
  data: { titre: string; description: string }
): Promise<Projet> {
  const row = {
    user_id: userId,
    titre: data.titre.trim(),
    description: data.description.trim(),
  };

  const { data: inserted, error } = await supabase
    .from("projets")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return rowToProjet(inserted as ProjetRow);
}

export async function updateProjet(
  userId: string,
  id: string,
  data: { titre?: string; description?: string }
): Promise<Projet> {
  const body: Record<string, unknown> = {};
  if (data.titre !== undefined) body.titre = data.titre.trim();
  if (data.description !== undefined) body.description = data.description.trim();
  if (Object.keys(body).length === 0) {
    const current = await fetchProjets(userId).then((list) => list.find((p) => p.id === id));
    if (!current) throw new Error("Projet introuvable");
    return current;
  }

  const { data: updated, error } = await supabase
    .from("projets")
    .update(body)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return rowToProjet(updated as ProjetRow);
}

export async function deleteProjet(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from("projets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

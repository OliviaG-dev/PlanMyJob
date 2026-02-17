import { supabase } from "./supabase";
import type { CvRessource, CvType, CvFormat } from "../types/cvRessource";

type CvRessourceRow = {
  id: string;
  user_id: string;
  titre: string;
  type: string;
  format: string | null;
  url: string;
  created_at: string;
};

function rowToCvRessource(row: CvRessourceRow): CvRessource {
  return {
    id: row.id,
    titre: row.titre,
    type: row.type as CvType,
    format: (row.format as CvFormat) ?? undefined,
    url: row.url,
    createdAt: row.created_at,
  };
}

export async function fetchCvRessources(userId: string): Promise<CvRessource[]> {
  const { data, error } = await supabase
    .from("cv_ressources")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as CvRessourceRow[]).map(rowToCvRessource);
}

export async function insertCvRessource(
  userId: string,
  data: { titre: string; type: CvType; format?: CvFormat; url: string }
): Promise<CvRessource> {
  const row = {
    user_id: userId,
    titre: data.titre.trim(),
    type: data.type,
    format: data.format ?? null,
    url: data.url.trim(),
  };

  const { data: inserted, error } = await supabase
    .from("cv_ressources")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return rowToCvRessource(inserted as CvRessourceRow);
}

export async function deleteCvRessource(
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("cv_ressources")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

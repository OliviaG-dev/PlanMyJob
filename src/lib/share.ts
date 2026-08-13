import { supabase } from "./supabase";
import {
  buildPublicShareSnapshot,
  computeExpiresAt,
  generateShareToken,
} from "../utils/shareSnapshot";
import type { Candidature } from "../types/candidature";
import type {
  CreateShareResult,
  PublicShareData,
  PublicShareError,
  ShareDuration,
  ShareRecord,
} from "../types/share.types";
import { formatShareError } from "../utils/shareErrors";

type ShareRow = {
  id: string;
  token: string;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  candidature_id: string;
};

type CreateShareRow = {
  id: string;
  token: string;
  expires_at: string | null;
  created_at: string;
};

function rowToShareRecord(row: ShareRow): ShareRecord {
  return {
    id: row.id,
    token: row.token,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    candidatureId: row.candidature_id,
  };
}

function isPublicShareError(
  value: unknown
): value is { error: PublicShareError } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    ((value as { error: string }).error === "expired" ||
      (value as { error: string }).error === "revoked")
  );
}

export async function createShare(
  userId: string,
  candidature: Candidature,
  duration: ShareDuration,
  publicNotes?: string
): Promise<CreateShareResult> {
  const snapshot = buildPublicShareSnapshot(candidature);
  const expiresAt = computeExpiresAt(duration);
  const trimmedNotes = publicNotes?.trim();

  const { data, error } = await supabase
    .from("shares")
    .insert({
      user_id: userId,
      candidature_id: candidature.id,
      token: generateShareToken(),
      expires_at: expiresAt,
      snapshot,
      public_notes: trimmedNotes || null,
    })
    .select("id, token, expires_at, created_at")
    .single();

  if (error) throw new Error(formatShareError(error));
  if (!data) {
    throw new Error("Réponse invalide lors de la création du partage");
  }

  const row = data as CreateShareRow;

  return {
    id: row.id,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export async function fetchPublicShare(
  token: string
): Promise<
  | { ok: true; data: PublicShareData }
  | { ok: false; reason: PublicShareError | "not_found" }
> {
  const { data, error } = await supabase.rpc("get_public_share", {
    p_token: token,
  });

  if (error) throw new Error(formatShareError(error));
  if (data == null) return { ok: false, reason: "not_found" };
  if (isPublicShareError(data)) return { ok: false, reason: data.error };

  return { ok: true, data: data as PublicShareData };
}

export async function fetchSharesForCandidature(
  userId: string,
  candidatureId: string
): Promise<ShareRecord[]> {
  const { data, error } = await supabase
    .from("shares")
    .select("id, token, expires_at, revoked_at, created_at, candidature_id")
    .eq("user_id", userId)
    .eq("candidature_id", candidatureId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(formatShareError(error));
  return (data as ShareRow[]).map(rowToShareRecord);
}

export async function revokeShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from("shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", shareId);

  if (error) throw new Error(formatShareError(error));
}

export function isShareActive(share: ShareRecord): boolean {
  if (share.revokedAt) return false;
  if (!share.expiresAt) return true;
  return new Date(share.expiresAt).getTime() > Date.now();
}

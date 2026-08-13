import { supabase } from "./supabase";
import { fetchCandidatures } from "./candidatures";
import {
  computeExpiresAt,
  generateShareToken,
} from "../utils/shareSnapshot";
import { buildMonthlyReportSnapshot } from "../utils/monthlyReportSnapshot";
import type {
  ActiveMonthlyReportSummary,
  CreateMonthlyReportResult,
  MonthlyReportRecord,
  MonthlyReportSnapshot,
  PublicMonthlyReportData,
  ShareDuration,
} from "../types/monthlyReport.types";
import { formatShareError } from "../utils/shareErrors";

type MonthlyReportRow = {
  id: string;
  token: string;
  year: number;
  month: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  snapshot?: MonthlyReportSnapshot;
};

type CreateMonthlyReportRow = {
  id: string;
  token: string;
  expires_at: string | null;
  created_at: string;
};

function rowToRecord(row: MonthlyReportRow): MonthlyReportRecord {
  return {
    id: row.id,
    token: row.token,
    year: row.year,
    month: row.month,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

function isPublicReportError(
  value: unknown
): value is { error: "expired" | "revoked" } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    ((value as { error: string }).error === "expired" ||
      (value as { error: string }).error === "revoked")
  );
}

export function isMonthlyReportActive(report: MonthlyReportRecord): boolean {
  if (report.revokedAt) return false;
  if (!report.expiresAt) return true;
  return new Date(report.expiresAt).getTime() > Date.now();
}

export async function createMonthlyReport(
  userId: string,
  year: number,
  month: number,
  duration: ShareDuration,
  publicNotes?: string
): Promise<CreateMonthlyReportResult> {
  const candidatures = await fetchCandidatures(userId);
  const snapshot = buildMonthlyReportSnapshot(candidatures, year, month);
  const expiresAt = computeExpiresAt(duration);
  const trimmedNotes = publicNotes?.trim();

  const { data, error } = await supabase
    .from("monthly_reports")
    .insert({
      user_id: userId,
      year,
      month,
      token: generateShareToken(),
      expires_at: expiresAt,
      snapshot,
      public_notes: trimmedNotes || null,
    })
    .select("id, token, expires_at, created_at")
    .single();

  if (error) throw new Error(formatShareError(error));
  if (!data) {
    throw new Error("Réponse invalide lors de la création du bilan");
  }

  const row = data as CreateMonthlyReportRow;
  return {
    id: row.id,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export async function regenerateMonthlyReport(
  userId: string,
  existingReportId: string,
  year: number,
  month: number,
  duration: ShareDuration,
  publicNotes?: string
): Promise<CreateMonthlyReportResult> {
  await revokeMonthlyReport(existingReportId);
  return createMonthlyReport(userId, year, month, duration, publicNotes);
}

export async function fetchPublicMonthlyReport(
  token: string
): Promise<
  | { ok: true; data: PublicMonthlyReportData }
  | { ok: false; reason: "expired" | "revoked" | "not_found" }
> {
  const { data, error } = await supabase.rpc("get_public_monthly_report", {
    p_token: token,
  });

  if (error) throw new Error(formatShareError(error));
  if (data == null) return { ok: false, reason: "not_found" };
  if (isPublicReportError(data)) return { ok: false, reason: data.error };

  return { ok: true, data: data as PublicMonthlyReportData };
}

export async function fetchActiveMonthlyReportsForUser(
  userId: string
): Promise<ActiveMonthlyReportSummary[]> {
  const { data, error } = await supabase
    .from("monthly_reports")
    .select(
      "id, token, year, month, expires_at, revoked_at, created_at, snapshot"
    )
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(formatShareError(error));

  return (data as MonthlyReportRow[])
    .map((row) => ({
      ...rowToRecord(row),
      monthLabel: row.snapshot?.monthLabel ?? `${row.month + 1}/${row.year}`,
    }))
    .filter(isMonthlyReportActive);
}

export async function fetchActiveMonthlyReportForPeriod(
  userId: string,
  year: number,
  month: number
): Promise<ActiveMonthlyReportSummary | null> {
  const reports = await fetchActiveMonthlyReportsForUser(userId);
  return (
    reports.find((r) => r.year === year && r.month === month) ?? null
  );
}

export async function revokeMonthlyReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from("monthly_reports")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) throw new Error(formatShareError(error));
}

/** Preview snapshot without persisting (for local preview). */
export async function previewMonthlyReportSnapshot(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyReportSnapshot> {
  const candidatures = await fetchCandidatures(userId);
  return buildMonthlyReportSnapshot(candidatures, year, month);
}

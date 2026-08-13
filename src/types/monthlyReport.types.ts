import type { SourceCandidature } from "./candidature";
import type { PublicShareSnapshot, ShareDuration } from "./share.types";

export type MonthlyReportStats = {
  candidaturesEnvoyees: number;
  enCours: number;
  entretiens: number;
  offres: number;
  tauxRefus: number;
  tauxSansReponse: number;
  /** Présent dans les snapshots générés avant remplacement par offres */
  tauxReponse?: number;
  repartitionSource: Record<SourceCandidature, number>;
};

export type MonthlyReportWeek = {
  weekStart: string;
  weekLabel: string;
  candidatures: PublicShareSnapshot[];
};

export type MonthlyReportSnapshot = {
  year: number;
  month: number;
  monthLabel: string;
  isPartial: boolean;
  partialUntil: string;
  stats: MonthlyReportStats;
  weeks: MonthlyReportWeek[];
  snapshotAt: string;
};

export type MonthlyReportRecord = {
  id: string;
  token: string;
  year: number;
  month: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type ActiveMonthlyReportSummary = MonthlyReportRecord & {
  monthLabel: string;
};

export type PublicMonthlyReportData = MonthlyReportSnapshot & {
  publicNotes?: string | null;
  expiresAt?: string | null;
  sharedAt: string;
};

export type CreateMonthlyReportResult = {
  id: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
};

export type { ShareDuration };

import type { Statut } from "./candidature";

export type ShareDuration = "24h" | "7d" | "30d" | "never";

export type ShareTimelineEvent = {
  date: string;
  label: string;
};

export type PublicShareSnapshot = {
  entreprise: string;
  poste: string;
  localisation?: string;
  dateCandidature?: string;
  statut: Statut;
  statutLabel: string;
  cvEnvoye: boolean;
  lienOffre?: string;
  sourceLabel?: string;
  typeContratLabel?: string;
  timeline: ShareTimelineEvent[];
  snapshotAt: string;
};

export type PublicShareData = PublicShareSnapshot & {
  publicNotes?: string | null;
  expiresAt?: string | null;
  sharedAt: string;
};

export type PublicShareError = "expired" | "revoked";

export type CreateShareResult = {
  id: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
};

export type ShareRecord = {
  id: string;
  token: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  candidatureId: string;
};

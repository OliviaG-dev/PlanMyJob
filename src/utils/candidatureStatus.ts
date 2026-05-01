import type { Candidature } from "../types/candidature";

export function isCandidatureRefused(candidature: Candidature): boolean {
  return candidature.statut === "refus";
}

export function isCandidatureCompleted(candidature: Candidature): boolean {
  return candidature.statutSuivi === "terminee" && !isCandidatureRefused(candidature);
}

export function isCandidatureInProgress(candidature: Candidature): boolean {
  return !isCandidatureRefused(candidature) && candidature.statutSuivi !== "terminee";
}

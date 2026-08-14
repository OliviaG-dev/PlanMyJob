import { DAILY_RATE_PATTERN, CONTRAT_PATTERNS, TELETRAVAIL_PATTERNS } from "./constants";
import type { Teletravail, TypeContrat } from "../../types/candidature";

export function hasDailyRate(text: string): boolean {
  return DAILY_RATE_PATTERN.test(text);
}

export function extractTypeContrat(
  text: string,
  linkedInTypeContrat: TypeContrat | null,
): TypeContrat {
  let typeContrat: TypeContrat = "autre";
  for (const { pattern, value } of CONTRAT_PATTERNS) {
    if (pattern.test(text)) {
      typeContrat = value;
      break;
    }
  }
  if (typeContrat === "autre" && linkedInTypeContrat) {
    typeContrat = linkedInTypeContrat;
  }
  if (typeContrat === "autre" && /\btemps\s+plein\b/i.test(text)) {
    typeContrat = "cdi";
  }
  if (typeContrat === "autre" && !hasDailyRate(text)) {
    typeContrat = "cdi";
  }
  return typeContrat;
}

export function extractTeletravail(
  text: string,
  linkedInTeletravail: Teletravail | null,
): Teletravail {
  if (linkedInTeletravail) return linkedInTeletravail;

  for (const { pattern, value } of TELETRAVAIL_PATTERNS) {
    if (pattern.test(text)) return value;
  }
  return "inconnu";
}

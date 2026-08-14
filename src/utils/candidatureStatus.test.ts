import { describe, expect, it } from "vitest";
import type { Candidature } from "../types/candidature";
import {
  isCandidatureCompleted,
  isCandidatureInProgress,
  isCandidatureRefused,
} from "./candidatureStatus";

function baseCandidature(overrides: Partial<Candidature> = {}): Candidature {
  return {
    id: "c1",
    entreprise: "ACME",
    poste: "Dev",
    statut: "cv_envoye",
    statutSuivi: "en_cours",
    ...overrides,
  };
}

describe("candidatureStatus", () => {
  it("detects refused candidatures", () => {
    expect(isCandidatureRefused(baseCandidature({ statut: "refus" }))).toBe(
      true,
    );
    expect(isCandidatureRefused(baseCandidature({ statut: "cv_envoye" }))).toBe(
      false,
    );
  });

  it("marks completed candidatures except refus", () => {
    expect(
      isCandidatureCompleted(
        baseCandidature({ statutSuivi: "terminee", statut: "sans_reponse" }),
      ),
    ).toBe(true);
    expect(
      isCandidatureCompleted(
        baseCandidature({ statutSuivi: "terminee", statut: "refus" }),
      ),
    ).toBe(false);
    expect(
      isCandidatureCompleted(
        baseCandidature({ statutSuivi: "en_cours", statut: "offre" }),
      ),
    ).toBe(false);
  });

  it("marks in-progress candidatures when not refused and not finished", () => {
    expect(
      isCandidatureInProgress(
        baseCandidature({ statutSuivi: "en_cours", statut: "entretien_rh" }),
      ),
    ).toBe(true);
    expect(
      isCandidatureInProgress(
        baseCandidature({ statutSuivi: "terminee", statut: "sans_reponse" }),
      ),
    ).toBe(false);
    expect(
      isCandidatureInProgress(
        baseCandidature({ statutSuivi: "en_cours", statut: "refus" }),
      ),
    ).toBe(false);
  });
});

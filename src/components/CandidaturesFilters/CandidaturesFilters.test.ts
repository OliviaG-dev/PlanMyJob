import { describe, expect, it } from "vitest";
import type { Candidature } from "../../types/candidature";
import { filterCandidaturesByFilters } from "./CandidaturesFilters";

function candidature(overrides: Partial<Candidature> = {}): Candidature {
  return {
    id: "c1",
    entreprise: "Alpha Corp",
    poste: "Frontend Dev",
    statut: "cv_envoye",
    localisation: "Lyon",
    teletravail: "hybride",
    notePersonnelle: 4,
    ...overrides,
  };
}

describe("filterCandidaturesByFilters", () => {
  const list = [
    candidature(),
    candidature({
      id: "c2",
      entreprise: "Beta",
      poste: "Backend",
      localisation: "Paris",
      teletravail: "oui",
      notePersonnelle: 2,
    }),
  ];

  it("filters by company or job title", () => {
    expect(
      filterCandidaturesByFilters(list, {
        nom: "frontend",
        teletravail: "",
        ville: "",
        note: "",
      }),
    ).toHaveLength(1);
  });

  it("filters by teletravail, city and note", () => {
    expect(
      filterCandidaturesByFilters(list, {
        nom: "",
        teletravail: "oui",
        ville: "Paris",
        note: "2",
      }),
    ).toHaveLength(1);
    expect(
      filterCandidaturesByFilters(list, {
        nom: "",
        teletravail: "hybride",
        ville: "Lyon",
        note: "4",
      }),
    ).toHaveLength(1);
  });
});

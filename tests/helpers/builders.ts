import type { ExtractedOffer } from "../../src/lib/offerAnalyzer";

const defaultExtractedOffer: ExtractedOffer = {
  poste: "Developpeur Front-End",
  entreprise: "ACME",
  typeContrat: "cdi",
  teletravail: "hybride",
  source: "autre",
  localisation: "Lyon (69)",
  experienceYears: "3 ans",
  competences: ["react", "typescript"],
  pointsCles: ["Mutuelle"],
  salaireOuFourchette: "45k - 55k",
  lienCandidature: "https://example.com/offre",
};

export function buildExtractedOffer(
  overrides: Partial<ExtractedOffer> = {},
): ExtractedOffer {
  return { ...defaultExtractedOffer, ...overrides };
}

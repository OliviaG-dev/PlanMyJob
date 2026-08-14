import type {
  SourceCandidature,
  Teletravail,
  TypeContrat,
} from "../../types/candidature";

export type ExtractedOffer = {
  poste: string;
  entreprise: string;
  typeContrat: TypeContrat;
  teletravail: Teletravail;
  source: SourceCandidature;
  localisation: string;
  experienceYears: string;
  competences: string[];
  pointsCles: string[];
  salaireOuFourchette: string;
  lienCandidature: string;
};

export type LinkedInHeader = {
  poste: string;
  entreprise: string;
  localisation: string;
  teletravail: Teletravail | null;
  typeContrat: TypeContrat | null;
};

export type OfferExtractionContext = {
  text: string;
  lines: string[];
  isFranceTravailOffer: boolean;
  isLinkedInOffer: boolean;
  linkedInHeader: LinkedInHeader | null;
};

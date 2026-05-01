import type {
  SourceCandidature,
  Statut,
  StatutSuivi,
  Teletravail,
  TypeContrat,
} from "./candidature";

export type AddCandidatureFormData = {
  entreprise: string;
  poste: string;
  lienOffre: string;
  localisation: string;
  typeContrat: TypeContrat;
  teletravail: Teletravail;
  dateCandidature: string;
  source: SourceCandidature;
  notePersonnelle: number;
  statutSuivi: StatutSuivi;
  statut: Statut;
  salaireOuFourchette: string;
  notes: string;
  competences: string;
};

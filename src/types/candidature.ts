export type Statut =
  | "a_postuler"
  | "cv_envoye"
  | "entretien_rh"
  | "entretien_technique"
  | "attente_reponse"
  | "refus"
  | "offre";

export type StatutSuivi = "en_cours" | "terminee";

export type Priorite = "basse" | "normale" | "haute";

export type TypeContrat =
  | "cdi"
  | "cdd"
  | "alternance"
  | "stage"
  | "freelance"
  | "autre";

export type Teletravail = "oui" | "non" | "hybride" | "inconnu";

export type SourceCandidature =
  | "linkedin"
  | "indeed"
  | "welcome_to_the_jungle"
  | "hellowork"
  | "site_entreprise"
  | "autre";

export type Candidature = {
  id: string;
  entreprise: string;
  poste: string;
  lienOffre?: string;
  statut: Statut;
  statutSuivi?: StatutSuivi;
  dateCandidature?: string;
  priorite?: Priorite;
  notes?: string;
  localisation?: string;
  typeContrat?: TypeContrat;
  teletravail?: Teletravail;
  source?: SourceCandidature;
  notePersonnelle?: number; // 1–5
  salaireOuFourchette?: string;
  createdAt?: string; // ISO date from DB
};

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
  /** Compétences / mots-clés (ex. React, TypeScript, gestion de projet) */
  competences?: string;
  createdAt?: string; // ISO date from DB
  /** Date de passage en statut « CV envoyé » (ISO), pour afficher la temporalité */
  cvEnvoyeAt?: string;
  /** Date de passage en statut « Entretien RH » (ISO) */
  entretienRhAt?: string;
  /** Date de passage en statut « Entretien technique » (ISO) */
  entretienTechniqueAt?: string;
  /** Date de passage en statut « Attente de réponse » (ISO) */
  attenteReponseAt?: string;
  /** Date de passage en statut « Refus » (ISO) */
  refusAt?: string;
};

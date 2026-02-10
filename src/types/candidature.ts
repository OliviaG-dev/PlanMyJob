export type Statut =
  | "a_postuler"
  | "cv_envoye"
  | "entretien_rh"
  | "entretien_technique"
  | "attente_reponse"
  | "refus"
  | "offre";

export type Priorite = "basse" | "normale" | "haute";

export type Candidature = {
  id: string;
  entreprise: string;
  poste: string;
  lienOffre?: string;
  statut: Statut;
  dateCandidature?: string;
  priorite: Priorite;
  notes?: string;
};

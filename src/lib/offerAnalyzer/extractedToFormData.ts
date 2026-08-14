import type { AddCandidatureFormData } from "../../types/candidatureForm.types";
import type { ExtractedOffer } from "./types";

export function extractedToFormData(
  ext: ExtractedOffer,
): AddCandidatureFormData {
  return {
    entreprise: ext.entreprise,
    poste: ext.poste,
    lienOffre: ext.lienCandidature,
    localisation: ext.localisation,
    typeContrat: ext.typeContrat,
    teletravail: ext.teletravail,
    dateCandidature: new Date().toISOString().slice(0, 10),
    source: ext.source,
    notePersonnelle: 3,
    statutSuivi: "en_cours",
    statut: "cv_envoye",
    salaireOuFourchette: ext.salaireOuFourchette,
    notes: ext.pointsCles.length > 0 ? ext.pointsCles.join("\n• ") : "",
    competences: ext.competences.length > 0 ? ext.competences.join(", ") : "",
  };
}

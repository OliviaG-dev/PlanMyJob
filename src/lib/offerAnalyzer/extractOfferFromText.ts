import { extractCompanyFromEmployeur, extractCompanyFromPatterns } from "./extractCompany";
import { extractTypeContrat, extractTeletravail } from "./extractContract";
import { extractExperience } from "./extractExperience";
import { extractKeyPoints } from "./extractKeyPoints";
import { extractLocation, extractLocationFromLines } from "./extractLocation";
import {
  extractPosteFromFallbackLines,
  extractPosteFromPatterns,
  extractPosteWhenCompanyIsFirstLine,
} from "./extractPoste";
import { extractApplicationUrl, extractSalary } from "./extractSalary";
import { extractSkills } from "./extractSkills";
import { isFranceTravailOffer, resolveSource } from "./inferSource";
import { isLinkedInJobPaste, parseLinkedInHeader } from "./linkedInParser";
import type { ExtractedOffer } from "./types";
import {
  isEntrepriseFieldHeader,
  looksLikeCompany,
  looksLikeJobTitle,
  looksLikeLocationValue,
  isRecruitmentSentence,
  stripJobPostSuffix,
} from "./textHelpers";

export function extractOfferFromText(raw: string): ExtractedOffer {
  const text = raw.trim();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let poste = "";
  let entreprise = "";
  let localisation = "";

  const franceTravailOffer = isFranceTravailOffer(text, lines);
  const linkedInOffer = isLinkedInJobPaste(text);
  let linkedInTeletravail = null;
  let linkedInTypeContrat = null;
  let linkedInHeader = null;

  if (linkedInOffer) {
    linkedInHeader = parseLinkedInHeader(lines);
    if (linkedInHeader.poste) poste = linkedInHeader.poste;
    if (linkedInHeader.entreprise) entreprise = linkedInHeader.entreprise;
    if (linkedInHeader.localisation) localisation = linkedInHeader.localisation;
    linkedInTeletravail = linkedInHeader.teletravail;
    linkedInTypeContrat = linkedInHeader.typeContrat;
  }

  if (
    lines.length >= 2 &&
    !franceTravailOffer &&
    !linkedInOffer &&
    looksLikeJobTitle(lines[0]) &&
    !isRecruitmentSentence(lines[0]) &&
    looksLikeCompany(lines[1]) &&
    !looksLikeLocationValue(lines[1]) &&
    !isEntrepriseFieldHeader(lines[1])
  ) {
    poste = stripJobPostSuffix(lines[0]);
    entreprise = lines[1];
  }

  if (
    !poste &&
    franceTravailOffer &&
    /^offre\s*n[°o]/i.test(lines[0] ?? "") &&
    lines[1] &&
    looksLikeJobTitle(lines[1])
  ) {
    poste = stripJobPostSuffix(lines[1]);
  }

  if (!localisation) {
    localisation = extractLocationFromLines(lines);
  }

  if (!poste) {
    poste = extractPosteFromPatterns(text);
    if (!poste) {
      poste = extractPosteFromFallbackLines(lines);
    }
  }

  if (!entreprise || franceTravailOffer) {
    const fromEmployeur = extractCompanyFromEmployeur(text, lines);
    if (fromEmployeur) entreprise = fromEmployeur;
  }

  if (!entreprise) {
    entreprise = extractCompanyFromPatterns(
      text,
      lines,
      franceTravailOffer,
      poste,
    );
  }

  if (!poste || !entreprise) {
    const fromCompanyFirst = extractPosteWhenCompanyIsFirstLine(lines, poste);
    if (!poste && fromCompanyFirst.poste) poste = fromCompanyFirst.poste;
    if (!entreprise && fromCompanyFirst.entreprise) {
      entreprise = fromCompanyFirst.entreprise;
    }
  }

  const typeContrat = extractTypeContrat(text, linkedInTypeContrat);
  const teletravail = extractTeletravail(text, linkedInTeletravail);

  if (!localisation) {
    localisation = extractLocation({ text, lines, linkedInHeader });
  }

  const experienceYears = extractExperience(text);
  const competences = extractSkills(text);
  const pointsCles = extractKeyPoints(text, lines, entreprise);
  const salaireOuFourchette = extractSalary(text);
  const lienCandidature = extractApplicationUrl(text);
  const source = resolveSource(text, lienCandidature);

  return {
    poste,
    entreprise,
    typeContrat,
    teletravail,
    source,
    localisation,
    experienceYears,
    competences,
    pointsCles,
    salaireOuFourchette,
    lienCandidature,
  };
}

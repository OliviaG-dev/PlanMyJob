import { isLinkedInNoiseLine } from "./linkedInParser";
import {
  isRecruitmentSentence,
  looksLikeCompany,
  normalizePosteCandidate,
  stripJobPostSuffix,
} from "./textHelpers";

export function extractPosteFromPatterns(text: string): string {
  const postePatterns = [
    /(?:poste|intitulé du poste|titre du poste)\s*[:-]\s*([^\n]+?)(?:\s*$|\n)(?!.*restaurant)/i,
    /(?:intitulé|titre)\s*[:-]\s*([^\n]+?)(?:\s*$|\n)(?!.*restaurant)/i,
    /(?:nous\s+)?(?:recherchons?|recrutons?|recherche)(?:\s+\w+){0,3}\s+(?:un|une|un\/une|un\(e\))\s+([^\n]+?)(?:\s+qui\b|\s+pour\b|\s*[:.,]|$)/i,
    /(?:recherchons?|recrutons?|recherche)\s+(?:un|une|un\/une|un\(e\))\s+([^\n(]+?)(?:\s*\(|$|\n)/i,
    /(?:pour le poste de|poste de|pour le rôle de|rôle de)\s+([^\n.,]+)/i,
    /(?:en tant que|en tant qu')\s+(?:développeur|ingénieur|designer|consultant)[^\n.,]*?(?:\s*$|\n|\.|,)/i,
    /(?:candidat(e)?\s+pour\s+)?(?:le\s+)?poste\s*[:-]\s*([^\n]+)/i,
    /(?:nous\s+)?recrutons?\s+[^\n]*?\s+([A-ZÀ-Ÿa-zà-ÿ0-9\s&'-]+?)(?:\s*\(|\n|\.|,|pour)/i,
  ];

  for (const re of postePatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const val = normalizePosteCandidate(m[1].trim());
      if (
        val.length > 1 &&
        val.length < 150 &&
        !/^(titre|restaurant|participation)/i.test(val)
      ) {
        return val;
      }
    }
  }
  return "";
}

export function extractPosteFromFallbackLines(lines: string[]): string {
  const urlRe = /^https?:\/\//i;
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    if (!urlRe.test(line) && line.length >= 2 && line.length <= 120) {
      if (
        !/^(bonjour|madame|monsieur|objet|ref\.?|candidature|titre\s|participation)/i.test(
          line,
        ) &&
        !isRecruitmentSentence(line) &&
        !isLinkedInNoiseLine(line) &&
        !/^logo de l['']entreprise/i.test(line) &&
        !/restaurant|€|par mois/i.test(line)
      ) {
        return stripJobPostSuffix(line);
      }
    }
  }
  return "";
}

export function extractPosteWhenCompanyIsFirstLine(
  lines: string[],
  poste: string,
): { poste: string; entreprise: string } {
  if (
    !poste &&
    lines.length >= 2 &&
    looksLikeCompany(lines[0]) &&
    lines[1]
  ) {
    return {
      entreprise: lines[0],
      poste: stripJobPostSuffix(lines[1]),
    };
  }
  return { poste, entreprise: "" };
}

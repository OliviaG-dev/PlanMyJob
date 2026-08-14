import {
  isEntrepriseFieldHeader,
  looksLikeCompany,
  looksLikeLocationValue,
} from "./textHelpers";

export function extractCompanyFromEmployeur(
  text: string,
  lines: string[],
): string {
  const employeurInlineMatch = text.match(
    /(?:^|\n)\s*employeur\s*[:-]\s*([^\n]+?)\s*(?:$|\n)/i,
  );
  if (employeurInlineMatch?.[1]) {
    const candidate = employeurInlineMatch[1].trim();
    if (
      looksLikeCompany(candidate) &&
      !looksLikeLocationValue(candidate) &&
      !isEntrepriseFieldHeader(candidate)
    ) {
      return candidate;
    }
  }

  const employeurLineIndex = lines.findIndex((line) =>
    /^employeur(?:\s*[:-]\s*)?$/i.test(line),
  );
  if (employeurLineIndex >= 0 && lines[employeurLineIndex + 1]) {
    const candidate = lines[employeurLineIndex + 1]
      .replace(/\s*-\s*\d+\s+à\s+\d+\s+salari[ée]s?.*$/i, "")
      .trim();
    if (
      looksLikeCompany(candidate) &&
      !looksLikeLocationValue(candidate) &&
      !isEntrepriseFieldHeader(candidate)
    ) {
      return candidate;
    }
  }

  return "";
}

export function extractCompanyFromPatterns(
  text: string,
  lines: string[],
  isFranceTravailOffer: boolean,
  poste: string,
): string {
  const entreprisePatterns = [
    /(?:chez|au sein de)\s+([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9&\s'.-]{1,80}?)(?:\s*,|\s*$|\n|nous|pour|\.)/i,
    /(?:société|entreprise|company|structure|groupe)\s*[:-]\s*([^\n]+?)(?:\s*$|\n)/i,
    /(?:rejoignez?|rejoindre)\s+([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9&\s'.-]{1,80}?)(?:\s*!|\.|\s*$|\n|,)/i,
    /([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9&\s'.-]{2,60}?)\s+recrute\s+/i,
    /(?:^|\n)\s*([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9& .'-]{2,60}?)\s+recherche(?:\s+actuellement)?\s+/i,
    /([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9&\s'.-]{2,60}?)\s+(?:est|s'est)\s+à la recherche/i,
    /(?:candidature|postuler)\s+chez\s+([^\n,]+?)(?:\s*$|\n|,)/i,
  ];

  for (const re of entreprisePatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const val = m[1].trim();
      if (
        val.length > 1 &&
        val.length < 100 &&
        !/^(nos|notre)\s+(produits?|équipes?)/i.test(val) &&
        !/€|par mois/i.test(val)
      ) {
        return val;
      }
    }
  }

  if (
    !isFranceTravailOffer &&
    lines.length >= 2 &&
    looksLikeCompany(lines[1])
  ) {
    return lines[1];
  }

  if (lines.length >= 2 && looksLikeCompany(lines[0]) && !poste) {
    return lines[0];
  }

  return "";
}

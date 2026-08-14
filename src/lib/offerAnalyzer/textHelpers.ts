export function normalizePosteCandidate(value: string): string {
  return value
    .replace(/\s+qui\s+.*$/i, "")
    .replace(/\s+afin\s+de\s+.*$/i, "")
    .replace(/\s*[:;,]\s*$/, "")
    .trim();
}

export function looksLikeJobTitle(s: string): boolean {
  return (
    s.length >= 2 &&
    s.length <= 100 &&
    !/^https?:\/\//i.test(s) &&
    !/^logo de l['']entreprise/i.test(s) &&
    !/€|par mois|Route|rue\s|avenue\s|Détails\s+de/i.test(s) &&
    (/d[eé]veloppeur|ing[eé]nieur|engineer|developer|manager|designer|consultant|technicien|full[\s-]?stack|software|architect|lead|H\/F|h\/f|F\/H|f\/h|react\s+native/i.test(
      s,
    ) ||
      s.length <= 50)
  );
}

export function isRecruitmentSentence(s: string): boolean {
  return /^(?:nous\s+)?(?:recherchons?|recrutons?|recherche)\b/i.test(
    s.trim(),
  );
}

export function looksLikeCompany(s: string): boolean {
  return (
    s.length >= 2 &&
    s.length <= 70 &&
    !/^[\d.]+\s*(\/\s*\d+)?\s*(étoiles?)?$/i.test(s) &&
    !/€|par mois|Route|rue\s|avenue\s|\d{5}|Détails|Type\s+d'emploi/i.test(s) &&
    !/^(nos|notre)\s+(produits?|équipes?|société|entreprise)/i.test(s)
  );
}

export function looksLikeAddress(s: string): boolean {
  return (
    /^\d+\s*(?:Route|rue|avenue|av\.|boulevard|bd|place|allée)/i.test(s) &&
    /\d{5}\s+[A-Za-zÀ-ÿ-]+/.test(s)
  );
}

export function looksLikeCityDept(s: string): boolean {
  return /^[A-Za-zÀ-ÿ-]+\s*\(\d{2}\)$/.test(s) && s.length <= 50;
}

export function looksLikeCityDashDept(s: string): boolean {
  return /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,60}\s*[-–]\s*(?:\d{2}|2A|2B|97\d)\b/.test(
    s,
  );
}

export function looksLikeDeptCity(s: string): boolean {
  return /^(?:\d{2}|2A|2B|97\d)\s*[-–]\s*[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,80}/.test(s);
}

export function looksLikeLocationValue(s: string): boolean {
  return (
    looksLikeAddress(s) ||
    looksLikeCityDept(s) ||
    looksLikeCityDashDept(s) ||
    looksLikeDeptCity(s) ||
    /localiser|mappy/i.test(s)
  );
}

export function isEntrepriseFieldHeader(s: string): boolean {
  return /^(type de contrat|salaire|exp[ée]rience|description|comp[ée]tences?|lieu|localisation)\b/i.test(
    s,
  );
}

export function isRatingLine(s: string): boolean {
  return (
    /^[\d.]+\s*(\/\s*\d+)?\s*(étoiles?)?$/i.test(s.trim()) ||
    /^\d\.\d$/.test(s.trim())
  );
}

export function stripJobPostSuffix(line: string): string {
  return line.replace(/\s*[-–]\s*job post\s*$/i, "").trim();
}

export function extractSalary(text: string): string {
  const textWithoutOfferReference = text.replace(
    /^\s*offre\s*n[°o]\s*[^\n]*$/gim,
    "",
  );
  const salMatch =
    textWithoutOfferReference.match(
      /((?:mensuel|annuel)\s+de\s+\d+(?:[.,]\d+)?\s*(?:€|euros?)\s+[àa]\s+\d+(?:[.,]\d+)?\s*(?:€|euros?)(?:\s+sur\s+\d+\s+mois)?)/i,
    ) ??
    textWithoutOfferReference.match(
      /((?:cachet|salaire(?:\s+brut)?)\s+de\s+\d+(?:[.,]\d+)?\s*(?:€|euros?)\s+[àa]\s+\d+(?:[.,]\d+)?\s*(?:€|euros?)(?:\s+sur\s+\d+\s+mois)?)/i,
    ) ??
    textWithoutOfferReference.match(
      /((?:\d{1,3}(?:[ \u00A0\u202F]\d{3})+|\d{2,3}\s*k)\s*(?:€|euros?)?\s*(?:[-–à]\s*(?:\d{1,3}(?:[ \u00A0\u202F]\d{3})+|\d{2,3}\s*k)\s*(?:€|euros?)?)\s*(?:\/\s*(?:an|mois)|annuel|brut)?)/i,
    ) ??
    textWithoutOfferReference.match(
      /(?:salaire|rémunération|rémuneration|fourchette)\s*[:-]?\s*([^\n]+?)(?:\s*€|$)/i,
    ) ??
    textWithoutOfferReference.match(
      /(\d[\d\s]*(?:k|000)?\s*€?\s*(?:-\s*\d[\d\s]*(?:k|000)?\s*€?)?)/,
    );

  if (!salMatch?.[1]) return "";

  const raw = salMatch[1].trim();
  const numMatch = raw.match(/(\d[\d\s]*)/);
  const firstNum = numMatch ? parseInt(numMatch[1].replace(/\s/g, ""), 10) : 0;
  if (
    raw.includes("€") ||
    raw.includes("k") ||
    raw.includes("000") ||
    firstNum >= 1000
  ) {
    return raw;
  }
  return "";
}

export function extractApplicationUrl(text: string): string {
  const urlMatch = text.match(/https?:\/\/[^\s<>"']+/);
  return urlMatch ? urlMatch[0] : "";
}

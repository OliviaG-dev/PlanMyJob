import type { LinkedInHeader } from "./types";
import {
  looksLikeAddress,
  looksLikeCityDashDept,
  looksLikeCityDept,
  looksLikeDeptCity,
} from "./textHelpers";

type ExtractLocationParams = {
  text: string;
  lines: string[];
  linkedInHeader: LinkedInHeader | null;
};

export function extractLocationFromLines(lines: string[]): string {
  if (lines.length >= 3 && looksLikeAddress(lines[2])) {
    return lines[2];
  }
  if (lines.some(looksLikeCityDept)) {
    const cityLine = lines.find(looksLikeCityDept);
    if (cityLine) return cityLine;
  }
  if (lines.some(looksLikeCityDashDept)) {
    const cityDashLine = lines.find(looksLikeCityDashDept);
    if (cityDashLine) return cityDashLine;
  }
  if (lines.some(looksLikeDeptCity)) {
    const deptCityLine = lines.find(looksLikeDeptCity);
    if (deptCityLine) {
      return deptCityLine.replace(/\s*[-–]\s*Localiser.*$/i, "").trim();
    }
  }
  return "";
}

export function extractLocation({
  text,
  lines,
  linkedInHeader,
}: ExtractLocationParams): string {
  const fromLinkedIn = linkedInHeader?.localisation ?? "";
  const fromLines = extractLocationFromLines(lines);
  if (fromLinkedIn || fromLines) return fromLinkedIn || fromLines;

  const linkedInLocMatch = text.match(
    /^(.+?)\s·\s*il y a \d+\s+(?:jour|semaine|mois|heure)/im,
  );
  if (linkedInLocMatch?.[1]) {
    const val = linkedInLocMatch[1].trim();
    if (val.length >= 2 && val.length < 120) return val;
  }

  const addrLine = lines.find((l) => looksLikeAddress(l));
  if (addrLine) return addrLine;

  const addrMatch = text.match(
    /(\d+\s*(?:Route|rue|avenue|av\.|boulevard|bd|place|allée)\s+[^\n]+?\d{5}\s+[A-Za-zÀ-ÿ-]+)/i,
  );
  if (addrMatch && !/€|par mois|Détails/i.test(addrMatch[1])) {
    return addrMatch[1].trim();
  }

  const locMatch = text.match(
    /(?:localisation|lieu du poste|ville)\s*[:-]\s*([^\n]+?)(?:\s*$|\n)/i,
  );
  if (locMatch?.[1]) {
    const val = locMatch[1].trim();
    if (
      !/€|par mois|Détails de l'emploi|CDI\s*Détails/i.test(val) &&
      val.length < 120
    ) {
      return val;
    }
  }

  const genericLoc = text.match(/(?:lieu|localisation)\s*[:-]\s*([^\n.,]+)/i);
  if (genericLoc?.[1]) {
    const val = genericLoc[1].trim();
    if (!/€|par mois|Détails/i.test(val) && val.length < 100) return val;
  }

  const cityDeptMatch = text.match(/\b([A-Za-zÀ-ÿ-]+\s*\(\d{2}\))\b/);
  if (cityDeptMatch && !/€|par mois|Détails/i.test(cityDeptMatch[1])) {
    return cityDeptMatch[1].trim();
  }

  const cityDashMatch = text.match(
    /\b([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,60}\s*[-–]\s*(?:\d{2}|2A|2B|97\d))\b/,
  );
  if (cityDashMatch && !/€|par mois|Détails/i.test(cityDashMatch[1])) {
    return cityDashMatch[1].trim();
  }

  const deptCityMatch = text.match(
    /\b((?:\d{2}|2A|2B|97\d)\s*[-–]\s*[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,80})\b/i,
  );
  if (deptCityMatch && !/€|par mois|Détails/i.test(deptCityMatch[1])) {
    return deptCityMatch[1]
      .replace(/\s*[-–]\s*Localiser.*$/i, "")
      .trim();
  }

  return "";
}

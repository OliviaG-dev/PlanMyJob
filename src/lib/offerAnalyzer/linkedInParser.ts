import { LINKEDIN_NOISE_LINE } from "./constants";
import { inferSourceFromText } from "./inferSource";
import type { LinkedInHeader } from "./types";
import type { Teletravail, TypeContrat } from "../../types/candidature";
import {
  isRecruitmentSentence,
  looksLikeJobTitle,
} from "./textHelpers";

export function isLinkedInJobPaste(text: string): boolean {
  return (
    inferSourceFromText(text) === "linkedin" ||
    /logo de l['']entreprise/i.test(text) ||
    /personnes ont cliqu[eé] sur postuler/i.test(text) ||
    /\s·\s*il y a \d+\s+(?:jour|semaine|mois|heure)/i.test(text)
  );
}

export function isLinkedInNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    LINKEDIN_NOISE_LINE.test(trimmed) ||
    /^(?:hybride|temps plein|temps partiel|[àa] distance|sur site|t[eé]l[eé]travail|remote)$/i.test(
      trimmed,
    ) ||
    /\s·\s*il y a \d+/i.test(trimmed)
  );
}

export function parseLinkedInHeader(lines: string[]): LinkedInHeader {
  let entreprise = "";
  let poste = "";
  let localisation = "";
  let teletravail: Teletravail | null = null;
  let typeContrat: TypeContrat | null = null;

  const logoLine = lines.find((line) =>
    /^logo de l['']entreprise/i.test(line),
  );
  if (logoLine) {
    const logoMatch = logoLine.match(
      /^logo de l['']entreprise,\s*(.+?)\.?\s*$/i,
    );
    if (logoMatch?.[1]) entreprise = logoMatch[1].trim();
  }

  const locationLine = lines.find((line) => /\s·\s*il y a \d+/i.test(line));
  if (locationLine) {
    localisation = locationLine.split(/\s·\s*il y a/i)[0]?.trim() ?? "";
  }

  for (const line of lines.slice(0, 35)) {
    const trimmed = line.trim();
    if (/^hybride$/i.test(trimmed)) teletravail = "hybride";
    else if (
      /^(?:[àa] distance|t[eé]l[eé]travail|100\s*%\s*remote|remote)$/i.test(
        trimmed,
      )
    )
      teletravail = "oui";
    else if (/^(?:sur site|pr[eé]sentiel)$/i.test(trimmed)) teletravail = "non";
    else if (/^temps plein$/i.test(trimmed)) typeContrat = "cdi";
  }

  if (!entreprise) {
    const companyAfterLogo = lines.find(
      (line, index) =>
        index > 0 &&
        index < 8 &&
        /^logo de l['']entreprise/i.test(lines[index - 1] ?? "") &&
        line.length >= 2 &&
        line.length <= 70 &&
        !isLinkedInNoiseLine(line),
    );
    if (companyAfterLogo) entreprise = companyAfterLogo.trim();
  }

  const skipForPoste = (line: string) =>
    isLinkedInNoiseLine(line) ||
    /^logo de l['']entreprise/i.test(line) ||
    (entreprise !== "" && line.trim() === entreprise) ||
    line.trim() === localisation;

  for (const line of lines) {
    if (skipForPoste(line)) continue;
    if (looksLikeJobTitle(line) && !isRecruitmentSentence(line)) {
      poste = line.replace(/\s*[-–]\s*job post\s*$/i, "").trim();
      break;
    }
  }

  return { poste, entreprise, localisation, teletravail, typeContrat };
}

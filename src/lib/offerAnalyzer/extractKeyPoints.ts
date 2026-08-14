import { LINKEDIN_MARKETING_LINE, SECTION_HEADERS } from "./constants";
import { isLinkedInNoiseLine } from "./linkedInParser";
import { isRatingLine } from "./textHelpers";

export function extractKeyPoints(
  text: string,
  lines: string[],
  entreprise: string,
): string[] {
  const pointsCles: string[] = [];

  const secteurMatch = text.match(
    /\bSecteur\s*(?:d'activité|de l'emploi|d'emploi)?\s*[:-]\s*([^\n]+?)(?:\s*$|\n)/i,
  );
  if (secteurMatch?.[1]) {
    const secteur = secteurMatch[1].trim();
    if (secteur.length >= 2 && secteur.length < 150) {
      pointsCles.push(`Secteur : ${secteur}`);
    }
  }

  let inAvantages = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (/avantages|extraits de la description complète du poste/i.test(lower)) {
      inAvantages = true;
      continue;
    }
    if (inAvantages) {
      if (SECTION_HEADERS.test(line) && !/avantages|extraits/i.test(lower)) {
        break;
      }
      let bullet = line.replace(/^[\s•*-]\s*/, "").trim();
      bullet = bullet.replace(/\s*Détails de l'emploi\s*/gi, "").trim();
      if (
        !isRatingLine(bullet) &&
        !isLinkedInNoiseLine(bullet) &&
        !LINKEDIN_MARKETING_LINE.test(bullet) &&
        bullet !== entreprise &&
        bullet.length >= 2 &&
        bullet.length < 200 &&
        bullet !== "&nbsp;" &&
        !pointsCles.includes(bullet)
      ) {
        pointsCles.push(bullet);
      }
    }
  }

  for (const line of lines) {
    if (pointsCles.length >= 8) break;
    let bullet = line.replace(/^[\s•*-]\s*/, "").trim();
    bullet = bullet.replace(/\s*Détails de l'emploi\s*/gi, "").trim();
    if (
      isRatingLine(bullet) ||
      bullet === "&nbsp;" ||
      bullet === entreprise ||
      isLinkedInNoiseLine(bullet) ||
      LINKEDIN_MARKETING_LINE.test(bullet) ||
      /^[\d.]+\s*\/\s*\d+/i.test(bullet)
    ) {
      continue;
    }
    if (
      bullet.length >= 2 &&
      bullet.length < 200 &&
      !pointsCles.includes(bullet)
    ) {
      pointsCles.push(bullet);
    }
  }

  return pointsCles;
}

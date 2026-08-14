import {
  KNOWN_STACK_KEYWORDS,
  KNOWN_STACK_KEYWORDS_MULTI,
  LINKEDIN_MARKETING_LINE,
} from "./constants";

export function extractSkills(text: string): string[] {
  const competences: string[] = [];
  const textForCompetences = text
    .split(/\r?\n/)
    .filter((line) => !LINKEDIN_MARKETING_LINE.test(line))
    .join("\n");
  const normalized = textForCompetences
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const phrase of KNOWN_STACK_KEYWORDS_MULTI) {
    const re = new RegExp(`\\b${phrase.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (re.test(normalized)) competences.push(phrase);
  }
  for (const kw of KNOWN_STACK_KEYWORDS) {
    if (competences.includes("react native") && kw === "react") continue;
    if (new RegExp(`\\b${kw}\\b`, "i").test(normalized)) competences.push(kw);
  }

  return competences;
}

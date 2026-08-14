import type { SourceCandidature } from "../../types/candidature";
import { SOURCE_BY_HOST } from "./constants";

export function inferSourceFromUrl(url: string): SourceCandidature {
  if (!url) return "autre";

  const cleaned = url.trim().replace(/[),.;!?]+$/g, "");
  const candidates = /^https?:\/\//i.test(cleaned)
    ? [cleaned]
    : [cleaned, `https://${cleaned}`];

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
      for (const entry of SOURCE_BY_HOST) {
        if (entry.hosts.some((knownHost) => host.includes(knownHost))) {
          return entry.source;
        }
      }
    } catch {
      // L'URL peut être incomplète ou mal formée.
    }
  }

  const fallback = cleaned.toLowerCase();
  for (const entry of SOURCE_BY_HOST) {
    if (entry.hosts.some((knownHost) => fallback.includes(knownHost))) {
      return entry.source;
    }
  }

  return "autre";
}

export function inferSourceFromText(text: string): SourceCandidature {
  const lower = text.toLowerCase();
  if (/\bhello\s*work\b|\bhellowork\b/.test(lower)) return "hellowork";
  if (/\blinkedin\b/.test(lower)) return "linkedin";
  if (/\bindeed\b/.test(lower)) return "indeed";
  if (/\bfrance\s*travail\b|\bpole\s*emploi\b/.test(lower))
    return "france_travail";
  if (/\bwelcome\s*to\s*the\s*jungle\b/.test(lower))
    return "welcome_to_the_jungle";
  if (/\bsite\s+(?:de\s+)?l['']entreprise\b|\bcarri[eè]res?\b/.test(lower))
    return "site_entreprise";
  return "autre";
}

export function resolveSource(
  text: string,
  lienCandidature: string,
): SourceCandidature {
  const sourceFromUrl = inferSourceFromUrl(lienCandidature);
  return sourceFromUrl === "autre" ? inferSourceFromText(text) : sourceFromUrl;
}

export function isFranceTravailOffer(text: string, lines: string[]): boolean {
  return (
    inferSourceFromText(text) === "france_travail" ||
    lines.some((line) => /^offre\s*n[°o]/i.test(line))
  );
}

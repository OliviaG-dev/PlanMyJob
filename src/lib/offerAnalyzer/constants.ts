import type { SourceCandidature, Teletravail, TypeContrat } from "../../types/candidature";

export const SOURCE_BY_HOST: { source: SourceCandidature; hosts: string[] }[] = [
  { source: "linkedin", hosts: ["linkedin.com"] },
  { source: "indeed", hosts: ["indeed.", "smartapply.indeed.com"] },
  {
    source: "france_travail",
    hosts: ["francetravail.fr", "pole-emploi.fr", "candidat.pole-emploi.fr"],
  },
  {
    source: "welcome_to_the_jungle",
    hosts: ["welcometothejungle.com", "welcome-to-the-jungle.com"],
  },
  { source: "hellowork", hosts: ["hellowork.com"] },
];

export const KNOWN_STACK_KEYWORDS = [
  "react",
  "vue",
  "vuejs",
  "angular",
  "svelte",
  "next.js",
  "nuxt",
  "typescript",
  "javascript",
  "node",
  "node.js",
  "express",
  "nest",
  "nestjs",
  "python",
  "django",
  "flask",
  "fastapi",
  "sql",
  "nosql",
  "mongodb",
  "postgresql",
  "mysql",
  "redis",
  "rabbitmq",
  "elasticsearch",
  "graphql",
  "rest",
  "api",
  "html",
  "css",
  "sass",
  "scss",
  "tailwind",
  "bootstrap",
  "webpack",
  "vite",
  "jest",
  "cypress",
  "playwright",
  "kubernetes",
  "k8s",
  "terraform",
  "jenkins",
  "gitlab",
  "github",
  "azure",
  "gcp",
  "IA",
  "AI",
  "wordpress",
  "prestashop",
  "php",
  "java",
  "kotlin",
  "swift",
  "go",
  "golang",
  "rust",
  "c#",
  ".net",
  "docker",
  "aws",
  "figma",
  "excel",
  "mobile",
];

export const KNOWN_STACK_KEYWORDS_MULTI = ["react native"];

/** Liste de toutes les compétences pour les selects (badges) — multi d'abord pour tri cohérent. */
export const COMPETENCES_OPTIONS = [
  ...KNOWN_STACK_KEYWORDS_MULTI,
  ...KNOWN_STACK_KEYWORDS,
].sort((a, b) => a.localeCompare(b, "fr"));

export const CONTRAT_PATTERNS: { pattern: RegExp; value: TypeContrat }[] = [
  { pattern: /\bCDI\b/i, value: "cdi" },
  { pattern: /\bCDD\b/i, value: "cdd" },
  { pattern: /\balternance\b/i, value: "alternance" },
  { pattern: /\bstage\b/i, value: "stage" },
  { pattern: /\bfreelance\b/i, value: "freelance" },
  { pattern: /\bportage\b/i, value: "freelance" },
];

export const TELETRAVAIL_PATTERNS: { pattern: RegExp; value: Teletravail }[] = [
  { pattern: /\bhybride\b/i, value: "hybride" },
  {
    pattern: /\bremote\s+tr[eè]s\s+flexible\b/i,
    value: "hybride",
  },
  {
    pattern: /\b(100%|totalement)\s*(remote|télétravail|teletravail)/i,
    value: "oui",
  },
  {
    pattern:
      /\b(remote|télétravail|teletravail|distanciel)\s*(?:possible|autorisé|oui)?/i,
    value: "oui",
  },
  { pattern: /\b(présentiel|sur site|sur site uniquement)\b/i, value: "non" },
];

export const LINKEDIN_NOISE_LINE =
  /^(?:logo de l['']entreprise|postuler|enregistrer|envoyer un message|essayer premium|afficher les|d[eé]couvrez comment|acc[eé]dez [àa]|personnes que vous|rencontrez l[''][eé]quipe|auteur de l['']offre|[àa] propos de l['']offre|promue par|r[eé]ponses g[eé]r[eé]es|utilisez l['']ia|obtenez des conseils)/i;

export const LINKEDIN_MARKETING_LINE =
  /premium|utilisez l['']ia|conseils g[eé]n[eé]r[eé]s par l['']ia|[eé]valuer si votre profil|fonctionnalit[eé]s exclusives/i;

export const DAILY_RATE_PATTERN =
  /\bTJM\b|\btarif\s+journalier\b|\b\d+(?:[.,]\d+)?\s*€?\s*(?:\/|par)\s*jour\b|\b\d+\s*€?\s*\/\s*j\b/i;

export const SECTION_HEADERS =
  /^(Description|Lieu|Qualités|Fonctions|Avantages|Type d'emploi|Rémunération|Horaires|Lieu du poste)\s*[:\s]|^&nbsp;$/i;

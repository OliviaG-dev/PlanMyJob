import type { TypeContrat, Teletravail } from "../types/candidature";
import type { AddCandidatureFormData } from "../pages/Candidatures/AddCandidatureModal";

export type ExtractedOffer = {
  poste: string;
  entreprise: string;
  typeContrat: TypeContrat;
  teletravail: Teletravail;
  localisation: string;
  experienceYears: string;
  competences: string[];
  pointsCles: string[];
  salaireOuFourchette: string;
  lienCandidature: string;
};

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

const KNOWN_STACK_KEYWORDS_MULTI = ["react native"];

/** Liste de toutes les compétences pour les selects (badges) — multi d’abord pour tri cohérent. */
export const COMPETENCES_OPTIONS = [
  ...KNOWN_STACK_KEYWORDS_MULTI,
  ...KNOWN_STACK_KEYWORDS,
].sort((a, b) => a.localeCompare(b, "fr"));

const CONTRAT_PATTERNS: { pattern: RegExp; value: TypeContrat }[] = [
  { pattern: /\bCDI\b/i, value: "cdi" },
  { pattern: /\bCDD\b/i, value: "cdd" },
  { pattern: /\balternance\b/i, value: "alternance" },
  { pattern: /\bstage\b/i, value: "stage" },
  { pattern: /\bfreelance\b/i, value: "freelance" },
  { pattern: /\bportage\b/i, value: "freelance" },
];

const TELETRAVAIL_PATTERNS: { pattern: RegExp; value: Teletravail }[] = [
  { pattern: /\b(100%|totalement)\s*(remote|télétravail|teletravail)/i, value: "oui" },
  { pattern: /\b(remote|télétravail|teletravail|distanciel)\s*(?:possible|autorisé|oui)?/i, value: "oui" },
  { pattern: /\bhybride\b/i, value: "hybride" },
  { pattern: /\b(présentiel|sur site|sur site uniquement)\b/i, value: "non" },
];

export function extractOfferFromText(raw: string): ExtractedOffer {
  const text = raw.trim();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let poste = "";
  let entreprise = "";
  let localisation = "";

  const looksLikeJobTitle = (s: string) =>
    s.length >= 2 &&
    s.length <= 100 &&
    !/^https?:\/\//i.test(s) &&
    !/€|par mois|Route|rue\s|avenue\s|Détails\s+de/i.test(s) &&
    (/développeur|ingénieur|manager|designer|consultant|technicien|H\/F|h\/f|F\/H|f\/h|react\s+native/i.test(s) || s.length <= 50);
  const looksLikeCompany = (s: string) =>
    s.length >= 2 &&
    s.length <= 70 &&
    !/^[\d.]+\s*(\/\s*\d+)?\s*(étoiles?)?$/i.test(s) &&
    !/€|par mois|Route|rue\s|avenue\s|\d{5}|Détails|Type\s+d'emploi/i.test(s) &&
    !/^(nos|notre)\s+(produits?|équipes?|société|entreprise)/i.test(s);
  const looksLikeAddress = (s: string) =>
    /^\d+\s*(?:Route|rue|avenue|av\.|boulevard|bd|place|allée)/i.test(s) && /\d{5}\s+[A-Za-zÀ-ÿ-]+/.test(s);
  const looksLikeCityDept = (s: string) =>
    /^[A-Za-zÀ-ÿ-]+\s*\(\d{2}\)$/.test(s) && s.length <= 50;

  if (lines.length >= 2 && looksLikeJobTitle(lines[0]) && looksLikeCompany(lines[1])) {
    poste = lines[0].replace(/\s*[-–]\s*job post\s*$/i, "").trim();
    entreprise = lines[1];
  }
  if (lines.length >= 3 && looksLikeAddress(lines[2]) && !localisation) {
    localisation = lines[2];
  }
  if (!localisation && lines.some(looksLikeCityDept)) {
    const cityLine = lines.find(looksLikeCityDept);
    if (cityLine) localisation = cityLine;
  }

  if (!poste) {
    const postePatterns = [
      /(?:poste|intitulé du poste|titre du poste)\s*[:-]\s*([^\n]+?)(?:\s*$|\n)(?!.*restaurant)/i,
      /(?:intitulé|titre)\s*[:-]\s*([^\n]+?)(?:\s*$|\n)(?!.*restaurant)/i,
      /(?:recherchons?|recrutons?|recherche)\s+(?:un|une|un\/une|un\(e\))\s+([^\n(]+?)(?:\s*\(|$|\n)/i,
      /(?:pour le poste de|poste de|pour le rôle de|rôle de)\s+([^\n.,]+)/i,
      /(?:en tant que|en tant qu')\s+(?:développeur|ingénieur|designer|consultant)[^\n.,]*?(?:\s*$|\n|\.|,)/i,
      /(?:candidat(e)?\s+pour\s+)?(?:le\s+)?poste\s*[:-]\s*([^\n]+)/i,
      /(?:nous\s+)?recrutons?\s+[^\n]*?\s+([A-ZÀ-Ÿa-zà-ÿ0-9\s&'-]+?)(?:\s*\(|\n|\.|,|pour)/i,
    ];
    for (const re of postePatterns) {
      const m = text.match(re);
      if (m && m[1]) {
        const val = m[1].trim();
        if (val.length > 1 && val.length < 150 && !/^(titre|restaurant|participation)/i.test(val)) {
          poste = val;
          break;
        }
      }
    }
    if (!poste && lines.length > 0) {
      const urlRe = /^https?:\/\//i;
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i];
        if (!urlRe.test(line) && line.length >= 2 && line.length <= 120) {
          if (!/^(bonjour|madame|monsieur|objet|ref\.?|candidature|titre\s|participation)/i.test(line) && !/restaurant|€|par mois/i.test(line)) {
            poste = line.replace(/\s*[-–]\s*job post\s*$/i, "").trim();
            break;
          }
        }
      }
    }
  }

  if (!entreprise) {
    const entreprisePatterns = [
      /(?:chez|au sein de)\s+([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9&\s'.-]{1,80}?)(?:\s*,|\s*$|\n|nous|pour|\.)/i,
      /(?:société|entreprise|company|structure|groupe)\s*[:-]\s*([^\n]+?)(?:\s*$|\n)/i,
      /(?:rejoignez?|rejoindre)\s+([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9&\s'.-]{1,80}?)(?:\s*!|\.|\s*$|\n|,)/i,
      /([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9&\s'.-]{2,60}?)\s+recrute\s+/i,
      /([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9&\s'.-]{2,60}?)\s+(?:est|s'est)\s+à la recherche/i,
      /(?:candidature|postuler)\s+chez\s+([^\n,]+?)(?:\s*$|\n|,)/i,
    ];
    for (const re of entreprisePatterns) {
      const m = text.match(re);
      if (m && m[1]) {
        const val = m[1].trim();
        if (val.length > 1 && val.length < 100 && !/^(nos|notre)\s+(produits?|équipes?)/i.test(val) && !/€|par mois/i.test(val)) {
          entreprise = val;
          break;
        }
      }
    }
    if (!entreprise && lines.length >= 2 && looksLikeCompany(lines[1])) entreprise = lines[1];
    if (!entreprise && lines.length >= 2 && looksLikeCompany(lines[0]) && !poste) {
      entreprise = lines[0];
      if (!poste && lines[1]) poste = lines[1].replace(/\s*[-–]\s*job post\s*$/i, "").trim();
    }
  }

  let typeContrat: TypeContrat = "autre";
  for (const { pattern, value } of CONTRAT_PATTERNS) {
    if (pattern.test(text)) {
      typeContrat = value;
      break;
    }
  }

  let teletravail: Teletravail = "inconnu";
  for (const { pattern, value } of TELETRAVAIL_PATTERNS) {
    if (pattern.test(text)) {
      teletravail = value;
      break;
    }
  }

  if (!localisation) {
    const addrLine = lines.find((l) => looksLikeAddress(l));
    if (addrLine) localisation = addrLine;
  }
  if (!localisation) {
    const addrMatch = text.match(/(\d+\s*(?:Route|rue|avenue|av\.|boulevard|bd|place|allée)\s+[^\n]+?\d{5}\s+[A-Za-zÀ-ÿ-]+)/i);
    if (addrMatch && !/€|par mois|Détails/i.test(addrMatch[1])) localisation = addrMatch[1].trim();
  }
  if (!localisation) {
    const locMatch = text.match(/(?:localisation|lieu du poste|ville)\s*[:-]\s*([^\n]+?)(?:\s*$|\n)/i);
    if (locMatch && locMatch[1]) {
      const val = locMatch[1].trim();
      if (!/€|par mois|Détails de l'emploi|CDI\s*Détails/i.test(val) && val.length < 120) localisation = val;
    }
  }
  if (!localisation) {
    const genericLoc = text.match(/(?:lieu|localisation)\s*[:-]\s*([^\n.,]+)/i);
    if (genericLoc && genericLoc[1]) {
      const val = genericLoc[1].trim();
      if (!/€|par mois|Détails/i.test(val) && val.length < 100) localisation = val;
    }
  }
  if (!localisation) {
    const cityDeptMatch = text.match(/\b([A-Za-zÀ-ÿ-]+\s*\(\d{2}\))\b/);
    if (cityDeptMatch && !/€|par mois|Détails/i.test(cityDeptMatch[1])) localisation = cityDeptMatch[1].trim();
  }

  let experienceYears = "";
  const expMatch = text.match(/(\d+)\s*(?:à|-)\s*(\d+)?\s*ans?\s*(?:d'exp|d'expérience|d'experience)?/i)
    ?? text.match(/(\d+)\s*ans?\s*(?:d'exp|d'expérience|d'experience)/i)
    ?? text.match(/(?:expérience|experience)\s*[:\s]*(\d+\s*(?:à|-)\s*\d+|\d+)\s*ans?/i);
  if (expMatch) experienceYears = expMatch[0].replace(/\s+/g, " ").trim();

  const competences: string[] = [];
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const phrase of KNOWN_STACK_KEYWORDS_MULTI) {
    const re = new RegExp(`\\b${phrase.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (re.test(normalized)) competences.push(phrase);
  }
  for (const kw of KNOWN_STACK_KEYWORDS) {
    if (competences.includes("react native") && kw === "react") continue;
    if (new RegExp(`\\b${kw}\\b`, "i").test(normalized)) competences.push(kw);
  }

  const isRatingLine = (s: string) =>
    /^[\d.]+\s*(\/\s*\d+)?\s*(étoiles?)?$/i.test(s.trim()) || /^\d\.\d$/.test(s.trim());
  const sectionHeaders = /^(Description|Lieu|Qualités|Fonctions|Avantages|Type d'emploi|Rémunération|Horaires|Lieu du poste)\s*[:\s]|^&nbsp;$/i;

  const pointsCles: string[] = [];

  const secteurMatch = text.match(/\bSecteur\s*(?:d'activité|de l'emploi|d'emploi)?\s*[:-]\s*([^\n]+?)(?:\s*$|\n)/i);
  if (secteurMatch && secteurMatch[1]) {
    const secteur = secteurMatch[1].trim();
    if (secteur.length >= 2 && secteur.length < 150) pointsCles.push(`Secteur : ${secteur}`);
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
      if (sectionHeaders.test(line) && !/avantages|extraits/i.test(lower)) break;
      let bullet = line.replace(/^[\s•*-]\s*/, "").trim();
      bullet = bullet.replace(/\s*Détails de l'emploi\s*/gi, "").trim();
      if (!isRatingLine(bullet) && bullet.length >= 2 && bullet.length < 200 && bullet !== "&nbsp;" && !pointsCles.includes(bullet)) {
        pointsCles.push(bullet);
      }
    }
  }

  for (const line of lines) {
    if (pointsCles.length >= 8) break;
    let bullet = line.replace(/^[\s•*-]\s*/, "").trim();
    bullet = bullet.replace(/\s*Détails de l'emploi\s*/gi, "").trim();
    if (isRatingLine(bullet) || bullet === "&nbsp;" || /^[\d.]+\s*\/\s*\d+/i.test(bullet)) continue;
    if (bullet.length >= 2 && bullet.length < 200 && !pointsCles.includes(bullet)) {
      pointsCles.push(bullet);
    }
  }

  let salaireOuFourchette = "";
  const salMatch = text.match(/(?:salaire|rémunération|rémuneration|fourchette)\s*[:-]?\s*([^\n]+?)(?:\s*€|$)/i)
    ?? text.match(/(\d[\d\s]*(?:k|000)?\s*€?\s*(?:-\s*\d[\d\s]*(?:k|000)?\s*€?)?)/);
  if (salMatch && salMatch[1]) {
    const raw = salMatch[1].trim();
    const numMatch = raw.match(/(\d[\d\s]*)/);
    const firstNum = numMatch ? parseInt(numMatch[1].replace(/\s/g, ""), 10) : 0;
    if (raw.includes("€") || raw.includes("k") || raw.includes("000") || firstNum >= 1000) {
      salaireOuFourchette = raw;
    }
  }

  let lienCandidature = "";
  const urlMatch = text.match(/https?:\/\/[^\s<>"']+/);
  if (urlMatch) lienCandidature = urlMatch[0];

  return {
    poste,
    entreprise,
    typeContrat,
    teletravail,
    localisation,
    experienceYears,
    competences,
    pointsCles,
    salaireOuFourchette,
    lienCandidature,
  };
}

export function extractedToFormData(ext: ExtractedOffer): AddCandidatureFormData {
  return {
    entreprise: ext.entreprise,
    poste: ext.poste,
    lienOffre: ext.lienCandidature,
    localisation: ext.localisation,
    typeContrat: ext.typeContrat,
    teletravail: ext.teletravail,
    dateCandidature: new Date().toISOString().slice(0, 10),
    source: "autre",
    notePersonnelle: 3,
    statutSuivi: "en_cours",
    statut: "a_postuler",
    salaireOuFourchette: ext.salaireOuFourchette,
    notes: ext.pointsCles.length > 0 ? ext.pointsCles.join("\n• ") : "",
    competences: ext.competences.length > 0 ? ext.competences.join(", ") : "",
  };
}

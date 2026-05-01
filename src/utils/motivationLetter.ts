import { KNOWN_STACK_KEYWORDS } from "../lib/offerAnalyzer";

export type LetterTone = "classic" | "modern" | "startup";

export type GenerateLetterInput = {
  company: string;
  position: string;
  skills: string[];
  achievement: string;
  motivation: string;
  tone: LetterTone;
  firstName?: string;
  lastName?: string;
  offerText?: string;
  yearsExperience?: number;
};

type LetterBlock = {
  intro: string[];
  body: string[];
  closing: string[];
};

export const TONE_LABELS: Record<LetterTone, string> = {
  classic: "Classique",
  modern: "Moderne",
  startup: "Startup",
};

const LETTER_BLOCKS: Record<LetterTone, LetterBlock> = {
  classic: {
    intro: [
      "Je vous propose ma candidature au poste de {{position}} chez {{company}}, convaincu(e) que mon profil peut contribuer a vos objectifs.",
      "Souhaitant rejoindre {{company}} au poste de {{position}}, je souhaite mettre mes competences au service de votre equipe.",
      "Votre offre pour le poste de {{position}} chez {{company}} correspond pleinement a mon parcours et a mes ambitions.",
    ],
    body: [
      "Je maitrise notamment {{skillsList}}, des competences directement mobilisables pour ce poste.",
      "Mon parcours m'a amene(e) a developper {{skillsList}}, avec une attention particuliere pour la qualite d'execution.",
      "Mes experiences m'ont permis de consolider {{skillsList}}, tout en gardant une approche orientee resultats.",
    ],
    closing: [
      "Je serais ravi(e) d'echanger avec vous afin de vous presenter plus en detail ma motivation.",
      "Je reste a votre disposition pour un entretien afin de discuter de ma contribution potentielle.",
      "Je vous remercie pour votre attention et me tiens disponible pour toute rencontre.",
    ],
  },
  modern: {
    intro: [
      "Je candidate au poste de {{position}} chez {{company}} avec l'envie de contribuer rapidement a vos projets.",
      "Le poste de {{position}} chez {{company}} m'interesse fortement, car il correspond a ma facon de travailler et a mes competences.",
      "Je souhaite rejoindre {{company}} en tant que {{position}} pour apporter une valeur concrete des les premieres semaines.",
    ],
    body: [
      "Je peux m'appuyer sur {{skillsList}} pour livrer efficacement et collaborer avec les equipes.",
      "Mon socle de competences, notamment {{skillsList}}, me permet d'etre autonome tout en restant aligne(e) avec les objectifs collectifs.",
      "Au quotidien, j'utilise {{skillsList}} pour avancer vite sans compromettre la qualite.",
    ],
    closing: [
      "Si vous le souhaitez, je peux vous partager rapidement des exemples concrets de realisations.",
      "Je serais heureux(se) d'echanger pour voir comment mon profil peut s'integrer a votre equipe.",
      "Je reste disponible pour un echange et vous remercie pour votre consideration.",
    ],
  },
  startup: {
    intro: [
      "Je veux rejoindre {{company}} au poste de {{position}} pour contribuer a une dynamique ambitieuse et orientee impact.",
      "Le role de {{position}} chez {{company}} me motive particulierement: j'aime les environnements ou il faut construire, tester et iterer.",
      "Votre opportunite de {{position}} chez {{company}} correspond exactement a mon energie et a ma maniere de travailler.",
    ],
    body: [
      "Je combine {{skillsList}} pour avancer vite, prioriser l'essentiel et obtenir des resultats mesurables.",
      "Avec {{skillsList}}, je peux prendre de la hauteur, executer rapidement et collaborer efficacement en equipe.",
      "Mon profil melange {{skillsList}}, avec une forte capacite d'adaptation et de prise d'initiative.",
    ],
    closing: [
      "Je serais ravi(e) d'en discuter avec vous et de voir comment accelerer vos projets des mon arrivee.",
      "Disponible pour un echange rapide, je serais heureux(se) de vous montrer ma facon de contribuer concrètement.",
      "Merci pour votre temps, et au plaisir d'explorer ensemble une collaboration.",
    ],
  },
};

const STARTUP_TONE_HINTS = [
  "challenge",
  "innovation",
  "agile",
  "startup",
  "ownership",
  "autonomie",
  "impact",
  "scalabilite",
];

const CLASSIC_TONE_HINTS = [
  "rigueur",
  "process",
  "conformite",
  "qualite",
  "gouvernance",
  "procedure",
];

const MISSION_TONE_HINTS = [
  "mission",
  "impact social",
  "impact",
  "durable",
  "inclusion",
  "solidarite",
];

function normalizeText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function detectKeywords(offerText: string, userSkills: string[]): string[] {
  const normalizedOffer = normalizeText(offerText);
  return userSkills.filter((skill) =>
    normalizedOffer.includes(normalizeText(skill))
  );
}

function extractOfferStackMatches(offerText: string): string[] {
  const normalizedOffer = normalizeText(offerText);
  return KNOWN_STACK_KEYWORDS.filter((keyword) =>
    normalizedOffer.includes(normalizeText(keyword))
  );
}

function pickBySeed(options: string[], seed: number): string {
  if (options.length === 0) return "";
  return options[Math.abs(seed) % options.length];
}

function buildSeed(input: GenerateLetterInput): number {
  const base = [
    input.company,
    input.position,
    input.skills.join("|"),
    input.achievement,
    input.motivation,
    input.offerText ?? "",
    input.tone,
  ].join("#");
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) | 0;
  }
  return hash;
}

function injectTemplate(
  template: string,
  values: { company: string; position: string; skillsList: string }
): string {
  return template
    .replaceAll("{{company}}", values.company)
    .replaceAll("{{position}}", values.position)
    .replaceAll("{{skillsList}}", values.skillsList);
}

export function detectToneFromOffer(offerText: string): LetterTone {
  const normalizedOffer = normalizeText(offerText);
  const score = {
    startup: STARTUP_TONE_HINTS.reduce(
      (acc, keyword) => acc + Number(normalizedOffer.includes(keyword)),
      0
    ),
    classic: CLASSIC_TONE_HINTS.reduce(
      (acc, keyword) => acc + Number(normalizedOffer.includes(keyword)),
      0
    ),
    modern: MISSION_TONE_HINTS.reduce(
      (acc, keyword) => acc + Number(normalizedOffer.includes(keyword)),
      0
    ),
  };
  if (score.startup >= score.classic && score.startup >= score.modern) {
    return "startup";
  }
  if (score.classic >= score.modern) return "classic";
  return "modern";
}

export function computeMatchingScore(input: GenerateLetterInput): {
  score: number;
  matchedSkills: string[];
  stackMatches: string[];
} {
  const matchedSkills = input.offerText
    ? detectKeywords(input.offerText, input.skills)
    : [];
  const stackMatches = input.offerText
    ? extractOfferStackMatches(input.offerText)
    : [];
  const offerText = input.offerText ?? "";
  const yearsInOfferMatch = offerText.match(/(\d+)\s*(ans|annees|years)/i);
  const requiredYears = yearsInOfferMatch
    ? Number.parseInt(yearsInOfferMatch[1], 10)
    : null;

  const skillsRatio =
    input.skills.length > 0 ? matchedSkills.length / input.skills.length : 0;
  const stackRatio =
    stackMatches.length > 0
      ? Math.min(stackMatches.length / 4, 1)
      : input.offerText
        ? 0
        : 0.4;
  const yearsRatio =
    requiredYears && input.yearsExperience !== undefined
      ? Math.min(input.yearsExperience / requiredYears, 1)
      : input.yearsExperience !== undefined
        ? 0.8
        : 0.6;

  const score = Math.round(
    (skillsRatio * 0.5 + yearsRatio * 0.2 + stackRatio * 0.3) * 100
  );
  return { score: Math.max(12, score), matchedSkills, stackMatches };
}

export function generateLetter(data: GenerateLetterInput): string {
  const skills = data.skills.filter(Boolean);
  const matchedSkills =
    data.offerText && data.offerText.trim().length > 0
      ? detectKeywords(data.offerText, skills)
      : [];
  const prioritizedSkills = [
    ...matchedSkills,
    ...skills.filter((s) => !matchedSkills.includes(s)),
  ];
  const selectedSkills = prioritizedSkills.slice(0, 3);
  const skillsList = selectedSkills.join(", ");
  const toneBlocks = LETTER_BLOCKS[data.tone];
  const seed = buildSeed(data);

  const intro = injectTemplate(pickBySeed(toneBlocks.intro, seed), {
    company: data.company,
    position: data.position,
    skillsList,
  });
  const body = injectTemplate(pickBySeed(toneBlocks.body, seed + 17), {
    company: data.company,
    position: data.position,
    skillsList,
  });
  const closing = injectTemplate(pickBySeed(toneBlocks.closing, seed + 31), {
    company: data.company,
    position: data.position,
    skillsList,
  });

  const offerLine =
    matchedSkills.length > 0
      ? `En lisant votre annonce, j'ai note l'importance de ${matchedSkills.join(", ")}, des points sur lesquels je suis operationnel(le).`
      : "";
  const achievementLine = `Parmi mes realisations, ${data.achievement.trim()}.`;
  const motivationLine = `Je souhaite rejoindre ${data.company} car ${data.motivation.trim()}.`;

  const bodyParts = [
    intro,
    body,
    offerLine,
    achievementLine,
    motivationLine,
    closing,
  ].filter(Boolean);

  const signature =
    data.firstName?.trim() || data.lastName?.trim()
      ? [data.firstName?.trim(), data.lastName?.trim()].filter(Boolean).join(" ")
      : "[Votre prénom et nom]";

  return [
    `Objet: Candidature - ${data.position}`,
    "",
    "Madame, Monsieur,",
    "",
    ...bodyParts.flatMap((line) => [line, ""]),
    "Cordialement,",
    signature,
  ].join("\n");
}

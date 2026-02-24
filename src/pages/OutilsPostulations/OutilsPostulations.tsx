import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchCvRessources,
  insertCvRessource,
  deleteCvRessource,
} from "../../lib/cvRessources";
import type { CvRessource, CvType, CvFormat } from "../../types/cvRessource";
import {
  fetchJobSites,
  fetchUserJobSiteStatus,
  upsertUserJobSiteStatus,
  insertJobSite,
  deleteJobSite,
} from "../../lib/jobSites";
import type { JobSite } from "../../lib/jobSites";
import { OutilsProgressWrap } from "./OutilsProgressWrap";
import { Select } from "../../components/Select/Select";
import { fetchProjets, insertProjet, updateProjet, deleteProjet } from "../../lib/projets";
import type { Projet } from "../../types/projet";
import type { WhyCompanyTemplate } from "../../data/interface";
import type { TypeContrat, Teletravail } from "../../types/candidature";
import { extractOfferFromText, extractedToFormData, KNOWN_STACK_KEYWORDS, type ExtractedOffer } from "../../lib/offerAnalyzer";
import whyCompanyTemplates from "../../data/whyCompanyTemplates.json";
import "./OutilsPostulations.css";

const WHY_COMPANY_TEMPLATES = whyCompanyTemplates as WhyCompanyTemplate[];

const CV_TYPE_LABELS: Record<CvType, string> = {
  tech: "Tech",
  agence: "Agence",
  grande_entreprise: "Grande entreprise",
  autre: "Autre",
};

const CV_FORMAT_LABELS: Record<CvFormat, string> = {
  court: "Court",
  complet: "Complet",
};

/** Convertit une URL en version affichable (Google Drive → preview ou viewer PDF) */
function getEmbedUrl(url: string): string {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const driveOpenMatch = url.match(
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  );
  const fileId = driveMatch?.[1] ?? driveOpenMatch?.[1];
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  if (url.toLowerCase().includes(".pdf") || url.includes("pdf")) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  }
  return url;
}

function CvSection() {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<CvRessource[]>([]);
  const [loading, setLoading] = useState(!!user?.id);
  const [showAdd, setShowAdd] = useState(false);
  const [addTitre, setAddTitre] = useState("");
  const [addType, setAddType] = useState<CvType>("tech");
  const [addFormat, setAddFormat] = useState<CvFormat | "">("");
  const [addUrl, setAddUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [viewCv, setViewCv] = useState<CvRessource | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = async (cv: CvRessource) => {
    try {
      await navigator.clipboard.writeText(cv.url);
      setCopiedId(cv.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback si clipboard non disponible
    }
  };

  useEffect(() => {
    if (!user?.id) {
      queueMicrotask(() => {
        setCvs([]);
        setLoading(false);
      });
      return () => {};
    }
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    fetchCvRessources(user.id)
      .then((data) => {
        if (!cancelled) setCvs(data);
      })
      .catch(() => {
        if (!cancelled) setCvs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const titre = addTitre.trim();
    const url = addUrl.trim();
    if (!titre || !url || !user?.id || adding) return;
    setAdding(true);
    try {
      const cv = await insertCvRessource(user.id, {
        titre,
        type: addType,
        format: addFormat || undefined,
        url,
      });
      setCvs((prev) => [cv, ...prev]);
      setAddTitre("");
      setAddType("tech");
      setAddFormat("");
      setAddUrl("");
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (cv: CvRessource) => {
    if (!user?.id) return;
    if (viewCv?.id === cv.id) setViewCv(null);
    await deleteCvRessource(user.id, cv.id);
    setCvs((prev) => prev.filter((c) => c.id !== cv.id));
  };

  useEffect(() => {
    if (!viewCv) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewCv(null);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [viewCv]);

  return (
    <section className="outils-postulations__block">
      <h2 className="outils-postulations__block-title">CV</h2>
      <p className="outils-postulations__block-desc">
        Stockez vos CV avec un lien et visualisez-les en grand.
      </p>

      {!loading && (
        <OutilsProgressWrap
          value={cvs.length}
          max={10}
          label={
            cvs.length === 0
              ? "Aucun CV pour l'instant"
              : cvs.length === 1
                ? "1 CV disponible"
                : `${cvs.length} CVs disponibles`
          }
        />
      )}

      {loading && <p className="outils-postulations__loading">Chargement…</p>}

      {!loading && (
        <>
          {showAdd ? (
            <form
              className="outils-postulations__add-form"
              onSubmit={handleAdd}
            >
              <input
                type="text"
                placeholder="Titre (ex. CV Tech)"
                value={addTitre}
                onChange={(e) => setAddTitre(e.target.value)}
                className="outils-postulations__add-input"
                required
                disabled={adding}
              />
              <div className="outils-postulations__add-row">
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as CvType)}
                  className="outils-postulations__add-select"
                  disabled={adding}
                  aria-label="Type de CV"
                >
                  {(Object.keys(CV_TYPE_LABELS) as CvType[]).map((t) => (
                    <option key={t} value={t}>
                      {CV_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <select
                  value={addFormat}
                  onChange={(e) =>
                    setAddFormat((e.target.value || "") as CvFormat | "")
                  }
                  className="outils-postulations__add-select"
                  disabled={adding}
                  aria-label="Format (sous-type)"
                >
                  <option value="">— Format —</option>
                  {(Object.keys(CV_FORMAT_LABELS) as CvFormat[]).map((f) => (
                    <option key={f} value={f}>
                      {CV_FORMAT_LABELS[f]}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="url"
                placeholder="Lien (Google Drive, Notion, etc.)"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                className="outils-postulations__add-input"
                required
                disabled={adding}
              />
              <div className="outils-postulations__add-actions">
                <button
                  type="submit"
                  className="outils-postulations__add-btn"
                  disabled={adding}
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  className="outils-postulations__add-cancel"
                  onClick={() => {
                    setShowAdd(false);
                    setAddTitre("");
                    setAddUrl("");
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : null}

          <ul className="outils-postulations__cv-list">
            {cvs.map((cv) => (
              <li key={cv.id} className="outils-postulations__cv-card">
                <div className="outils-postulations__cv-card-body">
                  <div className="outils-postulations__cv-card-header">
                    <h3 className="outils-postulations__cv-card-title">
                      {cv.titre}
                    </h3>
                    <div className="outils-postulations__cv-card-badges">
                      <span
                        className={`outils-postulations__cv-card-type outils-postulations__cv-card-type--${cv.type}`}
                      >
                        {CV_TYPE_LABELS[cv.type]}
                      </span>
                      {cv.format && (
                        <span className="outils-postulations__cv-card-format">
                          {CV_FORMAT_LABELS[cv.format]}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="outils-postulations__cv-card-delete"
                      onClick={() => handleDelete(cv)}
                      aria-label={`Supprimer ${cv.titre}`}
                    >
                      ×
                    </button>
                  </div>
                  <div className="outils-postulations__cv-card-actions">
                    <button
                      type="button"
                      className="outils-postulations__cv-card-link"
                      onClick={() => handleCopyLink(cv)}
                      aria-label={`Copier le lien de ${cv.titre}`}
                    >
                      {copiedId === cv.id ? "Copié !" : "Copier le lien"}
                    </button>
                    <button
                      type="button"
                      className="outils-postulations__cv-card-view"
                      onClick={() => setViewCv(cv)}
                    >
                      Voir en grand
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {cvs.length === 0 && !showAdd && (
            <p className="outils-postulations__empty">
              Aucun CV pour le moment.
            </p>
          )}

          {!showAdd && (
            <div className="outils-postulations__add-trigger-wrap">
              <button
                type="button"
                className="outils-postulations__add-trigger"
                onClick={() => setShowAdd(true)}
              >
                + Ajouter un CV
              </button>
            </div>
          )}
        </>
      )}

      {viewCv && (
        <div
          className="outils-postulations__view-overlay"
          onClick={() => setViewCv(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cv-view-title"
        >
          <div
            className="outils-postulations__view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="outils-postulations__view-header">
              <h2
                id="cv-view-title"
                className="outils-postulations__view-title"
              >
                {viewCv.titre}
              </h2>
              <button
                type="button"
                className="outils-postulations__view-close"
                onClick={() => setViewCv(null)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <div className="outils-postulations__view-body">
              <iframe
                src={getEmbedUrl(viewCv.url)}
                title={viewCv.titre}
                className="outils-postulations__view-iframe"
              />
            </div>
            <div className="outils-postulations__view-footer">
              <a
                href={viewCv.url}
                target="_blank"
                rel="noopener noreferrer"
                className="outils-postulations__view-open"
              >
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const SITES_EMPLOI_STORAGE_KEY = "plan-my-job-sites-emploi";

type SiteCheckboxesState = Record<
  string,
  { created: boolean; cvSent: boolean }
>;

type LetterTone = "classic" | "modern" | "startup";

type GenerateLetterInput = {
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

const TONE_LABELS: Record<LetterTone, string> = {
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
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function detectKeywords(offerText: string, userSkills: string[]): string[] {
  const normalizedOffer = normalizeText(offerText);
  return userSkills.filter((skill) =>
    normalizedOffer.includes(normalizeText(skill))
  );
}

function detectToneFromOffer(offerText: string): LetterTone {
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

function extractOfferStackMatches(offerText: string): string[] {
  const normalizedOffer = normalizeText(offerText);
  return KNOWN_STACK_KEYWORDS.filter((keyword) =>
    normalizedOffer.includes(normalizeText(keyword))
  );
}

function computeMatchingScore(input: GenerateLetterInput): {
  score: number;
  matchedSkills: string[];
  stackMatches: string[];
} {
  const matchedSkills = input.offerText
    ? detectKeywords(input.offerText, input.skills)
    : [];
  const stackMatches = input.offerText ? extractOfferStackMatches(input.offerText) : [];
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

  const score = Math.round((skillsRatio * 0.5 + yearsRatio * 0.2 + stackRatio * 0.3) * 100);
  return { score: Math.max(12, score), matchedSkills, stackMatches };
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

function generateLetter(data: GenerateLetterInput): string {
  const skills = data.skills.filter(Boolean);
  const matchedSkills =
    data.offerText && data.offerText.trim().length > 0
      ? detectKeywords(data.offerText, skills)
      : [];
  const prioritizedSkills = [...matchedSkills, ...skills.filter((s) => !matchedSkills.includes(s))];
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

  const bodyParts = [intro, body, offerLine, achievementLine, motivationLine, closing].filter(
    Boolean
  );

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

function MotivationGeneratorSection() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [skills, setSkills] = useState(["", "", ""]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [projetsLoading, setProjetsLoading] = useState(false);
  const [selectedProjetId, setSelectedProjetId] = useState<string>("");
  const [customAchievement, setCustomAchievement] = useState("");
  const [showAddProjet, setShowAddProjet] = useState(false);
  const [addProjetTitre, setAddProjetTitre] = useState("");
  const [addProjetDescription, setAddProjetDescription] = useState("");
  const [addingProjet, setAddingProjet] = useState(false);
  const [editingProjetId, setEditingProjetId] = useState<string | null>(null);
  const [editProjetTitre, setEditProjetTitre] = useState("");
  const [editProjetDescription, setEditProjetDescription] = useState("");
  const [savingProjetId, setSavingProjetId] = useState<string | null>(null);
  const [motivation, setMotivation] = useState("");
  const [offerText, setOfferText] = useState("");
  const [toneSelection, setToneSelection] = useState<LetterTone | "auto">("auto");
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [lastToneUsed, setLastToneUsed] = useState<LetterTone | null>(null);
  const [matchedSkills, setMatchedSkills] = useState<string[]>([]);
  const [matchingScore, setMatchingScore] = useState<number | null>(null);

  const achievementText =
    selectedProjetId && selectedProjetId !== ""
      ? (projets.find((p) => p.id === selectedProjetId)?.description ?? "").trim()
      : customAchievement.trim();

  const whyCompanySelectValue = useMemo(() => {
    const idx = WHY_COMPANY_TEMPLATES.findIndex((t) => t.text === motivation);
    return idx >= 0 ? String(idx) : "";
  }, [motivation]);

  const hasRequiredFields =
    position.trim() &&
    company.trim() &&
    skills.some((s) => s.trim()) &&
    achievementText.length > 0 &&
    motivation.trim();

  useEffect(() => {
    if (!user?.id) {
      queueMicrotask(() => {
        setProjets([]);
        setProjetsLoading(false);
      });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => { setProjetsLoading(true); });
    fetchProjets(user.id)
      .then((data) => { if (!cancelled) setProjets(data); })
      .catch(() => { if (!cancelled) setProjets([]); })
      .finally(() => { if (!cancelled) setProjetsLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const detectedTone = useMemo(() => {
    if (!offerText.trim()) return null;
    return detectToneFromOffer(offerText);
  }, [offerText]);

  const setSkillAt = (index: number, value: string) => {
    setSkills((prev) => prev.map((skill, i) => (i === index ? value : skill)));
  };

  const handleGenerate = () => {
    if (!hasRequiredFields) return;
    const cleanSkills = skills.map((s) => s.trim()).filter(Boolean);
    const selectedTone =
      toneSelection === "auto" ? detectedTone ?? "classic" : toneSelection;
    const input: GenerateLetterInput = {
      company: company.trim(),
      position: position.trim(),
      skills: cleanSkills,
      achievement: achievementText,
      motivation: motivation.trim(),
      tone: selectedTone,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      offerText: offerText.trim() || undefined,
      yearsExperience:
        yearsExperience.trim().length > 0 ? Number.parseInt(yearsExperience, 10) : undefined,
    };
    const letter = generateLetter(input);
    const scoreDetails = computeMatchingScore(input);
    setGeneratedLetter(letter);
    setMatchingScore(scoreDetails.score);
    setMatchedSkills(scoreDetails.matchedSkills);
    setLastToneUsed(selectedTone);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!generatedLetter) return;
    try {
      await navigator.clipboard.writeText(generatedLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard failures
    }
  };

  const handleAddProjet = async (e: React.FormEvent) => {
    e.preventDefault();
    const titre = addProjetTitre.trim();
    const description = addProjetDescription.trim();
    if (!titre || !description || !user?.id || addingProjet) return;
    setAddingProjet(true);
    try {
      const nouveau = await insertProjet(user.id, { titre, description });
      setProjets((prev) => [nouveau, ...prev]);
      setSelectedProjetId(nouveau.id);
      setAddProjetTitre("");
      setAddProjetDescription("");
      setShowAddProjet(false);
    } finally {
      setAddingProjet(false);
    }
  };

  const startEditProjet = (p: Projet) => {
    setEditingProjetId(p.id);
    setEditProjetTitre(p.titre);
    setEditProjetDescription(p.description);
  };

  const cancelEditProjet = () => {
    setEditingProjetId(null);
    setEditProjetTitre("");
    setEditProjetDescription("");
  };

  const handleUpdateProjet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjetId || !user?.id || savingProjetId !== null) return;
    setSavingProjetId(editingProjetId);
    try {
      const updated = await updateProjet(user.id, editingProjetId, {
        titre: editProjetTitre.trim(),
        description: editProjetDescription.trim(),
      });
      setProjets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      cancelEditProjet();
    } finally {
      setSavingProjetId(null);
    }
  };

  const handleDeleteProjet = async (id: string) => {
    if (!user?.id || !window.confirm("Supprimer ce projet ?")) return;
    try {
      await deleteProjet(user.id, id);
      setProjets((prev) => prev.filter((p) => p.id !== id));
      if (selectedProjetId === id) setSelectedProjetId("");
    } catch {
      // error could be shown in UI
    }
  };

  return (
    <section className="outils-postulations__block">
      <h2 className="outils-postulations__block-title">Mail / lettre de motivation</h2>
      <p className="outils-postulations__block-desc">
        Generez une base personnalisee en quelques questions, puis ajustez-la manuellement.
      </p>

      <div className="outils-postulations__letter-grid">
        <div className="outils-postulations__letter-form">
          <div className="outils-postulations__add-row">
            <label className="outils-postulations__letter-label">
              Prénom
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="outils-postulations__add-input"
                placeholder="Ex. Marie"
              />
            </label>
            <label className="outils-postulations__letter-label">
              Nom
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="outils-postulations__add-input"
                placeholder="Ex. Dupont"
              />
            </label>
          </div>
          <label className="outils-postulations__letter-label">
            Poste visé
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="outils-postulations__add-input"
              placeholder="Ex. Frontend Developer React"
            />
          </label>
          <label className="outils-postulations__letter-label">
            Entreprise
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="outils-postulations__add-input"
              placeholder="Ex. PlanMyJob"
            />
          </label>
          <label className="outils-postulations__letter-label">
            Compétences clés
            <div className="outils-postulations__letter-skills">
              {skills.map((skill, index) => (
                <input
                  key={index}
                  type="text"
                  value={skill}
                  onChange={(e) => setSkillAt(index, e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder={`Compétence ${index + 1}`}
                />
              ))}
            </div>
          </label>
          <div className="outils-postulations__letter-label">
            {projetsLoading ? (
              <p className="outils-postulations__placeholder">Chargement des projets…</p>
            ) : (
              <>
                <Select
                  id="letter-projet"
                  label="Réalisation importante (projet)"
                  value={selectedProjetId}
                  options={[
                    { value: "", label: "Saisie libre" },
                    ...projets.map((p) => ({ value: p.id, label: p.titre })),
                  ]}
                  onChange={(value) => setSelectedProjetId(value)}
                  wrapClassName="outils-postulations__letter-projet-select"
                />
                {selectedProjetId === "" && (
                  <textarea
                    value={customAchievement}
                    onChange={(e) => setCustomAchievement(e.target.value)}
                    className="outils-postulations__letter-textarea"
                    placeholder="Ex. j'ai refondu le tunnel de candidature et augmenté la conversion de 22%"
                  />
                )}
              </>
            )}
          </div>
          <div className="outils-postulations__letter-label">
            <Select
              id="letter-why-company"
              label="Pourquoi cette entreprise ?"
              value={whyCompanySelectValue}
              options={WHY_COMPANY_TEMPLATES.map((t, i) => ({
                value: String(i),
                label: t.title,
              }))}
              onChange={(value) =>
                setMotivation(WHY_COMPANY_TEMPLATES[Number(value)].text)
              }
              wrapClassName="outils-postulations__letter-why-company-select"
            />
          </div>
          <label className="outils-postulations__letter-label">
            Offre d'emploi (optionnel)
            <textarea
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              className="outils-postulations__letter-textarea outils-postulations__letter-textarea--large"
              placeholder="Collez ici le texte de l'annonce pour prioriser automatiquement les mots-cles."
            />
          </label>
          <div className="outils-postulations__add-row">
            <Select
              id="letter-tone"
              label="Style souhaité"
              value={toneSelection}
              options={[
                { value: "auto", label: "Auto (selon l'offre)" },
                { value: "classic", label: "Classique" },
                { value: "modern", label: "Moderne" },
                { value: "startup", label: "Startup" },
              ]}
              onChange={(value) => setToneSelection(value as LetterTone | "auto")}
              wrapClassName="outils-postulations__letter-select-wrap"
            />
            <label className="outils-postulations__letter-label">
              Années d'expérience
              <input
                type="number"
                min={0}
                max={40}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="outils-postulations__add-input"
                placeholder="Ex. 3"
              />
            </label>
          </div>
          <div className="outils-postulations__add-actions">
            <button
              type="button"
              className="outils-postulations__add-btn"
              onClick={handleGenerate}
              disabled={!hasRequiredFields}
            >
              Générer la lettre
            </button>
          </div>
        </div>

        <div className="outils-postulations__letter-result">
          {generatedLetter ? (
            <>
              <div className="outils-postulations__letter-meta">
                {matchingScore !== null && (
                  <span className="outils-postulations__letter-badge">
                    Score de matching: {matchingScore}%
                  </span>
                )}
                {lastToneUsed && (
                  <span className="outils-postulations__letter-badge">
                    Style: {TONE_LABELS[lastToneUsed]}
                  </span>
                )}
                {toneSelection === "auto" && detectedTone && (
                  <span className="outils-postulations__letter-badge">
                    Ton detecte annonce: {TONE_LABELS[detectedTone]}
                  </span>
                )}
              </div>
              {matchedSkills.length > 0 && (
                <p className="outils-postulations__letter-keywords">
                  Mots-cles detectes dans l'offre: {matchedSkills.join(", ")}
                </p>
              )}
              <label className="outils-postulations__letter-label">
                Version editable
                <textarea
                  value={generatedLetter}
                  onChange={(e) => setGeneratedLetter(e.target.value)}
                  className="outils-postulations__letter-textarea outils-postulations__letter-textarea--result"
                />
              </label>
              <div className="outils-postulations__letter-result-actions">
                <button
                  type="button"
                  className="outils-postulations__cv-card-link"
                  onClick={handleCopy}
                >
                  {copied ? "Copiée !" : "Copier la lettre"}
                </button>
              </div>
            </>
          ) : (
            <p className="outils-postulations__placeholder">
              Remplissez le mini formulaire puis cliquez sur "Générer la lettre".
            </p>
          )}
        </div>
      </div>

      {user?.id && (
        <div className="outils-postulations__letter-projets">
          <h3 className="outils-postulations__letter-projets-title">Mes projets</h3>
          {projetsLoading ? (
            <p className="outils-postulations__placeholder">Chargement…</p>
          ) : (
            <>
              <ul className="outils-postulations__projets-list">
                {projets.map((p) => (
                  <li key={p.id} className="outils-postulations__projet-card">
                    {editingProjetId === p.id ? (
                      <form
                        className="outils-postulations__projet-edit-form"
                        onSubmit={handleUpdateProjet}
                      >
                        <input
                          type="text"
                          value={editProjetTitre}
                          onChange={(e) => setEditProjetTitre(e.target.value)}
                          className="outils-postulations__add-input"
                          placeholder="Titre"
                          required
                          disabled={savingProjetId !== null}
                        />
                        <textarea
                          value={editProjetDescription}
                          onChange={(e) => setEditProjetDescription(e.target.value)}
                          className="outils-postulations__letter-textarea"
                          placeholder="Réalisation"
                          required
                          disabled={savingProjetId !== null}
                        />
                        <div className="outils-postulations__add-actions">
                          <button
                            type="submit"
                            className="outils-postulations__add-btn"
                            disabled={savingProjetId !== null}
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            className="outils-postulations__add-cancel"
                            onClick={cancelEditProjet}
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="outils-postulations__projet-card-body">
                          <span className="outils-postulations__projet-card-titre">{p.titre}</span>
                          <p className="outils-postulations__projet-card-desc">
                            {p.description.length > 120
                              ? `${p.description.slice(0, 120)}…`
                              : p.description}
                          </p>
                        </div>
                        <div className="outils-postulations__projet-card-actions">
                          <button
                            type="button"
                            className="outils-postulations__projet-card-btn"
                            onClick={() => startEditProjet(p)}
                            aria-label={`Éditer ${p.titre}`}
                            title="Éditer"
                          >
                            <img
                              src="/icons/editer.png"
                              alt=""
                              className="outils-postulations__projet-card-icon"
                            />
                            Éditer
                          </button>
                          <button
                            type="button"
                            className="outils-postulations__projet-card-btn outils-postulations__projet-card-btn--delete"
                            onClick={() => handleDeleteProjet(p.id)}
                            aria-label={`Supprimer ${p.titre}`}
                            title="Supprimer"
                          >
                            <img
                              src="/icons/supprimer.png"
                              alt=""
                              className="outils-postulations__projet-card-icon"
                            />
                            Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              {showAddProjet ? (
                <form
                  className="outils-postulations__add-form outils-postulations__letter-add-projet"
                  onSubmit={handleAddProjet}
                >
                  <input
                    type="text"
                    value={addProjetTitre}
                    onChange={(e) => setAddProjetTitre(e.target.value)}
                    className="outils-postulations__add-input"
                    placeholder="Titre du projet"
                    required
                    disabled={addingProjet}
                  />
                  <textarea
                    value={addProjetDescription}
                    onChange={(e) => setAddProjetDescription(e.target.value)}
                    className="outils-postulations__letter-textarea"
                    placeholder="Réalisation (ex. j'ai refondu le tunnel et augmenté la conversion de 22%)"
                    required
                    disabled={addingProjet}
                  />
                  <div className="outils-postulations__add-actions">
                    <button
                      type="submit"
                      className="outils-postulations__add-btn"
                      disabled={addingProjet}
                    >
                      Ajouter le projet
                    </button>
                    <button
                      type="button"
                      className="outils-postulations__add-cancel"
                      onClick={() => {
                        setShowAddProjet(false);
                        setAddProjetTitre("");
                        setAddProjetDescription("");
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="outils-postulations__add-trigger"
                  onClick={() => setShowAddProjet(true)}
                >
                  + Ajouter un projet
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function loadSiteCheckboxesFromStorage(): SiteCheckboxesState {
  try {
    const raw = localStorage.getItem(SITES_EMPLOI_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: SiteCheckboxesState = {};
    Object.entries(parsed).forEach(([id, v]) => {
      if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        const created = o.created === true;
        const cvSent = o.cvSent === true || o.updated === true;
        next[id] = { created, cvSent };
      }
    });
    return next;
  } catch {
    return {};
  }
}

const TYPE_CONTRAT_LABELS: Record<TypeContrat, string> = {
  cdi: "CDI",
  cdd: "CDD",
  alternance: "Alternance",
  stage: "Stage",
  freelance: "Freelance",
  autre: "Autre",
};

const TELETRAVAIL_LABELS: Record<Teletravail, string> = {
  oui: "Oui",
  non: "Non",
  hybride: "Hybride",
  inconnu: "Non précisé",
};

function OfferAnalyzerSection() {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState("");
  const [extracted, setExtracted] = useState<ExtractedOffer | null>(null);

  const handleExtract = () => {
    const result = extractOfferFromText(rawText);
    setExtracted(result);
  };

  const updateField = <K extends keyof ExtractedOffer>(
    key: K,
    value: ExtractedOffer[K]
  ) => {
    setExtracted((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleCreateCandidature = () => {
    if (!extracted) return;
    const formData = extractedToFormData(extracted);
    navigate("/candidatures", { state: { addWithInitialData: formData } });
  };

  return (
    <section className="outils-postulations__block">
      <h2 className="outils-postulations__block-title">
        Outils d&apos;aide à la postulation
      </h2>
      <p className="outils-postulations__block-desc">
        Analysez une offre d&apos;emploi pour en extraire les informations utiles et créer une candidature.
      </p>

      <div className="outils-postulations__offer-analyzer">
        <h3 className="outils-postulations__offer-analyzer-title">Analyser une offre d&apos;emploi</h3>
        <p className="outils-postulations__offer-analyzer-desc">
          Collez le texte d&apos;une annonce (LinkedIn, Indeed, site entreprise…) puis cliquez sur « Extraire les informations ».
        </p>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="outils-postulations__letter-textarea outils-postulations__letter-textarea--large"
          placeholder="Collez ici le texte complet de l'offre d'emploi…"
          rows={6}
        />
        <div className="outils-postulations__add-actions">
          <button
            type="button"
            className="outils-postulations__add-btn"
            onClick={handleExtract}
            disabled={!rawText.trim()}
          >
            Extraire les informations
          </button>
        </div>

        {extracted && (
          <div className="outils-postulations__offer-result">
            <h4 className="outils-postulations__offer-result-title">Informations extraites</h4>
            <p className="outils-postulations__offer-result-desc">Vous pouvez modifier les champs avant de créer la candidature.</p>
            <div className="outils-postulations__offer-result-grid">
              <label className="outils-postulations__letter-label">
                Poste
                <input
                  type="text"
                  value={extracted.poste}
                  onChange={(e) => updateField("poste", e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder="Intitulé du poste"
                />
              </label>
              <label className="outils-postulations__letter-label">
                Entreprise
                <input
                  type="text"
                  value={extracted.entreprise}
                  onChange={(e) => updateField("entreprise", e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder="Nom de l'entreprise"
                />
              </label>
              <label className="outils-postulations__letter-label">
                Type de contrat
                <select
                  value={extracted.typeContrat}
                  onChange={(e) => updateField("typeContrat", e.target.value as TypeContrat)}
                  className="outils-postulations__add-select"
                >
                  {(Object.entries(TYPE_CONTRAT_LABELS) as [TypeContrat, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="outils-postulations__letter-label">
                Télétravail
                <select
                  value={extracted.teletravail}
                  onChange={(e) => updateField("teletravail", e.target.value as Teletravail)}
                  className="outils-postulations__add-select"
                >
                  {(Object.entries(TELETRAVAIL_LABELS) as [Teletravail, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="outils-postulations__letter-label outils-postulations__offer-result-full">
                Localisation
                <input
                  type="text"
                  value={extracted.localisation}
                  onChange={(e) => updateField("localisation", e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder="Ville, région…"
                />
              </label>
              <label className="outils-postulations__letter-label">
                Expérience demandée
                <input
                  type="text"
                  value={extracted.experienceYears}
                  onChange={(e) => updateField("experienceYears", e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder="Ex. 3 à 5 ans"
                />
              </label>
              <label className="outils-postulations__letter-label">
                Salaire / fourchette
                <input
                  type="text"
                  value={extracted.salaireOuFourchette}
                  onChange={(e) => updateField("salaireOuFourchette", e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder="Si indiqué dans l'offre"
                />
              </label>
              <label className="outils-postulations__letter-label outils-postulations__offer-result-full">
                Lien de candidature
                <input
                  type="url"
                  value={extracted.lienCandidature}
                  onChange={(e) => updateField("lienCandidature", e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder="https://…"
                />
              </label>
            </div>
            {extracted.competences.length > 0 && (
              <label className="outils-postulations__letter-label outils-postulations__offer-result-full">
                Compétences / mots-clés détectés
                <p className="outils-postulations__offer-tags">
                  {extracted.competences.map((c) => (
                    <span key={c} className="outils-postulations__offer-tag">{c}</span>
                  ))}
                </p>
              </label>
            )}
            {extracted.pointsCles.length > 0 && (
              <label className="outils-postulations__letter-label outils-postulations__offer-result-full">
                Points clés de l&apos;offre
                <ul className="outils-postulations__offer-points">
                  {extracted.pointsCles.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </label>
            )}
            <div className="outils-postulations__add-actions outils-postulations__offer-result-actions">
              <button
                type="button"
                className="outils-postulations__add-btn"
                onClick={handleCreateCandidature}
              >
                Créer une candidature
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OutilsPostulations() {
  const { user } = useAuth();
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [siteCheckboxes, setSiteCheckboxes] = useState<SiteCheckboxesState>(
    loadSiteCheckboxesFromStorage
  );
  const [showAddSite, setShowAddSite] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addingSite, setAddingSite] = useState(false);

  useEffect(() => {
    fetchJobSites()
      .then(setJobSites)
      .catch(() => setJobSites([]))
      .finally(() => setLoadingSites(false));
  }, []);

  useEffect(() => {
    if (jobSites.length === 0) return;
    setSiteCheckboxes((prev) => {
      const next: SiteCheckboxesState = {};
      jobSites.forEach((s) => {
        next[s.id] = prev[s.id] ?? { created: false, cvSent: false };
      });
      try {
        localStorage.setItem(SITES_EMPLOI_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [jobSites]);

  useEffect(() => {
    if (!user?.id || jobSites.length === 0) return;
    fetchUserJobSiteStatus(user.id)
      .then((statusList) => {
        setSiteCheckboxes((prev) => {
          const next = { ...prev };
          statusList.forEach((st) => {
            if (next[st.jobSiteId] !== undefined) {
              next[st.jobSiteId] = {
                created: st.accountCreated,
                cvSent: st.cvSent,
              };
            }
          });
          return next;
        });
      })
      .catch(() => {});
  }, [user?.id, jobSites]);

  const sitesUsedCount = useMemo(
    () =>
      jobSites.filter(
        (s) => siteCheckboxes[s.id]?.created || siteCheckboxes[s.id]?.cvSent
      ).length,
    [jobSites, siteCheckboxes]
  );

  const sitesUsedLabel =
    sitesUsedCount === 0
      ? "Aucun site utilisé"
      : sitesUsedCount === 1
        ? "1 site utilisé"
        : `${sitesUsedCount} sites utilisés`;

  const setSiteCheckbox = (
    siteId: string,
    field: "created" | "cvSent",
    value: boolean
  ) => {
    setSiteCheckboxes((prev) => {
      const current = prev[siteId] ?? { created: false, cvSent: false };
      const next = {
        ...prev,
        [siteId]: { ...current, [field]: value },
      };
      try {
        localStorage.setItem(SITES_EMPLOI_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      if (user?.id) {
        upsertUserJobSiteStatus(user.id, siteId, {
          accountCreated: field === "created" ? value : current.created,
          cvSent: field === "cvSent" ? value : current.cvSent,
        }).catch(() => {});
      }
      return next;
    });
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = addLabel.trim();
    const url = addUrl.trim();
    if (!label || !url || addingSite) return;
    setAddingSite(true);
    try {
      const site = await insertJobSite({ label, url });
      setJobSites((prev) => [...prev, site].sort((a, b) => a.position - b.position));
      setAddLabel("");
      setAddUrl("");
      setShowAddSite(false);
    } catch {
      // error could be shown in UI
    } finally {
      setAddingSite(false);
    }
  };

  const handleDeleteSite = async (id: string) => {
    if (!window.confirm("Supprimer ce site de la liste ?")) return;
    try {
      await deleteJobSite(id);
      setJobSites((prev) => prev.filter((s) => s.id !== id));
      setSiteCheckboxes((prev) => {
        const next = { ...prev };
        delete next[id];
        try {
          localStorage.setItem(SITES_EMPLOI_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    } catch {
      // error could be shown in UI
    }
  };

  return (
    <main className="outils-postulations">
      <div className="outils-postulations__header">
        <div>
          <h1>Ressources</h1>
          <p className="outils-postulations__intro">
            Modèles, templates et liens utiles pour optimiser vos candidatures.
          </p>
        </div>
        <img
          src="/icons/ressources.png"
          alt=""
          className="outils-postulations__icon"
          aria-hidden
        />
      </div>

      <div className="outils-postulations__sections">
        <CvSection />

        <MotivationGeneratorSection />

        <section className="outils-postulations__block">
          <h2 className="outils-postulations__block-title">
            Sites d&apos;emploi
          </h2>
          <p className="outils-postulations__block-desc">
            Liens vers les plateformes de recherche d&apos;emploi.
          </p>
          {!loadingSites && (
            <OutilsProgressWrap
              value={sitesUsedCount}
              max={jobSites.length}
              label={sitesUsedLabel}
            />
          )}
          {loadingSites && (
            <p className="outils-postulations__loading">Chargement des sites…</p>
          )}
          {!loadingSites && (
            <>
              <div className="outils-postulations__sites-grid">
                {jobSites.map((site) => (
                  <div key={site.id} className="outils-postulations__site-card">
                    <div className="outils-postulations__site-card-head">
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="outils-postulations__site-card-link"
                      >
                        {site.label}
                      </a>
                      <div className="outils-postulations__site-card-actions">
                        <button
                          type="button"
                          className="outils-postulations__site-card-btn outils-postulations__site-card-btn--delete"
                          onClick={() => handleDeleteSite(site.id)}
                          aria-label={`Supprimer ${site.label}`}
                          title="Supprimer"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="outils-postulations__site-card-checkboxes">
                          <label className="outils-postulations__site-card-check">
                            <input
                              type="checkbox"
                              checked={siteCheckboxes[site.id]?.created ?? false}
                              onChange={(e) =>
                                setSiteCheckbox(site.id, "created", e.target.checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Compte créé sur ${site.label}`}
                            />
                            <span>Compte créé</span>
                          </label>
                          <label className="outils-postulations__site-card-check">
                            <input
                              type="checkbox"
                              checked={siteCheckboxes[site.id]?.cvSent ?? false}
                              onChange={(e) =>
                                setSiteCheckbox(site.id, "cvSent", e.target.checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Compte mis à jour sur ${site.label}`}
                            />
                            <span>Compte mis à jour</span>
                          </label>
                        </div>
                  </div>
                ))}
              </div>
              {showAddSite ? (
                <form
                  className="outils-postulations__site-add-form"
                  onSubmit={handleAddSite}
                >
                  <input
                    type="text"
                    value={addLabel}
                    onChange={(e) => setAddLabel(e.target.value)}
                    className="outils-postulations__add-input"
                    placeholder="Nom du site (ex. LinkedIn)"
                    required
                    disabled={addingSite}
                  />
                  <input
                    type="url"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    className="outils-postulations__add-input"
                    placeholder="URL (ex. https://…)"
                    required
                    disabled={addingSite}
                  />
                  <div className="outils-postulations__add-actions">
                    <button
                      type="submit"
                      className="outils-postulations__add-btn"
                      disabled={addingSite}
                    >
                      Ajouter
                    </button>
                    <button
                      type="button"
                      className="outils-postulations__add-cancel"
                      onClick={() => {
                        setShowAddSite(false);
                        setAddLabel("");
                        setAddUrl("");
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div className="outils-postulations__site-add-trigger-wrap">
                  <button
                    type="button"
                    className="outils-postulations__add-trigger"
                    onClick={() => setShowAddSite(true)}
                  >
                    + Ajouter un site
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <OfferAnalyzerSection />
      </div>
    </main>
  );
}

export default OutilsPostulations;

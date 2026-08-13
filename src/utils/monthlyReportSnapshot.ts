import type { Candidature, SourceCandidature, Statut } from "../types/candidature";
import type {
  MonthlyReportSnapshot,
  MonthlyReportStats,
  MonthlyReportWeek,
} from "../types/monthlyReport.types";
import { isCandidatureInProgress } from "./candidatureStatus";
import {
  formatMonthLabel,
  formatWeekLabelInMonth,
  getEndOfMonthExclusive,
  getISOWeeksInMonth,
  getMondayOfWeek,
  getMonthBounds,
  isDateInRange,
  toDateKey,
} from "./dateWeek";
import { buildPublicShareSnapshot } from "./shareSnapshot";

const MS_DAY = 24 * 60 * 60 * 1000;
const SANS_REPONSE_DAYS = 15;

const SOURCE_KEYS: SourceCandidature[] = [
  "linkedin",
  "indeed",
  "france_travail",
  "welcome_to_the_jungle",
  "hellowork",
  "site_entreprise",
  "autre",
];

const TERMINAL_STATUTS: Statut[] = ["refus", "sans_reponse", "offre"];

const STATUT_RANK: Record<Statut, number> = {
  a_postuler: 0,
  cv_envoye: 1,
  entretien_rh: 2,
  entretien_technique: 3,
  attente_reponse: 4,
  refus: 5,
  sans_reponse: 5,
  offre: 5,
};

function getCandidatureDate(c: Candidature): string | undefined {
  return c.dateCandidature ?? c.createdAt;
}

export function filterCandidaturesInMonth(
  candidatures: Candidature[],
  year: number,
  month: number,
  now: Date = new Date()
): Candidature[] {
  const { start, end } = getMonthBounds(year, month, now);
  return candidatures.filter((c) =>
    isDateInRange(getCandidatureDate(c), start, end)
  );
}

function isCvSentInPeriod(c: Candidature, start: Date, end: Date): boolean {
  if (c.statut !== "a_postuler") return true;
  return isDateInRange(c.cvEnvoyeAt, start, end);
}

function hadInterviewInPeriod(
  c: Candidature,
  start: Date,
  end: Date
): boolean {
  return (
    isDateInRange(c.entretienRhAt, start, end) ||
    isDateInRange(c.entretienTechniqueAt, start, end)
  );
}

function hadRefusInPeriod(c: Candidature, start: Date, end: Date): boolean {
  return isDateInRange(c.refusAt, start, end);
}

function hadSansReponseInPeriod(c: Candidature, at: Date): boolean {
  if (c.statut === "sans_reponse") {
    const statutAt = getStatutAtDate(c, at);
    return statutAt === "sans_reponse";
  }
  return false;
}

/** Reconstruit le statut effectif à une date via la timeline *At. */
export function getStatutAtDate(c: Candidature, at: Date): Statut {
  const transitions: { date: Date; statut: Statut }[] = [];

  const push = (iso: string | undefined, statut: Statut) => {
    if (!iso) return;
    const d = new Date(iso);
    if (d.getTime() <= at.getTime()) {
      transitions.push({ date: d, statut });
    }
  };

  push(c.cvEnvoyeAt, "cv_envoye");
  push(c.entretienRhAt, "entretien_rh");
  push(c.entretienTechniqueAt, "entretien_technique");
  push(c.attenteReponseAt, "attente_reponse");
  push(c.refusAt, "refus");

  transitions.sort((a, b) => a.date.getTime() - b.date.getTime());

  let statut: Statut = "a_postuler";
  const applied = getCandidatureDate(c);
  if (applied && new Date(applied).getTime() <= at.getTime()) {
    for (const transition of transitions) {
      if (STATUT_RANK[transition.statut] >= STATUT_RANK[statut]) {
        statut = transition.statut;
      }
    }
    if (transitions.length === 0 && c.statut !== "a_postuler") {
      statut = "cv_envoye";
    }
  }

  if (statut === "cv_envoye" && c.cvEnvoyeAt) {
    const cv = new Date(c.cvEnvoyeAt);
    if (at.getTime() - cv.getTime() >= SANS_REPONSE_DAYS * MS_DAY) {
      statut = "sans_reponse";
    }
  }

  if (c.statut === "sans_reponse" && statut !== "refus" && statut !== "offre") {
    if (c.cvEnvoyeAt) {
      const cv = new Date(c.cvEnvoyeAt);
      if (at.getTime() - cv.getTime() >= SANS_REPONSE_DAYS * MS_DAY) {
        statut = "sans_reponse";
      }
    } else if (c.statut === "sans_reponse") {
      statut = "sans_reponse";
    }
  }

  return statut;
}

export function isInProgressForMonth(
  c: Candidature,
  year: number,
  month: number,
  now: Date = new Date()
): boolean {
  const bounds = getMonthBounds(year, month, now);

  if (bounds.isPartial) {
    return isCandidatureInProgress(c);
  }

  const endOfMonth = getEndOfMonthExclusive(year, month);
  endOfMonth.setMilliseconds(endOfMonth.getMilliseconds() - 1);
  const statutAtEnd = getStatutAtDate(c, endOfMonth);
  return !TERMINAL_STATUTS.includes(statutAtEnd);
}

export function computeMonthlyStats(
  candidaturesDuMois: Candidature[],
  year: number,
  month: number,
  now: Date = new Date()
): MonthlyReportStats {
  const { start, end } = getMonthBounds(year, month, now);
  const at = new Date(end.getTime() - 1);

  const envoyees = candidaturesDuMois.filter((c) =>
    isCvSentInPeriod(c, start, end)
  );
  const enCours = candidaturesDuMois.filter((c) =>
    isInProgressForMonth(c, year, month, now)
  );
  const entretiens = candidaturesDuMois.filter((c) =>
    hadInterviewInPeriod(c, start, end)
  ).length;

  const total = candidaturesDuMois.length;
  const envoyeesCount = envoyees.length;

  const refusCount = candidaturesDuMois.filter((c) =>
    hadRefusInPeriod(c, start, end)
  ).length;

  const sansReponseCount = candidaturesDuMois.filter((c) =>
    hadSansReponseInPeriod(c, at)
  ).length;

  const offres = candidaturesDuMois.filter((c) => c.statut === "offre").length;

  const tauxRefus = total > 0 ? Math.round((refusCount / total) * 100) : 0;
  const tauxSansReponse =
    total > 0 ? Math.round((sansReponseCount / total) * 100) : 0;

  const repartitionSource = Object.fromEntries(
    SOURCE_KEYS.map((source) => [
      source,
      candidaturesDuMois.filter((c) => c.source === source).length,
    ])
  ) as Record<SourceCandidature, number>;

  return {
    candidaturesEnvoyees: envoyeesCount,
    enCours: enCours.length,
    entretiens,
    offres,
    tauxRefus,
    tauxSansReponse,
    repartitionSource,
  };
}

export function groupCandidaturesByWeek(
  candidaturesDuMois: Candidature[],
  year: number,
  month: number
): MonthlyReportWeek[] {
  const mondays = getISOWeeksInMonth(year, month);
  const byWeek = new Map<string, Candidature[]>();

  for (const monday of mondays) {
    byWeek.set(toDateKey(monday), []);
  }

  for (const c of candidaturesDuMois) {
    const dateStr = getCandidatureDate(c);
    if (!dateStr) continue;
    const monday = getMondayOfWeek(new Date(dateStr));
    const key = toDateKey(monday);
    if (!byWeek.has(key)) {
      byWeek.set(key, []);
    }
    byWeek.get(key)!.push(c);
  }

  return mondays.map((monday, weekIndex) => {
    const key = toDateKey(monday);
    const list = (byWeek.get(key) ?? []).sort((a, b) => {
      const da = getCandidatureDate(a) ?? "";
      const db = getCandidatureDate(b) ?? "";
      return da.localeCompare(db);
    });
    return {
      weekStart: key,
      weekLabel: formatWeekLabelInMonth(monday, weekIndex),
      candidatures: list.map(buildPublicShareSnapshot),
    };
  });
}

export function buildMonthlyReportSnapshot(
  candidatures: Candidature[],
  year: number,
  month: number,
  now: Date = new Date()
): MonthlyReportSnapshot {
  const bounds = getMonthBounds(year, month, now);
  const duMois = filterCandidaturesInMonth(candidatures, year, month, now);

  return {
    year,
    month,
    monthLabel: formatMonthLabel(year, month),
    isPartial: bounds.isPartial,
    partialUntil: bounds.partialUntil,
    stats: computeMonthlyStats(duMois, year, month, now),
    weeks: groupCandidaturesByWeek(duMois, year, month),
    snapshotAt: now.toISOString(),
  };
}

export function getMonthlyReportUrl(token: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/bilan/${token}`;
}

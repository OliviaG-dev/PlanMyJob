import { useEffect, useMemo, useState } from "react";
import { fetchCandidatures } from "../lib/candidatures";
import { fetchCvRessources } from "../lib/cvRessources";
import {
  fetchJobSites,
  fetchUserJobSiteStatus,
  type JobSite,
  type UserJobSiteStatus,
} from "../lib/jobSites";
import { fetchProjets } from "../lib/projets";
import { fetchTaches } from "../lib/taches";
import { getWeeklyGoals } from "../lib/userGoals";
import type { Candidature, SourceCandidature, Statut, TypeContrat } from "../types/candidature";
import type { Tache } from "../types/tache";
import { isCandidatureInProgress } from "../utils/candidatureStatus";

type DashboardDataState = {
  candidatures: Candidature[];
  taches: Tache[];
  projets: Awaited<ReturnType<typeof fetchProjets>>;
  cvs: Awaited<ReturnType<typeof fetchCvRessources>>;
  jobSites: JobSite[];
  userSiteStatus: UserJobSiteStatus[];
};

export type DashboardStats = {
  candidaturesEnvoyees: number;
  enCours: number;
  entretiens: number;
  tauxReponse: number;
  tauxRefus: number;
  offres: number;
  sansReponse: number;
  candidaturesCetteSemaine: number;
  candidaturesCeMois: number;
  tachesAFaire: number;
  tachesTermineesSemaine: number;
  projetsCount: number;
  cvsCount: number;
  repartitionStatut: Record<Statut, number>;
  repartitionSource: Record<SourceCandidature, number>;
  repartitionTypeContrat: Record<TypeContrat, number>;
  joursDepuisDerniereCandidature: number | null;
  sitesUtilises: number;
  totalSites: number;
};

const EMPTY_DASHBOARD_DATA: DashboardDataState = {
  candidatures: [],
  taches: [],
  projets: [],
  cvs: [],
  jobSites: [],
  userSiteStatus: [],
};

const EMPTY_STATS: DashboardStats = {
  candidaturesEnvoyees: 0,
  enCours: 0,
  entretiens: 0,
  tauxReponse: 0,
  tauxRefus: 0,
  offres: 0,
  sansReponse: 0,
  candidaturesCetteSemaine: 0,
  candidaturesCeMois: 0,
  tachesAFaire: 0,
  tachesTermineesSemaine: 0,
  projetsCount: 0,
  cvsCount: 0,
  repartitionStatut: {
    a_postuler: 0,
    cv_envoye: 0,
    entretien_rh: 0,
    entretien_technique: 0,
    attente_reponse: 0,
    refus: 0,
    sans_reponse: 0,
    offre: 0,
  },
  repartitionSource: {
    linkedin: 0,
    indeed: 0,
    france_travail: 0,
    welcome_to_the_jungle: 0,
    hellowork: 0,
    site_entreprise: 0,
    autre: 0,
  },
  repartitionTypeContrat: {
    cdi: 0,
    cdd: 0,
    alternance: 0,
    stage: 0,
    freelance: 0,
    autre: 0,
  },
  joursDepuisDerniereCandidature: null,
  sitesUtilises: 0,
  totalSites: 0,
};

function getMondayOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getCurrentWeekStart(): string {
  return toDateKey(getMondayOfWeek(new Date()));
}

function isDateInWeek(isoDateStr: string | undefined, weekStart: string): boolean {
  if (!isoDateStr) return false;
  const d = new Date(isoDateStr);
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}

function isDateInMonth(isoDateStr: string | undefined, year: number, month: number): boolean {
  if (!isoDateStr) return false;
  const d = new Date(isoDateStr);
  return d.getFullYear() === year && d.getMonth() === month;
}

function daysSince(dateIso: string | undefined): number | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  return diff >= 0 ? diff : null;
}

export function useDashboardData(userId: string | undefined) {
  const [data, setData] = useState<DashboardDataState>(EMPTY_DASHBOARD_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekStart = useMemo(() => getCurrentWeekStart(), []);
  const weeklyGoals = useMemo(() => getWeeklyGoals(userId), [userId]);

  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => {
        setData(EMPTY_DASHBOARD_DATA);
        setLoading(false);
        setError(null);
      });
      return () => {};
    }

    let cancelled = false;
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    Promise.all([
      fetchCandidatures(userId),
      fetchTaches(userId, [weekStart]),
      fetchProjets(userId),
      fetchCvRessources(userId),
      fetchJobSites(),
      fetchUserJobSiteStatus(userId),
    ])
      .then(([candidatures, taches, projets, cvs, jobSites, userSiteStatus]) => {
        if (cancelled) return;
        setData({
          candidatures,
          taches,
          projets,
          cvs,
          jobSites,
          userSiteStatus,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setData(EMPTY_DASHBOARD_DATA);
          setError(err?.message ?? "Erreur de chargement");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, weekStart]);

  const stats = useMemo<DashboardStats>(() => {
    if (!userId) return EMPTY_STATS;

    const { candidatures, taches, projets, cvs, jobSites, userSiteStatus } = data;
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();

    const cvEnvoye = candidatures.filter((c) => c.statut !== "a_postuler");
    const enCours = candidatures.filter(
      (c) => c.statut !== "sans_reponse" && isCandidatureInProgress(c),
    );
    const avecEntretien = candidatures.filter((c) =>
      ["entretien_rh", "entretien_technique"].includes(c.statut),
    );
    const avecEntretienOuOffre = candidatures.filter((c) =>
      ["entretien_rh", "entretien_technique", "attente_reponse", "offre"].includes(c.statut),
    );
    const refus = candidatures.filter((c) => c.statut === "refus");
    const sansReponse = candidatures.filter((c) => c.statut === "sans_reponse");
    const offres = candidatures.filter((c) => c.statut === "offre");
    const totalEnvoyees = cvEnvoye.length;
    const tauxReponse =
      totalEnvoyees > 0 ? Math.round((avecEntretienOuOffre.length / totalEnvoyees) * 100) : 0;
    const tauxRefus =
      candidatures.length > 0 ? Math.round((refus.length / candidatures.length) * 100) : 0;

    const candidaturesCetteSemaine = candidatures.filter((c) =>
      isDateInWeek(c.dateCandidature ?? c.createdAt, weekStart),
    ).length;
    const candidaturesCeMois = candidatures.filter((c) =>
      isDateInMonth(c.dateCandidature ?? c.createdAt, thisYear, thisMonth),
    ).length;

    const tachesSemaine = taches.filter((t) => t.semaineDebut === weekStart);
    const tachesAFaire = tachesSemaine.filter((t) => !t.terminee).length;
    const tachesTermineesSemaine = tachesSemaine.filter((t) => t.terminee).length;

    const repartitionStatut = Object.fromEntries(
      (
        [
          "a_postuler",
          "cv_envoye",
          "entretien_rh",
          "entretien_technique",
          "attente_reponse",
          "refus",
          "sans_reponse",
          "offre",
        ] as const
      ).map((s) => [s, candidatures.filter((c) => c.statut === s).length]),
    ) as Record<Statut, number>;

    const repartitionSource = Object.fromEntries(
      (
        [
          "linkedin",
          "indeed",
          "france_travail",
          "welcome_to_the_jungle",
          "hellowork",
          "site_entreprise",
          "autre",
        ] as const
      ).map((s) => [s, candidatures.filter((c) => c.source === s).length]),
    ) as Record<SourceCandidature, number>;

    const repartitionTypeContrat = Object.fromEntries(
      (["cdi", "cdd", "alternance", "stage", "freelance", "autre"] as const).map((t) => [
        t,
        candidatures.filter((c) => c.typeContrat === t).length,
      ]),
    ) as Record<TypeContrat, number>;

    const lastCandidatureDate = candidatures
      .map((c) => c.dateCandidature ?? c.createdAt ?? c.cvEnvoyeAt)
      .filter(Boolean)
      .sort()
      .reverse()[0] as string | undefined;
    const joursDepuisDerniereCandidature = daysSince(lastCandidatureDate);

    const usedSiteIds = new Set(
      userSiteStatus.filter((s) => s.accountCreated || s.cvSent).map((s) => s.jobSiteId),
    );
    const sitesUtilises = jobSites.filter((s) => usedSiteIds.has(s.id)).length;

    return {
      candidaturesEnvoyees: totalEnvoyees,
      enCours: enCours.length,
      entretiens: avecEntretien.length,
      tauxReponse,
      tauxRefus,
      offres: offres.length,
      sansReponse: sansReponse.length,
      candidaturesCetteSemaine,
      candidaturesCeMois,
      tachesAFaire,
      tachesTermineesSemaine,
      projetsCount: projets.length,
      cvsCount: cvs.length,
      repartitionStatut,
      repartitionSource,
      repartitionTypeContrat,
      joursDepuisDerniereCandidature,
      sitesUtilises,
      totalSites: jobSites.length,
    };
  }, [data, userId, weekStart]);

  return {
    loading,
    error,
    weeklyGoals,
    stats,
  };
}

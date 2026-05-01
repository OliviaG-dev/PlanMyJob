import { useEffect, useState } from "react";
import {
  fetchJobSites,
  fetchUserJobSiteStatus,
  upsertUserJobSiteStatus,
  insertJobSite,
  deleteJobSite,
} from "../lib/jobSites";
import type { JobSite } from "../lib/jobSites";

const SITES_EMPLOI_STORAGE_KEY = "plan-my-job-sites-emploi";

export type SiteCheckboxesState = Record<
  string,
  { created: boolean; cvSent: boolean }
>;

function loadSiteCheckboxesFromStorage(): SiteCheckboxesState {
  try {
    const raw = localStorage.getItem(SITES_EMPLOI_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: SiteCheckboxesState = {};
    Object.entries(parsed).forEach(([id, value]) => {
      if (value && typeof value === "object") {
        const obj = value as Record<string, unknown>;
        const created = obj.created === true;
        const cvSent = obj.cvSent === true || obj.updated === true;
        next[id] = { created, cvSent };
      }
    });
    return next;
  } catch {
    return {};
  }
}

export function useJobSites(userId: string | undefined) {
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [siteCheckboxes, setSiteCheckboxes] = useState<SiteCheckboxesState>(
    loadSiteCheckboxesFromStorage
  );
  const [sitesError, setSitesError] = useState<string | null>(null);

  useEffect(() => {
    setSitesError(null);
    fetchJobSites()
      .then(setJobSites)
      .catch((err) => {
        setJobSites([]);
        setSitesError(
          err instanceof Error ? err.message : "Impossible de charger les sites"
        );
      })
      .finally(() => setLoadingSites(false));
  }, []);

  useEffect(() => {
    if (jobSites.length === 0) return;
    setSiteCheckboxes((prev) => {
      const next: SiteCheckboxesState = {};
      jobSites.forEach((site) => {
        next[site.id] = prev[site.id] ?? { created: false, cvSent: false };
      });
      try {
        localStorage.setItem(SITES_EMPLOI_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore local storage failures
      }
      return next;
    });
  }, [jobSites]);

  useEffect(() => {
    if (!userId || jobSites.length === 0) return;
    setSitesError(null);
    fetchUserJobSiteStatus(userId)
      .then((statusList) => {
        setSiteCheckboxes((prev) => {
          const next = { ...prev };
          statusList.forEach((status) => {
            if (next[status.jobSiteId] !== undefined) {
              next[status.jobSiteId] = {
                created: status.accountCreated,
                cvSent: status.cvSent,
              };
            }
          });
          return next;
        });
      })
      .catch((err) => {
        setSitesError(
          err instanceof Error
            ? err.message
            : "Impossible de synchroniser les statuts des sites"
        );
      });
  }, [userId, jobSites]);

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
        // ignore local storage failures
      }

      if (userId) {
        setSitesError(null);
        upsertUserJobSiteStatus(userId, siteId, {
          accountCreated: field === "created" ? value : current.created,
          cvSent: field === "cvSent" ? value : current.cvSent,
        }).catch((err) => {
          setSitesError(
            err instanceof Error
              ? err.message
              : "Impossible de mettre a jour le statut du site"
          );
        });
      }
      return next;
    });
  };

  const addSite = async (label: string, url: string): Promise<boolean> => {
    setSitesError(null);
    try {
      const site = await insertJobSite({ label, url });
      setJobSites((prev) => [...prev, site].sort((a, b) => a.position - b.position));
      return true;
    } catch (err) {
      setSitesError(
        err instanceof Error ? err.message : "Impossible d'ajouter ce site"
      );
      return false;
    }
  };

  const removeSite = async (siteId: string): Promise<boolean> => {
    setSitesError(null);
    try {
      await deleteJobSite(siteId);
      setJobSites((prev) => prev.filter((site) => site.id !== siteId));
      setSiteCheckboxes((prev) => {
        const next = { ...prev };
        delete next[siteId];
        try {
          localStorage.setItem(SITES_EMPLOI_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore local storage failures
        }
        return next;
      });
      return true;
    } catch (err) {
      setSitesError(
        err instanceof Error ? err.message : "Impossible de supprimer ce site"
      );
      return false;
    }
  };

  return {
    jobSites,
    loadingSites,
    siteCheckboxes,
    sitesError,
    setSiteCheckbox,
    addSite,
    removeSite,
  };
}

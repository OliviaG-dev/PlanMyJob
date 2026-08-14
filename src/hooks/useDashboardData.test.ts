/* @vitest-environment jsdom */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDashboardData } from "./useDashboardData";

vi.mock("../lib/candidatures", () => ({
  fetchCandidatures: vi.fn(),
}));

vi.mock("../lib/cvRessources", () => ({
  fetchCvRessources: vi.fn(),
}));

vi.mock("../lib/jobSites", () => ({
  fetchJobSites: vi.fn(),
  fetchUserJobSiteStatus: vi.fn(),
}));

vi.mock("../lib/projets", () => ({
  fetchProjets: vi.fn(),
}));

vi.mock("../lib/taches", () => ({
  fetchTaches: vi.fn(),
}));

vi.mock("../lib/userGoals", () => ({
  getWeeklyGoals: vi.fn(() => ({
    candidatures: 5,
    candidaturesMois: 20,
  })),
}));

import { fetchCandidatures } from "../lib/candidatures";
import { fetchCvRessources } from "../lib/cvRessources";
import { fetchJobSites, fetchUserJobSiteStatus } from "../lib/jobSites";
import { fetchProjets } from "../lib/projets";
import { fetchTaches } from "../lib/taches";

describe("useDashboardData", () => {
  it("computes dashboard stats from fetched data", async () => {
    vi.mocked(fetchCandidatures).mockResolvedValue([
      {
        id: "c1",
        entreprise: "Alpha",
        poste: "Dev",
        statut: "cv_envoye",
        statutSuivi: "en_cours",
        source: "linkedin",
        typeContrat: "cdi",
        dateCandidature: "2026-08-10",
        cvEnvoyeAt: new Date().toISOString(),
      },
    ] as never);
    vi.mocked(fetchTaches).mockResolvedValue([]);
    vi.mocked(fetchProjets).mockResolvedValue([]);
    vi.mocked(fetchCvRessources).mockResolvedValue([]);
    vi.mocked(fetchJobSites).mockResolvedValue([
      { id: "s1", label: "LinkedIn", url: "https://linkedin.com", position: 0 },
    ] as never);
    vi.mocked(fetchUserJobSiteStatus).mockResolvedValue([
      { jobSiteId: "s1", accountCreated: true, cvSent: true },
    ] as never);

    const { result } = renderHook(() => useDashboardData("u1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats.candidaturesEnvoyees).toBe(1);
    expect(result.current.stats.enCours).toBe(1);
    expect(result.current.stats.sitesUtilises).toBe(1);
  });
});

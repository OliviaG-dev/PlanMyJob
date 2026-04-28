/* @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../lib/candidatures", () => ({
  fetchCandidatures: vi.fn(),
}));
vi.mock("../../lib/taches", () => ({
  fetchTaches: vi.fn(),
}));
vi.mock("../../lib/projets", () => ({
  fetchProjets: vi.fn(),
}));
vi.mock("../../lib/cvRessources", () => ({
  fetchCvRessources: vi.fn(),
}));
vi.mock("../../lib/jobSites", () => ({
  fetchJobSites: vi.fn(),
  fetchUserJobSiteStatus: vi.fn(),
}));
vi.mock("../../lib/userGoals", () => ({
  getWeeklyGoals: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import { fetchCandidatures } from "../../lib/candidatures";
import { fetchTaches } from "../../lib/taches";
import { fetchProjets } from "../../lib/projets";
import { fetchCvRessources } from "../../lib/cvRessources";
import { fetchJobSites, fetchUserJobSiteStatus } from "../../lib/jobSites";
import { getWeeklyGoals } from "../../lib/userGoals";

describe("Dashboard page", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1" },
      loading: false,
    } as never);
    vi.mocked(fetchCandidatures).mockResolvedValue([]);
    vi.mocked(fetchTaches).mockResolvedValue([]);
    vi.mocked(fetchProjets).mockResolvedValue([]);
    vi.mocked(fetchCvRessources).mockResolvedValue([]);
    vi.mocked(fetchJobSites).mockResolvedValue([]);
    vi.mocked(fetchUserJobSiteStatus).mockResolvedValue([]);
    vi.mocked(getWeeklyGoals).mockReturnValue({
      candidatures: 5,
      candidaturesMois: 20,
      taches: 10,
    });
  });

  it("renders dashboard heading and main stats block", async () => {
    render(<Dashboard />);

    expect(screen.getByRole("heading", { name: "Tableau de bord" })).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("Candidatures envoyées")).toBeTruthy();
    });
  });

  it("renders loading state before data resolves", () => {
    vi.mocked(fetchCandidatures).mockImplementation(() => new Promise(() => {}));
    render(<Dashboard />);
    expect(screen.getByText("Chargement…")).toBeTruthy();
  });

  it("renders error state when loading fails", async () => {
    vi.mocked(fetchCandidatures).mockRejectedValue(new Error("boom"));
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("boom")).toBeTruthy();
    });
  });

  it("renders no-user state without crashing", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false } as never);
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("Candidatures envoyées")).toBeTruthy();
    });
    expect(fetchCandidatures).not.toHaveBeenCalled();
  });

  it("renders computed metrics from loaded data", async () => {
    const today = new Date().toISOString();
    vi.mocked(fetchCandidatures).mockResolvedValue([
      {
        id: "c1",
        statut: "cv_envoye",
        statutSuivi: "en_cours",
        source: "linkedin",
        typeContrat: "cdi",
        dateCandidature: today,
        createdAt: today,
      },
      {
        id: "c2",
        statut: "entretien_rh",
        statutSuivi: "en_cours",
        source: "indeed",
        typeContrat: "cdd",
        dateCandidature: today,
        createdAt: today,
      },
      {
        id: "c3",
        statut: "refus",
        statutSuivi: "terminee",
        source: "autre",
        typeContrat: "autre",
        dateCandidature: today,
        createdAt: today,
      },
    ] as never);
    vi.mocked(fetchTaches).mockResolvedValue([
      { id: "t1", terminee: false },
      { id: "t2", terminee: true },
    ] as never);
    vi.mocked(fetchProjets).mockResolvedValue([{ id: "p1" }] as never);
    vi.mocked(fetchCvRessources).mockResolvedValue([{ id: "cv1" }] as never);
    vi.mocked(fetchJobSites).mockResolvedValue([
      { id: "site1", label: "LinkedIn", url: "", position: 0 },
      { id: "site2", label: "Indeed", url: "", position: 1 },
    ] as never);
    vi.mocked(fetchUserJobSiteStatus).mockResolvedValue([
      { jobSiteId: "site1", accountCreated: true, cvSent: false },
    ] as never);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Taux de réponse")).toBeTruthy();
    });
    expect(screen.getAllByText("33%").length).toBeGreaterThan(0);
    expect(screen.getByText("1 / 2")).toBeTruthy();
  });
});

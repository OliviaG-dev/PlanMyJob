/* @vitest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

import { useAuth } from "../../contexts/AuthContext";
import { fetchCandidatures } from "../../lib/candidatures";
import { fetchTaches } from "../../lib/taches";
import { fetchProjets } from "../../lib/projets";
import { fetchCvRessources } from "../../lib/cvRessources";
import { fetchJobSites, fetchUserJobSiteStatus } from "../../lib/jobSites";

describe("Dashboard page", () => {
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
  });

  it("renders dashboard heading and main stats block", async () => {
    render(<Dashboard />);

    expect(screen.getByRole("heading", { name: "Tableau de bord" })).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("Candidatures envoyées")).toBeTruthy();
    });
  });
});

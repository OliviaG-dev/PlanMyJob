/* @vitest-environment jsdom */
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Kanban from "./Kanban";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../lib/candidatures", () => ({
  fetchCandidatures: vi.fn(),
  updateCandidature: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import { fetchCandidatures, updateCandidature } from "../../lib/candidatures";

describe("Kanban interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1" },
      loading: false,
    } as never);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("auto-moves old cv_envoye candidatures to sans_reponse", async () => {
    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    vi.mocked(fetchCandidatures).mockResolvedValue([
      {
        id: "c1",
        entreprise: "ACME",
        poste: "Dev",
        statut: "cv_envoye",
        statutSuivi: "en_cours",
        cvEnvoyeAt: oldDate,
      },
    ] as never);
    vi.mocked(updateCandidature).mockResolvedValue({
      id: "c1",
      entreprise: "ACME",
      poste: "Dev",
      statut: "sans_reponse",
      statutSuivi: "terminee",
    } as never);

    render(
      <MemoryRouter>
        <Kanban />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(updateCandidature).toHaveBeenCalledWith("u1", "c1", {
        statut: "sans_reponse",
        statutSuivi: "terminee",
      });
    });
  });

  it("moves a candidature to another kanban column from mobile menu", async () => {
    const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.mocked(fetchCandidatures).mockResolvedValue([
      {
        id: "c2",
        entreprise: "Beta",
        poste: "Dev",
        statut: "cv_envoye",
        statutSuivi: "en_cours",
        cvEnvoyeAt: recentDate,
      },
    ] as never);
    vi.mocked(updateCandidature).mockResolvedValue({
      id: "c2",
      entreprise: "Beta",
      poste: "Dev",
      statut: "entretien_rh",
      statutSuivi: "en_cours",
    } as never);

    render(
      <MemoryRouter>
        <Kanban />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Beta")).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Déplacer" })[0]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Entretien RH" }));

    await waitFor(() => {
      expect(updateCandidature).toHaveBeenCalledWith("u1", "c2", {
        statut: "entretien_rh",
      });
    });
  });

  it("paginates CV envoye column and filters by name", async () => {
    vi.mocked(fetchCandidatures).mockResolvedValue([
      { id: "k1", entreprise: "Alpha", poste: "Dev", statut: "cv_envoye", statutSuivi: "en_cours" },
      { id: "k2", entreprise: "Bravo", poste: "Dev", statut: "cv_envoye", statutSuivi: "en_cours" },
      { id: "k3", entreprise: "Charlie", poste: "Dev", statut: "cv_envoye", statutSuivi: "en_cours" },
      { id: "k4", entreprise: "Delta", poste: "Dev", statut: "cv_envoye", statutSuivi: "en_cours" },
      { id: "k5", entreprise: "Echo", poste: "Dev", statut: "cv_envoye", statutSuivi: "en_cours" },
      { id: "k6", entreprise: "Foxtrot", poste: "Dev", statut: "cv_envoye", statutSuivi: "en_cours" },
    ] as never);

    render(
      <MemoryRouter>
        <Kanban />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeTruthy();
    });
    expect(screen.queryByText("Foxtrot")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Page suivante" }));
    await waitFor(() => {
      expect(screen.getByText("Foxtrot")).toBeTruthy();
    });

    fireEvent.change(screen.getAllByPlaceholderText("Entreprise ou poste")[0], {
      target: { value: "fox" },
    });
    await waitFor(() => {
      expect(screen.getByText("Foxtrot")).toBeTruthy();
    });
    expect(screen.queryByText("Alpha")).toBeNull();
  });
});

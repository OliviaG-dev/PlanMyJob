/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CandidatureDetail from "./CandidatureDetail";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../lib/candidatures", () => ({
  fetchCandidature: vi.fn(),
  updateCandidature: vi.fn(),
  deleteCandidature: vi.fn(),
}));

vi.mock("../../components/ShareModal/ShareModal", () => ({
  default: () => null,
}));

import { useAuth } from "../../contexts/AuthContext";
import {
  fetchCandidature,
  updateCandidature,
} from "../../lib/candidatures";

const baseCandidature = {
  id: "c1",
  entreprise: "Activus Group",
  poste: "Développeur Full Stack H/F",
  statut: "cv_envoye" as const,
  statutSuivi: "en_cours" as const,
  typeContrat: "cdi" as const,
  teletravail: "hybride" as const,
  source: "hellowork" as const,
  localisation: "Toulouse - 31",
  dateCandidature: "2026-04-28",
  notePersonnelle: 3,
  createdAt: "2026-04-28T00:00:00.000Z",
  cvEnvoyeAt: new Date().toISOString(),
};

function renderDetail(route = "/candidatures/c1") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/candidatures/:id" element={<CandidatureDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CandidatureDetail", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1" },
      loading: false,
    } as never);
    vi.mocked(fetchCandidature).mockResolvedValue(baseCandidature as never);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("displays candidature details with current kanban statut", async () => {
    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Activus Group" })).toBeTruthy();
    });

    expect(screen.getByText("Développeur Full Stack H/F")).toBeTruthy();
    expect(screen.getByText("CV envoyé")).toBeTruthy();
    expect(screen.getByText("En cours")).toBeTruthy();
  });

  it("updates kanban statut from the edit modal", async () => {
    vi.mocked(updateCandidature).mockResolvedValue({
      ...baseCandidature,
      statut: "entretien_rh",
    } as never);

    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Modifier" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Modifier la candidature" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Kanban" }));
    fireEvent.click(screen.getByRole("option", { name: "Entretien RH" }));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(updateCandidature).toHaveBeenCalledWith(
        "u1",
        "c1",
        expect.objectContaining({
          statut: "entretien_rh",
          statutSuivi: "en_cours",
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Entretien RH")).toBeTruthy();
    });
    expect(screen.queryByRole("heading", { name: "Modifier la candidature" })).toBeNull();
  });
});

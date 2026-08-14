/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "../../src/components/Layout/Layout";
import type { Candidature } from "../../src/types/candidature";
import type { AddCandidatureFormData } from "../../src/types/candidatureForm.types";
import Analyse from "../../src/pages/Analyse/Analyse";
import Candidatures from "../../src/pages/Candidatures/Candidatures";
import Kanban from "../../src/pages/Kanban/Kanban";
import { HELLOWORK_BASIC_OFFER_FIXTURE } from "../../src/lib/testFixtures";
import { expectCandidatureInKanbanColumn } from "../helpers/assertions";

vi.mock("../../src/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../src/contexts/ThemeContext", () => ({
  useTheme: vi.fn(),
}));
vi.mock("../../src/lib/candidatures", () => ({
  fetchCandidatures: vi.fn(),
  insertCandidature: vi.fn(),
  updateCandidature: vi.fn(),
}));

import { useAuth } from "../../src/contexts/AuthContext";
import { useTheme } from "../../src/contexts/ThemeContext";
import {
  fetchCandidatures,
  insertCandidature,
  updateCandidature,
} from "../../src/lib/candidatures";

let storedCandidatures: Candidature[] = [];

function formDataToCandidature(data: AddCandidatureFormData): Candidature {
  return {
    id: "c-imported",
    entreprise: data.entreprise,
    poste: data.poste,
    lienOffre: data.lienOffre || undefined,
    localisation: data.localisation || undefined,
    typeContrat: data.typeContrat,
    teletravail: data.teletravail,
    source: data.source,
    notePersonnelle: data.notePersonnelle,
    statut: data.statut,
    statutSuivi: data.statutSuivi,
    salaireOuFourchette: data.salaireOuFourchette || undefined,
    notes: data.notes || undefined,
    competences: data.competences || undefined,
    dateCandidature: data.dateCandidature,
    createdAt: new Date().toISOString(),
    cvEnvoyeAt:
      data.statut === "cv_envoye" ? new Date().toISOString() : undefined,
  };
}

function renderApplicationFlow(initialPath = "/analyse") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="analyse" element={<Analyse />} />
          <Route path="candidatures" element={<Candidatures />} />
          <Route path="kanban" element={<Kanban />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function setupApplicationMocks() {
  storedCandidatures = [];

  vi.mocked(useAuth).mockReturnValue({
    user: { id: "u1", email: "user@example.com" },
    loading: false,
    signOut: vi.fn(),
  } as never);

  vi.mocked(useTheme).mockReturnValue({
    theme: "light",
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  });

  vi.mocked(fetchCandidatures).mockImplementation(async () => [
    ...storedCandidatures,
  ]);

  vi.mocked(insertCandidature).mockImplementation(async (_userId, data) => {
    const created = formDataToCandidature(data);
    storedCandidatures = [created, ...storedCandidatures];
    return created;
  });

  vi.mocked(updateCandidature).mockImplementation(async (_userId, id, payload) => {
    const current = storedCandidatures.find((c) => c.id === id);
    if (!current) {
      throw new Error(`Candidature ${id} not found`);
    }
    const updated = { ...current, ...payload };
    storedCandidatures = storedCandidatures.map((c) =>
      c.id === id ? updated : c,
    );
    return updated;
  });

  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

async function importOfferThroughAnalysePage() {
  fireEvent.change(
    screen.getByPlaceholderText(/Collez ici le texte complet/i),
    { target: { value: HELLOWORK_BASIC_OFFER_FIXTURE } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Extraire les informations" }),
  );

  await waitFor(() => {
    expect(screen.getByText("Informations extraites")).toBeTruthy();
    expect(screen.getByDisplayValue("Activus Group")).toBeTruthy();
  });

  fireEvent.click(screen.getByRole("button", { name: "Créer une candidature" }));

  await waitFor(() => {
    expect(screen.getByRole("heading", { name: "Candidatures" })).toBeTruthy();
    expect(screen.getByDisplayValue("Développeur Full Stack H/F")).toBeTruthy();
  });

  fireEvent.click(screen.getByRole("button", { name: "Ajouter la candidature" }));

  await waitFor(() => {
    expect(insertCandidature).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        entreprise: "Activus Group",
        poste: "Développeur Full Stack H/F",
        statut: "cv_envoye",
        source: "hellowork",
      }),
    );
  });
}

describe("application flow e2e", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setupApplicationMocks();
  });

  it("creates a candidature from an imported offer in the UI", async () => {
    renderApplicationFlow("/analyse");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Analyser une offre" })).toBeTruthy();
    });

    await importOfferThroughAnalysePage();

    await waitFor(() => {
      expect(screen.getByText("Activus Group")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("link", { name: "Kanban", hidden: true }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Kanban" })).toBeTruthy();
      expect(fetchCandidatures).toHaveBeenCalled();
    });

    expectCandidatureInKanbanColumn(screen, "CV envoyé", "Activus Group");
    expect(storedCandidatures).toHaveLength(1);
    expect(storedCandidatures[0]?.statut).toBe("cv_envoye");
  });
});

/* @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  extractOfferFromText,
  extractedToFormData,
} from "../../src/lib/offerAnalyzer";
import {
  HELLOWORK_BASIC_OFFER_FIXTURE,
  LINKEDIN_FULLSTACK_OFFER_FIXTURE,
} from "../../src/lib/testFixtures";
import Candidatures from "../../src/pages/Candidatures/Candidatures";
import Analyse from "../../src/pages/Analyse/Analyse";
import { expectOfferCoreFields } from "../helpers/assertions";

vi.mock("../../src/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../src/lib/candidatures", () => ({
  fetchCandidatures: vi.fn(),
  insertCandidature: vi.fn(),
  updateCandidature: vi.fn(),
}));

import { useAuth } from "../../src/contexts/AuthContext";
import {
  fetchCandidatures,
  insertCandidature,
} from "../../src/lib/candidatures";

const FIXTURES_DIR = join(process.cwd(), "tests/fixtures/offers");

function setupCandidaturesMocks() {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: "u1" },
    loading: false,
  } as never);
  vi.mocked(fetchCandidatures).mockResolvedValue([]);
  vi.mocked(insertCandidature).mockResolvedValue({
    id: "c-imported",
    entreprise: "Activus Group",
    poste: "Développeur Full Stack H/F",
    statut: "cv_envoye",
    statutSuivi: "en_cours",
    createdAt: "2026-04-28T00:00:00.000Z",
  } as never);
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function expectKanbanStatut(label: string) {
  const kanbanSelect = document.getElementById("add-statut");
  expect(kanbanSelect?.querySelector(".select__value")?.textContent).toBe(label);
}

describe("offer import integration", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setupCandidaturesMocks();
  });

  describe("extract and map", () => {
    it("maps HelloWork fixture file into form payload with cv_envoye statut", () => {
      const raw = readFileSync(
        join(FIXTURES_DIR, "hellowork-basic.txt"),
        "utf-8",
      );
      const extracted = extractOfferFromText(raw);
      const formData = extractedToFormData(extracted);

      expectOfferCoreFields(extracted, {
        poste: "Développeur Full Stack H/F",
        entreprise: "Activus Group",
        localisation: "Toulouse - 31",
        source: "hellowork",
      });
      expect(formData.statut).toBe("cv_envoye");
      expect(formData.statutSuivi).toBe("en_cours");
      expect(formData.lienOffre).toContain("hellowork.com");
      expect(formData.typeContrat).toBe("cdi");
    });

    it("maps LinkedIn fixture into form payload with cv_envoye statut", () => {
      const extracted = extractOfferFromText(LINKEDIN_FULLSTACK_OFFER_FIXTURE);
      const formData = extractedToFormData(extracted);

      expectOfferCoreFields(extracted, {
        poste: "Software engineer fullstack typescript - Cybersécurité",
        entreprise: "LITY",
        localisation: "Ville de Paris, Île-de-France, France",
        source: "linkedin",
      });
      expect(formData.statut).toBe("cv_envoye");
      expect(formData.typeContrat).toBe("cdi");
      expect(formData.teletravail).toBe("hybride");
    });
  });

  describe("Candidatures UI flow", () => {
    it("opens prefilled add modal from router state and submits imported offer", async () => {
      const formData = extractedToFormData(
        extractOfferFromText(HELLOWORK_BASIC_OFFER_FIXTURE),
      );

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/candidatures",
              state: { addWithInitialData: formData },
            },
          ]}
        >
          <Routes>
            <Route path="/candidatures" element={<Candidatures />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Activus Group")).toBeTruthy();
        expect(screen.getByDisplayValue("Développeur Full Stack H/F")).toBeTruthy();
      });

      expectKanbanStatut("CV envoyé");

      fireEvent.click(screen.getByRole("button", { name: "Ajouter la candidature" }));

      await waitFor(() => {
        expect(insertCandidature).toHaveBeenCalledWith(
          "u1",
          expect.objectContaining({
            entreprise: "Activus Group",
            poste: "Développeur Full Stack H/F",
            statut: "cv_envoye",
            statutSuivi: "en_cours",
            source: "hellowork",
            localisation: "Toulouse - 31",
          }),
        );
      });
    });
  });

  describe("Analyse to Candidatures flow", () => {
    it("creates a candidature from an imported offer through the Analyse page", async () => {
      render(
        <MemoryRouter initialEntries={["/analyse"]}>
          <Routes>
            <Route path="/analyse" element={<Analyse />} />
            <Route path="/candidatures" element={<Candidatures />} />
          </Routes>
        </MemoryRouter>,
      );

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
      expectKanbanStatut("CV envoyé");

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

      await waitFor(() => {
        expect(screen.getByText("Activus Group")).toBeTruthy();
      });
    });
  });
});

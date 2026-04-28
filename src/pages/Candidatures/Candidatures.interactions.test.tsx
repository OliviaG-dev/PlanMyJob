/* @vitest-environment jsdom */
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Candidatures from "./Candidatures";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../lib/candidatures", () => ({
  fetchCandidatures: vi.fn(),
  insertCandidature: vi.fn(),
  updateCandidature: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import {
  fetchCandidatures,
  insertCandidature,
  updateCandidature,
} from "../../lib/candidatures";

describe("Candidatures interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1" },
      loading: false,
    } as never);
    vi.mocked(fetchCandidatures).mockResolvedValue([]);
    vi.mocked(insertCandidature).mockResolvedValue({
      id: "c1",
      entreprise: "ACME",
      poste: "Developpeuse",
      statut: "a_postuler",
      statutSuivi: "en_cours",
      createdAt: "2026-04-28T00:00:00.000Z",
    } as never);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("adds a candidature from the modal", async () => {
    render(
      <MemoryRouter>
        <Candidatures />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Aucune candidature pour l'instant.")).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /Ajouter une candidature/i })[0]);
    fireEvent.change(screen.getByPlaceholderText("Nom de l'entreprise"), {
      target: { value: "ACME" },
    });
    fireEvent.change(screen.getByPlaceholderText("Intitulé du poste"), {
      target: { value: "Developpeuse" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter la candidature" }));

    await waitFor(() => {
      expect(insertCandidature).toHaveBeenCalled();
    });
    expect(screen.getByText("ACME")).toBeTruthy();
  });

  it("moves candidature to refus list on drop", async () => {
    vi.mocked(fetchCandidatures).mockResolvedValue([
      {
        id: "c1",
        entreprise: "ACME",
        poste: "Dev Front",
        statut: "a_postuler",
        statutSuivi: "en_cours",
        createdAt: "2026-04-28T00:00:00.000Z",
      },
    ] as never);
    vi.mocked(updateCandidature).mockResolvedValue({
      id: "c1",
      entreprise: "ACME",
      poste: "Dev Front",
      statut: "refus",
      statutSuivi: "terminee",
      createdAt: "2026-04-28T00:00:00.000Z",
    } as never);

    render(
      <MemoryRouter>
        <Candidatures />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("ACME")).toBeTruthy();
    });

    const refusSection = screen
      .getAllByRole("heading", { name: "Refus" })[0]
      .closest("section");
    const refusDropZone = refusSection?.querySelector(".candidatures__list");
    if (!refusDropZone) throw new Error("Refus drop zone not found");

    fireEvent.drop(refusDropZone, {
      dataTransfer: {
        getData: (type: string) =>
          type === "application/json" ? '{"id":"c1"}' : "c1",
      },
    });

    await waitFor(() => {
      expect(updateCandidature).toHaveBeenCalledWith("u1", "c1", {
        statut: "refus",
        statutSuivi: "terminee",
      });
    });
  });

  it("filters candidatures by search text and paginates en cours list", async () => {
    vi.mocked(fetchCandidatures).mockResolvedValue([
      {
        id: "c1",
        entreprise: "Alpha",
        poste: "Dev 1",
        statut: "a_postuler",
        statutSuivi: "en_cours",
        createdAt: "2026-04-28T00:00:00.000Z",
      },
      {
        id: "c2",
        entreprise: "Bravo",
        poste: "Dev 2",
        statut: "a_postuler",
        statutSuivi: "en_cours",
        createdAt: "2026-04-28T00:00:00.000Z",
      },
      {
        id: "c3",
        entreprise: "Charlie",
        poste: "Dev 3",
        statut: "a_postuler",
        statutSuivi: "en_cours",
        createdAt: "2026-04-28T00:00:00.000Z",
      },
      {
        id: "c4",
        entreprise: "Delta",
        poste: "Dev 4",
        statut: "a_postuler",
        statutSuivi: "en_cours",
        createdAt: "2026-04-28T00:00:00.000Z",
      },
    ] as never);

    render(
      <MemoryRouter>
        <Candidatures />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeTruthy();
    });
    expect(screen.queryByText("Delta")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Page suivante" }));
    await waitFor(() => {
      expect(screen.getByText("Delta")).toBeTruthy();
    });

    screen.getAllByPlaceholderText("Entreprise ou poste").forEach((input) => {
      fireEvent.change(input, { target: { value: "char" } });
    });
    await waitFor(() => {
      expect(screen.getByText("Charlie")).toBeTruthy();
    });
    expect(screen.queryByText("Alpha")).toBeNull();
  });

  it("shows error message when fetch fails", async () => {
    vi.mocked(fetchCandidatures).mockRejectedValue(new Error("Erreur chargement"));

    render(
      <MemoryRouter>
        <Candidatures />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Erreur chargement");
    });
  });

  it("moves refused candidature to en cours from mobile menu", async () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.mocked(fetchCandidatures).mockResolvedValue([
      {
        id: "c9",
        entreprise: "Refused Co",
        poste: "Dev",
        statut: "refus",
        statutSuivi: "terminee",
        createdAt: "2026-04-28T00:00:00.000Z",
      },
    ] as never);
    vi.mocked(updateCandidature).mockResolvedValue({
      id: "c9",
      entreprise: "Refused Co",
      poste: "Dev",
      statut: "a_postuler",
      statutSuivi: "en_cours",
      createdAt: "2026-04-28T00:00:00.000Z",
    } as never);

    render(
      <MemoryRouter>
        <Candidatures />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Refused Co")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Déplacer" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "En cours" }));

    await waitFor(() => {
      expect(updateCandidature).toHaveBeenCalledWith("u1", "c9", {
        statutSuivi: "en_cours",
        statut: "a_postuler",
      });
    });
  });
});

/* @vitest-environment jsdom */
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
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
vi.mock("../../components/CandidaturesFilters/CandidaturesFilters", () => ({
  default: () => null,
  filterCandidaturesByFilters: (items: unknown[]) => items,
}));
vi.mock("../../components/Pagination/Pagination", () => ({
  Pagination: () => null,
}));
vi.mock("./AddCandidatureModal", () => ({
  default: () => null,
}));

import { useAuth } from "../../contexts/AuthContext";
import { fetchCandidatures } from "../../lib/candidatures";

describe("Candidatures page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1" },
      loading: false,
    } as never);
    vi.mocked(fetchCandidatures).mockResolvedValue([]);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("shows empty state when user has no candidatures", async () => {
    render(
      <MemoryRouter>
        <Candidatures />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Aucune candidature pour l'instant."),
      ).toBeTruthy();
    });
  });
});

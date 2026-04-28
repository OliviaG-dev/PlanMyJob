/* @vitest-environment jsdom */
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Kanban from "./Kanban";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../lib/candidatures", () => ({
  fetchCandidatures: vi.fn(),
  updateCandidature: vi.fn(),
}));
vi.mock("../../components/CandidaturesFilters/CandidaturesFilters", () => ({
  default: () => null,
  filterCandidaturesByFilters: (items: unknown[]) => items,
}));
vi.mock("../../components/Pagination/Pagination", () => ({
  Pagination: () => null,
}));

import { useAuth } from "../../contexts/AuthContext";
import { fetchCandidatures } from "../../lib/candidatures";

describe("Kanban page", () => {
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

  it("shows empty state when no candidature exists", async () => {
    render(
      <MemoryRouter>
        <Kanban />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Aucune candidature. Ajoutez-en depuis la page Candidatures."),
      ).toBeTruthy();
    });
  });
});

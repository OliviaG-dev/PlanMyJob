/* @vitest-environment jsdom */
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Taches from "./Taches";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../lib/taches", () => ({
  fetchTaches: vi.fn(),
  insertTache: vi.fn(),
  updateTache: vi.fn(),
  deleteTache: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import { fetchTaches } from "../../lib/taches";

describe("Taches page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1" },
      loading: false,
    } as never);
    vi.mocked(fetchTaches).mockResolvedValue([]);
  });

  it("renders header and month navigation", async () => {
    render(
      <MemoryRouter>
        <Taches />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Tâches" })).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Ce mois" })).toBeTruthy();
    });
  });
});

/* @vitest-environment jsdom */
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
import { fetchTaches, insertTache, updateTache } from "../../lib/taches";

function getCurrentMondayKey(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

describe("Taches interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1" },
      loading: false,
    } as never);
    vi.mocked(fetchTaches).mockResolvedValue([
      {
        id: "t1",
        semaineDebut: getCurrentMondayKey(),
        titre: "Relancer RH",
        priorite: "normale",
        terminee: false,
        ordre: 0,
        createdAt: "2026-04-28T00:00:00.000Z",
        updatedAt: "2026-04-28T00:00:00.000Z",
      },
    ] as never);
    vi.mocked(updateTache).mockResolvedValue({
      id: "t1",
      semaineDebut: getCurrentMondayKey(),
      titre: "Relancer RH",
      priorite: "normale",
      terminee: true,
      ordre: 0,
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T00:00:00.000Z",
    } as never);
    vi.mocked(insertTache).mockResolvedValue({
      id: "t2",
      semaineDebut: getCurrentMondayKey(),
      titre: "Postuler ACME",
      priorite: "normale",
      terminee: false,
      ordre: 1,
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T00:00:00.000Z",
    } as never);
  });

  it("toggles a task as done", async () => {
    render(
      <MemoryRouter>
        <Taches />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Relancer RH")).toBeTruthy();
    });
    fireEvent.click(screen.getByLabelText(/Marquer « Relancer RH »/i));

    await waitFor(() => {
      expect(updateTache).toHaveBeenCalledWith("u1", "t1", { terminee: true });
    });
  });

  it("adds a new task from week block", async () => {
    render(
      <MemoryRouter>
        <Taches />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Relancer RH")).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /\+ Ajouter une tâche/i })[0]);
    fireEvent.change(screen.getByPlaceholderText("Nouvelle tâche…"), {
      target: { value: "Postuler ACME" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() => {
      expect(insertTache).toHaveBeenCalledWith(
        "u1",
        expect.objectContaining({ titre: "Postuler ACME" }),
      );
    });
  });
});

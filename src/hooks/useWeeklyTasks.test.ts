/* @vitest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWeeklyTasks } from "./useWeeklyTasks";

vi.mock("../lib/taches", () => ({
  fetchTaches: vi.fn(),
  updateTache: vi.fn(),
  deleteTache: vi.fn(),
}));

import { deleteTache, fetchTaches, updateTache } from "../lib/taches";

describe("useWeeklyTasks", () => {
  it("groups tasks by week", async () => {
    vi.mocked(fetchTaches).mockResolvedValue([
      {
        id: "t1",
        titre: "Relancer",
        semaineDebut: "2026-08-10",
        priorite: "haute",
        terminee: false,
      },
    ] as never);

    const { result } = renderHook(() =>
      useWeeklyTasks({ userId: "u1", semaineDebuts: ["2026-08-10"] }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.tachesByWeek.get("2026-08-10")).toHaveLength(1);
  });

  it("toggles and deletes an existing task", async () => {
    const task = {
      id: "t2",
      titre: "Nouvelle tâche",
      semaineDebut: "2026-08-10",
      priorite: "normale" as const,
      terminee: false,
      ordre: 0,
      createdAt: "2026-08-10T00:00:00.000Z",
      updatedAt: "2026-08-10T00:00:00.000Z",
    };
    vi.mocked(fetchTaches).mockResolvedValue([task] as never);
    vi.mocked(updateTache).mockResolvedValue({ ...task, terminee: true } as never);

    const { result } = renderHook(() =>
      useWeeklyTasks({ userId: "u1", semaineDebuts: ["2026-08-10"] }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleToggle(task);
    });
    expect(updateTache).toHaveBeenCalledWith("u1", "t2", { terminee: true });

    await act(async () => {
      await result.current.handleDelete(task);
    });
    expect(deleteTache).toHaveBeenCalledWith("u1", "t2");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "./supabase";
import { deleteTache, fetchTaches, insertTache, updateTache } from "./taches";

type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

function makeQuery(): MockQuery {
  const query: Partial<MockQuery> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.update = vi.fn(() => query);
  query.delete = vi.fn(() => query);
  query.in = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.maybeSingle = vi.fn();
  query.insert = vi.fn(() => query);
  query.single = vi.fn();
  return query as MockQuery;
}

describe("taches lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns [] when no week is provided", async () => {
    const result = await fetchTaches("u1", []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("assigns next order on insert", async () => {
    const query = makeQuery();
    query.maybeSingle.mockResolvedValue({ data: { ordre: 4 }, error: null });
    query.single.mockResolvedValue({
      data: {
        id: "t1",
        user_id: "u1",
        semaine_debut: "2026-04-27",
        titre: "Task",
        priorite: "normale",
        terminee: false,
        candidature_id: null,
        ordre: 5,
        created_at: "2026-04-28T00:00:00.000Z",
        updated_at: "2026-04-28T00:00:00.000Z",
      },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const result = await insertTache("u1", {
      semaineDebut: "2026-04-27",
      titre: "  Task  ",
    });

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ ordre: 5, titre: "Task" }),
    );
    expect(result.ordre).toBe(5);
  });

  it("fetches and maps tasks", async () => {
    const query = makeQuery();
    query.order
      .mockImplementationOnce(() => query)
      .mockResolvedValue({
      data: [
        {
          id: "t1",
          user_id: "u1",
          semaine_debut: "2026-04-27",
          titre: "Task",
          priorite: "haute",
          terminee: false,
          candidature_id: "c1",
          ordre: 0,
          created_at: "2026-04-28T00:00:00.000Z",
          updated_at: "2026-04-28T00:00:00.000Z",
        },
      ],
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const tasks = await fetchTaches("u1", ["2026-04-27"]);
    expect(tasks[0]).toMatchObject({
      id: "t1",
      priorite: "haute",
      candidatureId: "c1",
    });
  });

  it("updates task fields", async () => {
    const query = makeQuery();
    query.single.mockResolvedValue({
      data: {
        id: "t1",
        user_id: "u1",
        semaine_debut: "2026-04-27",
        titre: "Updated",
        priorite: "normale",
        terminee: true,
        candidature_id: null,
        ordre: 0,
        created_at: "2026-04-28T00:00:00.000Z",
        updated_at: "2026-04-28T00:00:00.000Z",
      },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const updated = await updateTache("u1", "t1", {
      titre: " Updated ",
      terminee: true,
    });
    expect(query.update).toHaveBeenCalledWith({ titre: "Updated", terminee: true });
    expect(updated.terminee).toBe(true);
  });

  it("returns existing task when update payload is empty", async () => {
    const query = makeQuery();
    query.maybeSingle.mockResolvedValue({
      data: {
        id: "t1",
        user_id: "u1",
        semaine_debut: "2026-04-27",
        titre: "Current",
        priorite: "normale",
        terminee: false,
        candidature_id: null,
        ordre: 0,
        created_at: "2026-04-28T00:00:00.000Z",
        updated_at: "2026-04-28T00:00:00.000Z",
      },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const current = await updateTache("u1", "t1", {});
    expect(current.titre).toBe("Current");
    expect(query.update).not.toHaveBeenCalled();
  });

  it("deletes a task", async () => {
    const query = makeQuery();
    query.eq.mockImplementationOnce(() => query).mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    await deleteTache("u1", "t1");
    expect(query.delete).toHaveBeenCalled();
  });
});

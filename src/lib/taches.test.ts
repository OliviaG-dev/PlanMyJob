import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "./supabase";
import { fetchTaches, insertTache } from "./taches";

type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
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
});

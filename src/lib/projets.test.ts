import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "./supabase";
import { deleteProjet, fetchProjets, insertProjet, updateProjet } from "./projets";

type MockQuery = {
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: (onfulfilled: (value: unknown) => unknown) => Promise<unknown>;
};

function makeQuery(): MockQuery {
  const query: Partial<MockQuery> = {};
  query.eq = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.update = vi.fn(() => query);
  query.delete = vi.fn(() => query);
  query.insert = vi.fn(() => query);
  query.select = vi.fn(() => query);
  query.single = vi.fn();
  query.then = (onfulfilled) => Promise.resolve(onfulfilled({ data: [], error: null }));
  return query as MockQuery;
}

describe("projets lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trims title and description on insert", async () => {
    const query = makeQuery();
    query.single.mockResolvedValue({
      data: {
        id: "p1",
        user_id: "u1",
        titre: "Projet",
        description: "Description",
        created_at: "2026-04-28T00:00:00.000Z",
      },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    await insertProjet("u1", { titre: " Projet ", description: " Description " });

    expect(query.insert).toHaveBeenCalledWith({
      user_id: "u1",
      titre: "Projet",
      description: "Description",
    });
  });

  it("maps fetched rows", async () => {
    const query = makeQuery();
    query.order.mockResolvedValue({
      data: [
        {
          id: "p1",
          user_id: "u1",
          titre: "Portfolio",
          description: "Desc",
          created_at: "2026-04-28T00:00:00.000Z",
        },
      ],
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const data = await fetchProjets("u1");
    expect(data[0]).toMatchObject({
      id: "p1",
      titre: "Portfolio",
      description: "Desc",
    });
  });

  it("updates project fields when payload is provided", async () => {
    const query = makeQuery();
    query.single.mockResolvedValue({
      data: {
        id: "p1",
        user_id: "u1",
        titre: "New",
        description: "New desc",
        created_at: "2026-04-28T00:00:00.000Z",
      },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const updated = await updateProjet("u1", "p1", {
      titre: " New ",
      description: " New desc ",
    });
    expect(query.update).toHaveBeenCalledWith({
      titre: "New",
      description: "New desc",
    });
    expect(updated.titre).toBe("New");
  });

  it("returns existing project when update payload is empty", async () => {
    const query = makeQuery();
    query.order.mockResolvedValue({
      data: [
        {
          id: "p1",
          user_id: "u1",
          titre: "Existing",
          description: "Desc",
          created_at: "2026-04-28T00:00:00.000Z",
        },
      ],
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const current = await updateProjet("u1", "p1", {});
    expect(current.titre).toBe("Existing");
    expect(query.update).not.toHaveBeenCalled();
  });

  it("deletes a project", async () => {
    const query = makeQuery();
    query.eq.mockImplementationOnce(() => query).mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    await deleteProjet("u1", "p1");
    expect(query.delete).toHaveBeenCalled();
  });
});

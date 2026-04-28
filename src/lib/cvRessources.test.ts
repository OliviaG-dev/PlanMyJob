import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "./supabase";
import {
  deleteCvRessource,
  fetchCvRessources,
  insertCvRessource,
} from "./cvRessources";

type MockQuery = {
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

function makeQuery(): MockQuery {
  const query: Partial<MockQuery> = {};
  query.eq = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.delete = vi.fn(() => query);
  query.insert = vi.fn(() => query);
  query.select = vi.fn(() => query);
  query.single = vi.fn();
  return query as MockQuery;
}

describe("cvRessources lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trims title and url on insert", async () => {
    const query = makeQuery();
    query.single.mockResolvedValue({
      data: {
        id: "r1",
        user_id: "u1",
        titre: "CV",
        type: "cv",
        format: "pdf",
        url: "https://example.com/cv.pdf",
        created_at: "2026-04-28T00:00:00.000Z",
      },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    await insertCvRessource("u1", {
      titre: " CV ",
      type: "cv",
      format: "pdf",
      url: " https://example.com/cv.pdf ",
    });

    expect(query.insert).toHaveBeenCalledWith({
      user_id: "u1",
      titre: "CV",
      type: "cv",
      format: "pdf",
      url: "https://example.com/cv.pdf",
    });
  });

  it("fetches and maps cv resources", async () => {
    const query = makeQuery();
    query.order.mockResolvedValue({
      data: [
        {
          id: "r1",
          user_id: "u1",
          titre: "Portfolio",
          type: "portfolio",
          format: null,
          url: "https://example.com",
          created_at: "2026-04-28T00:00:00.000Z",
        },
      ],
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const resources = await fetchCvRessources("u1");
    expect(resources[0]).toMatchObject({
      id: "r1",
      titre: "Portfolio",
      format: undefined,
    });
  });

  it("deletes a cv resource", async () => {
    const query = makeQuery();
    query.eq.mockImplementationOnce(() => query).mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    await deleteCvRessource("u1", "r1");
    expect(query.delete).toHaveBeenCalled();
  });
});

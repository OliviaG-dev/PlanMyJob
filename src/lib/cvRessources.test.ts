import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "./supabase";
import { insertCvRessource } from "./cvRessources";

type MockQuery = {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

function makeQuery(): MockQuery {
  const query: Partial<MockQuery> = {};
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
});

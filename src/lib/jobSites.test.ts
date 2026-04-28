import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "./supabase";
import { insertJobSite, upsertUserJobSiteStatus } from "./jobSites";

type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
};

function makeQuery(): MockQuery {
  const query: Partial<MockQuery> = {};
  query.select = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.maybeSingle = vi.fn();
  query.insert = vi.fn(() => query);
  query.single = vi.fn();
  query.upsert = vi.fn();
  return query as MockQuery;
}

describe("jobSites lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses max position + 1 by default", async () => {
    const query = makeQuery();
    query.maybeSingle.mockResolvedValue({ data: { position: 2 }, error: null });
    query.single.mockResolvedValue({
      data: { id: "s1", label: "LinkedIn", url: "https://linkedin.com", position: 3 },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const created = await insertJobSite({ label: " LinkedIn ", url: " https://linkedin.com " });

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ label: "LinkedIn", url: "https://linkedin.com", position: 3 }),
    );
    expect(created.position).toBe(3);
  });

  it("upserts user status with expected payload", async () => {
    const query = makeQuery();
    query.upsert.mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    await upsertUserJobSiteStatus("u1", "site1", {
      accountCreated: true,
      cvSent: false,
    });

    expect(query.upsert).toHaveBeenCalledWith(
      {
        user_id: "u1",
        job_site_id: "site1",
        account_created: true,
        cv_sent: false,
      },
      expect.objectContaining({ onConflict: "user_id,job_site_id" }),
    );
  });
});

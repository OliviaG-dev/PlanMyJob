import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "./supabase";
import {
  deleteJobSite,
  fetchJobSites,
  fetchUserJobSiteStatus,
  insertJobSite,
  updateJobSite,
  upsertUserJobSiteStatus,
} from "./jobSites";

type MockQuery = {
  eq: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
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
  query.eq = vi.fn(() => query);
  query.update = vi.fn(() => query);
  query.delete = vi.fn(() => query);
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

  it("fetches and maps job sites", async () => {
    const query = makeQuery();
    query.order.mockResolvedValue({
      data: [{ id: "s1", label: "Indeed", url: "https://indeed.com", position: 1 }],
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const sites = await fetchJobSites();
    expect(sites[0]).toMatchObject({ id: "s1", label: "Indeed" });
  });

  it("updates label and url with trimming", async () => {
    const query = makeQuery();
    query.single.mockResolvedValue({
      data: { id: "s1", label: "LinkedIn", url: "https://linkedin.com", position: 0 },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    await updateJobSite("s1", { label: " LinkedIn ", url: " https://linkedin.com " });
    expect(query.update).toHaveBeenCalledWith({
      label: "LinkedIn",
      url: "https://linkedin.com",
    });
  });

  it("returns current job site when update payload is empty", async () => {
    const query = makeQuery();
    query.single.mockResolvedValue({
      data: { id: "s1", label: "Current", url: "https://current.com", position: 1 },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const current = await updateJobSite("s1", {});
    expect(current.label).toBe("Current");
    expect(query.update).not.toHaveBeenCalled();
  });

  it("deletes a job site", async () => {
    const query = makeQuery();
    query.eq.mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    await deleteJobSite("s1");
    expect(query.delete).toHaveBeenCalled();
  });

  it("maps user job site statuses", async () => {
    const query = makeQuery();
    query.eq.mockResolvedValue({
      data: [{ job_site_id: "s1", account_created: true, cv_sent: false }],
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const statuses = await fetchUserJobSiteStatus("u1");
    expect(statuses[0]).toEqual({
      jobSiteId: "s1",
      accountCreated: true,
      cvSent: false,
    });
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

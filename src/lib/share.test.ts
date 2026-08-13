import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

import { supabase } from "./supabase";
import {
  createShare,
  fetchPublicShare,
  fetchSharesForCandidature,
  isShareActive,
  revokeShare,
} from "./share";

type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

function makeQuery(): MockQuery {
  const query: Partial<MockQuery> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.is = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.insert = vi.fn(() => query);
  query.update = vi.fn(() => query);
  query.single = vi.fn();
  return query as MockQuery;
}

describe("share lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createShare inserts into shares table", async () => {
    const query = makeQuery();
    query.single.mockResolvedValue({
      data: {
        id: "s1",
        token: "abc123",
        expires_at: "2026-08-14T00:00:00.000Z",
        created_at: "2026-08-13T00:00:00.000Z",
      },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const result = await createShare(
      "u1",
      {
        id: "c1",
        entreprise: "ACME",
        poste: "Dev",
        statut: "cv_envoye",
      },
      "24h",
      "Note publique"
    );

    expect(result.token).toBe("abc123");
    expect(supabase.from).toHaveBeenCalledWith("shares");
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "u1",
        candidature_id: "c1",
        public_notes: "Note publique",
      })
    );
  });

  it("fetchPublicShare returns not_found when RPC returns null", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never);

    const result = await fetchPublicShare("unknown");
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });

  it("fetchPublicShare returns expired error", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { error: "expired" },
      error: null,
    } as never);

    const result = await fetchPublicShare("token");
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("fetchSharesForCandidature maps rows", async () => {
    const query = makeQuery();
    query.order.mockResolvedValue({
      data: [
        {
          id: "s1",
          token: "tok",
          expires_at: null,
          revoked_at: null,
          created_at: "2026-08-13T00:00:00.000Z",
          candidature_id: "c1",
        },
      ],
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const shares = await fetchSharesForCandidature("u1", "c1");
    expect(shares).toHaveLength(1);
    expect(shares[0].token).toBe("tok");
  });

  it("revokeShare updates revoked_at", async () => {
    const query = makeQuery();
    query.eq.mockResolvedValue({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    await revokeShare("s1");
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ revoked_at: expect.any(String) })
    );
    expect(query.eq).toHaveBeenCalledWith("id", "s1");
  });

  it("isShareActive respects expiration", () => {
    expect(
      isShareActive({
        id: "s1",
        token: "t",
        expiresAt: null,
        revokedAt: null,
        createdAt: "",
        candidatureId: "c1",
      })
    ).toBe(true);

    expect(
      isShareActive({
        id: "s1",
        token: "t",
        expiresAt: "2020-01-01T00:00:00.000Z",
        revokedAt: null,
        createdAt: "",
        candidatureId: "c1",
      })
    ).toBe(false);
  });
});

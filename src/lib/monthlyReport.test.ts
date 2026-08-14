import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

vi.mock("./candidatures", () => ({
  fetchCandidatures: vi.fn(),
}));

import { supabase } from "./supabase";
import { fetchCandidatures } from "./candidatures";
import {
  createMonthlyReport,
  fetchActiveMonthlyReportForPeriod,
  fetchActiveMonthlyReportsForUser,
  fetchPublicMonthlyReport,
  isMonthlyReportActive,
  previewMonthlyReportSnapshot,
  regenerateMonthlyReport,
  revokeMonthlyReport,
} from "./monthlyReport";
import type { MonthlyReportRecord } from "../types/monthlyReport.types";

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

function reportRecord(
  overrides: Partial<MonthlyReportRecord> = {},
): MonthlyReportRecord {
  return {
    id: "r1",
    token: "tok",
    year: 2026,
    month: 7,
    expiresAt: null,
    revokedAt: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("monthlyReport lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("isMonthlyReportActive", () => {
    it("returns false when report is revoked", () => {
      expect(
        isMonthlyReportActive(reportRecord({ revokedAt: "2026-08-01T00:00:00.000Z" })),
      ).toBe(false);
    });

    it("returns true when report has no expiration", () => {
      expect(isMonthlyReportActive(reportRecord({ expiresAt: null }))).toBe(true);
    });

    it("returns false when report is expired", () => {
      expect(
        isMonthlyReportActive(
          reportRecord({ expiresAt: "2020-01-01T00:00:00.000Z" }),
        ),
      ).toBe(false);
    });

    it("returns true when expiration is in the future", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-01T12:00:00.000Z"));

      expect(
        isMonthlyReportActive(
          reportRecord({ expiresAt: "2026-09-01T00:00:00.000Z" }),
        ),
      ).toBe(true);
    });
  });

  it("createMonthlyReport inserts snapshot built from candidatures", async () => {
    vi.mocked(fetchCandidatures).mockResolvedValue([
      {
        id: "c1",
        entreprise: "ACME",
        poste: "Dev",
        statut: "cv_envoye",
        dateCandidature: "2026-08-11",
      },
    ] as never);

    const query = makeQuery();
    query.single.mockResolvedValue({
      data: {
        id: "r1",
        token: "monthly-token",
        expires_at: "2026-09-01T00:00:00.000Z",
        created_at: "2026-08-13T00:00:00.000Z",
      },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const result = await createMonthlyReport("u1", 2026, 7, "30d", "  Notes publiques  ");

    expect(fetchCandidatures).toHaveBeenCalledWith("u1");
    expect(supabase.from).toHaveBeenCalledWith("monthly_reports");
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "u1",
        year: 2026,
        month: 7,
        public_notes: "Notes publiques",
        snapshot: expect.objectContaining({
          year: 2026,
          month: 7,
        }),
      }),
    );
    expect(result.token).toBe("monthly-token");
  });

  it("fetchPublicMonthlyReport returns not_found when RPC returns null", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never);

    const result = await fetchPublicMonthlyReport("missing");
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });

  it("fetchPublicMonthlyReport returns expired error", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { error: "expired" },
      error: null,
    } as never);

    const result = await fetchPublicMonthlyReport("token");
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("fetchPublicMonthlyReport returns public data", async () => {
    const payload = {
      monthLabel: "août 2026",
      stats: { sent: 1 },
      weeks: [],
    };
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: payload,
      error: null,
    } as never);

    const result = await fetchPublicMonthlyReport("token");
    expect(result).toEqual({ ok: true, data: payload });
  });

  it("fetchActiveMonthlyReportsForUser filters revoked and expired reports", async () => {
    const query = makeQuery();
    query.order.mockResolvedValue({
      data: [
        {
          id: "r1",
          token: "active",
          year: 2026,
          month: 7,
          expires_at: null,
          revoked_at: null,
          created_at: "2026-08-13T00:00:00.000Z",
          snapshot: { monthLabel: "août 2026" },
        },
        {
          id: "r2",
          token: "expired",
          year: 2026,
          month: 6,
          expires_at: "2020-01-01T00:00:00.000Z",
          revoked_at: null,
          created_at: "2020-01-01T00:00:00.000Z",
          snapshot: { monthLabel: "juillet 2026" },
        },
      ],
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const reports = await fetchActiveMonthlyReportsForUser("u1");
    expect(reports).toHaveLength(1);
    expect(reports[0].token).toBe("active");
    expect(reports[0].monthLabel).toBe("août 2026");
  });

  it("fetchActiveMonthlyReportForPeriod returns matching active report", async () => {
    const query = makeQuery();
    query.order.mockResolvedValue({
      data: [
        {
          id: "r1",
          token: "aug",
          year: 2026,
          month: 7,
          expires_at: null,
          revoked_at: null,
          created_at: "2026-08-13T00:00:00.000Z",
          snapshot: { monthLabel: "août 2026" },
        },
      ],
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const report = await fetchActiveMonthlyReportForPeriod("u1", 2026, 7);
    expect(report?.token).toBe("aug");
    expect(report?.monthLabel).toBe("août 2026");
  });

  it("revokeMonthlyReport updates revoked_at", async () => {
    const query = makeQuery();
    query.eq.mockResolvedValue({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    await revokeMonthlyReport("r1");

    expect(supabase.from).toHaveBeenCalledWith("monthly_reports");
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ revoked_at: expect.any(String) }),
    );
    expect(query.eq).toHaveBeenCalledWith("id", "r1");
  });

  it("regenerateMonthlyReport revokes existing report then creates a new one", async () => {
    vi.mocked(fetchCandidatures).mockResolvedValue([]);

    const revokeQuery = makeQuery();
    revokeQuery.eq.mockResolvedValue({ data: null, error: null });

    const createQuery = makeQuery();
    createQuery.single.mockResolvedValue({
      data: {
        id: "r2",
        token: "new-token",
        expires_at: null,
        created_at: "2026-08-14T00:00:00.000Z",
      },
      error: null,
    });

    vi.mocked(supabase.from)
      .mockReturnValueOnce(revokeQuery as never)
      .mockReturnValueOnce(createQuery as never);

    const result = await regenerateMonthlyReport("u1", "r1", 2026, 7, "never");

    expect(result.token).toBe("new-token");
    expect(revokeQuery.update).toHaveBeenCalled();
    expect(createQuery.insert).toHaveBeenCalled();
  });

  it("previewMonthlyReportSnapshot builds snapshot without persisting", async () => {
    vi.mocked(fetchCandidatures).mockResolvedValue([
      {
        id: "c1",
        entreprise: "ACME",
        poste: "Dev",
        statut: "cv_envoye",
        dateCandidature: "2026-08-11",
      },
    ] as never);

    const snapshot = await previewMonthlyReportSnapshot("u1", 2026, 7);

    expect(fetchCandidatures).toHaveBeenCalledWith("u1");
    expect(supabase.from).not.toHaveBeenCalled();
    expect(snapshot.year).toBe(2026);
    expect(snapshot.month).toBe(7);
  });
});

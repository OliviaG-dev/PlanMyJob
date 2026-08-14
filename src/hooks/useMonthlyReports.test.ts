/* @vitest-environment jsdom */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMonthlyReports } from "./useMonthlyReports";

vi.mock("../lib/monthlyReport", () => ({
  fetchActiveMonthlyReportsForUser: vi.fn(),
}));

import { fetchActiveMonthlyReportsForUser } from "../lib/monthlyReport";

describe("useMonthlyReports", () => {
  it("clears reports when userId is missing", async () => {
    const { result } = renderHook(() => useMonthlyReports(undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.reports).toEqual([]);
  });

  it("loads active monthly reports", async () => {
    vi.mocked(fetchActiveMonthlyReportsForUser).mockResolvedValue([
      {
        id: "r1",
        token: "tok",
        year: 2026,
        month: 7,
        expiresAt: null,
        revokedAt: null,
        createdAt: "2026-08-01",
        monthLabel: "Août 2026",
      },
    ]);

    const { result } = renderHook(() => useMonthlyReports("u1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.reports).toHaveLength(1);
  });
});

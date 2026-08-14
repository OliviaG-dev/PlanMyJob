/* @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardMonthlyReports from "./DashboardMonthlyReports";

vi.mock("../../hooks/useMonthlyReports", () => ({
  useMonthlyReports: vi.fn(),
}));

vi.mock("../../lib/monthlyReport", () => ({
  createMonthlyReport: vi.fn(),
  fetchActiveMonthlyReportForPeriod: vi.fn(),
  regenerateMonthlyReport: vi.fn(),
  revokeMonthlyReport: vi.fn(),
}));

import { useMonthlyReports } from "../../hooks/useMonthlyReports";

describe("DashboardMonthlyReports", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(useMonthlyReports).mockReturnValue({
      reports: [
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
      ],
      loading: false,
      error: null,
      reload: vi.fn(),
    });
  });

  it("lists active monthly report links", async () => {
    render(<DashboardMonthlyReports userId="u1" />);

    await waitFor(() => {
      expect(screen.getAllByText("Août 2026").length).toBeGreaterThan(0);
    });
  });
});

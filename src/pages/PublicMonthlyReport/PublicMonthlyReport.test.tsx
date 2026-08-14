/* @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicMonthlyReport from "./PublicMonthlyReport";

vi.mock("../../lib/monthlyReport", () => ({
  fetchPublicMonthlyReport: vi.fn(),
}));

vi.mock("../../components/ShareQrCode/ShareQrCode", () => ({
  default: () => <div data-testid="qr-code" />,
}));

import { fetchPublicMonthlyReport } from "../../lib/monthlyReport";

function renderPublicReport(token = "month-token") {
  return render(
    <MemoryRouter initialEntries={[`/bilan/${token}`]}>
      <Routes>
        <Route path="/bilan/:token" element={<PublicMonthlyReport />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicMonthlyReport", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error when report is revoked", async () => {
    vi.mocked(fetchPublicMonthlyReport).mockResolvedValue({
      ok: false,
      reason: "revoked",
    } as never);

    renderPublicReport();

    await waitFor(() => {
      expect(screen.getByText(/désactivé/i)).toBeTruthy();
    });
  });

  it("renders monthly report when ready", async () => {
    vi.mocked(fetchPublicMonthlyReport).mockResolvedValue({
      ok: true,
      data: {
        year: 2026,
        month: 7,
        monthLabel: "Août 2026",
        isPartial: true,
        partialUntil: "2026-08-13",
        stats: {
          candidaturesEnvoyees: 3,
          enCours: 2,
          entretiens: 1,
          offres: 0,
          tauxRefus: 10,
          tauxSansReponse: 20,
          repartitionSource: {
            linkedin: 2,
            indeed: 0,
            france_travail: 0,
            welcome_to_the_jungle: 0,
            hellowork: 1,
            site_entreprise: 0,
            autre: 0,
          },
        },
        weeks: [],
        snapshotAt: "2026-08-13T00:00:00.000Z",
        sharedAt: "2026-08-13T00:00:00.000Z",
      },
    } as never);

    renderPublicReport();

    await waitFor(() => {
      expect(screen.getByText("Août 2026")).toBeTruthy();
    });
  });
});

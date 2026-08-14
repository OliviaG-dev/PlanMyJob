import { describe, expect, it, vi } from "vitest";
import type { PublicMonthlyReportData } from "../types/monthlyReport.types";
import { buildMonthlyPdfFilename, downloadMonthlyReportPdf } from "./monthlyReportPdf";

const saveMock = vi.fn();

vi.mock("./sharePdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./sharePdf")>();
  return {
    ...actual,
    getQrDataUrl: vi.fn().mockResolvedValue("data:image/png;base64,abc"),
  };
});

vi.mock("jspdf", () => ({
  jsPDF: class MockJsPDF {
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    text = vi.fn();
    splitTextToSize = vi.fn((value: string) => [value]);
    addPage = vi.fn();
    addImage = vi.fn();
    save = saveMock;
  },
}));

describe("buildMonthlyPdfFilename", () => {
  it("includes sanitized month label", () => {
    expect(buildMonthlyPdfFilename("Mars 2026")).toBe(
      "PlanMyJob_Bilan_Mars_2026.pdf"
    );
  });

  it("strips accents and special characters", () => {
    expect(buildMonthlyPdfFilename("Février 2026")).toBe(
      "PlanMyJob_Bilan_Fevrier_2026.pdf"
    );
  });

  it("falls back when month label is empty", () => {
    expect(buildMonthlyPdfFilename("   ")).toBe(
      "PlanMyJob_Bilan_bilan_mensuel.pdf"
    );
  });
});

describe("downloadMonthlyReportPdf", () => {
  it("generates and saves monthly pdf", async () => {
    const data: PublicMonthlyReportData = {
      year: 2026,
      month: 7,
      monthLabel: "Août 2026",
      isPartial: true,
      partialUntil: "2026-08-13",
      stats: {
        candidaturesEnvoyees: 2,
        enCours: 1,
        entretiens: 0,
        offres: 0,
        tauxRefus: 0,
        tauxSansReponse: 50,
        repartitionSource: {
          linkedin: 1,
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
    };

    await downloadMonthlyReportPdf("month-token", data);
    expect(saveMock).toHaveBeenCalledWith("PlanMyJob_Bilan_Aout_2026.pdf");
  });
});

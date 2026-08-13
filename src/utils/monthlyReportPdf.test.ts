import { describe, expect, it } from "vitest";
import { buildMonthlyPdfFilename } from "./monthlyReportPdf";

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

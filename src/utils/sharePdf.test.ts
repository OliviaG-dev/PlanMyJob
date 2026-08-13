import { describe, expect, it } from "vitest";
import { buildPdfFilename, prepareLinkForPdfWrap } from "./sharePdf";

describe("buildPdfFilename", () => {
  it("includes sanitized company name", () => {
    expect(buildPdfFilename("EXO-DEV")).toBe("PlanMyJob_Report_EXO_DEV.pdf");
  });

  it("strips accents and special characters", () => {
    expect(buildPdfFilename("Ubisoft Montréal")).toBe(
      "PlanMyJob_Report_Ubisoft_Montreal.pdf"
    );
  });

  it("falls back when company name is empty", () => {
    expect(buildPdfFilename("   ")).toBe("PlanMyJob_Report_candidature.pdf");
  });
});

describe("prepareLinkForPdfWrap", () => {
  it("inserts break points in URLs", () => {
    const wrapped = prepareLinkForPdfWrap("https://example.com/jobs?q=dev&l=fr");
    expect(wrapped).toContain(" ");
    expect(wrapped.replace(/ /g, "")).toBe("https://example.com/jobs?q=dev&l=fr");
  });
});

import { describe, expect, it, vi } from "vitest";
import type { PublicShareData } from "../types/share.types";
import { buildPdfFilename, downloadSharePdf, getQrDataUrl, prepareLinkForPdfWrap } from "./sharePdf";

const saveMock = vi.fn();

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,abc"),
  },
}));

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

describe("getQrDataUrl", () => {
  it("returns QR data url", async () => {
    await expect(getQrDataUrl("https://example.com/share")).resolves.toContain(
      "data:image/png",
    );
  });
});

describe("downloadSharePdf", () => {
  it("generates and saves pdf", async () => {
    const data: PublicShareData = {
      entreprise: "Alpha Corp",
      poste: "Frontend Dev",
      statut: "cv_envoye",
      statutLabel: "CV envoyé",
      cvEnvoye: true,
      timeline: [],
      snapshotAt: "2026-04-28T00:00:00.000Z",
      sharedAt: "2026-04-28T00:00:00.000Z",
    };

    await downloadSharePdf("token123", data);
    expect(saveMock).toHaveBeenCalledWith("PlanMyJob_Report_Alpha_Corp.pdf");
  });
});

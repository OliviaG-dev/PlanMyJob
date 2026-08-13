import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import type { PublicShareData } from "../types/share.types";
import {
  formatShareDate,
  formatShareDateShort,
  getShareUrl,
} from "./shareSnapshot";

const QR_SIZE_MM = 35;
const QR_X_MM = 140;
const PAGE_WIDTH_MM = 210;
const MARGIN_MM = 20;
const LABEL_COLUMN_WIDTH_MM = 50;
const VALUE_X_MM = MARGIN_MM + LABEL_COLUMN_WIDTH_MM;
const VALUE_MAX_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM - VALUE_X_MM;

/** Insère des points de coupure pour que jsPDF puisse wrap les URLs longues. */
export function prepareLinkForPdfWrap(link: string): string {
  return link.replace(/([/?=&])/g, "$1 ");
}

async function getQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 200,
    margin: 1,
    color: { dark: "#3d3836", light: "#ffffff" },
  });
}

export function buildPdfFilename(entreprise: string): string {
  const slug =
    entreprise
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "candidature";

  return `PlanMyJob_Report_${slug}.pdf`;
}

export async function downloadSharePdf(
  token: string,
  data: PublicShareData
): Promise<void> {
  const shareUrl = getShareUrl(token);
  const qrDataUrl = await getQrDataUrl(shareUrl);
  const generatedAt = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = MARGIN_MM;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PlanMyJob — Rapport de candidature", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Généré le ${generatedAt}`, margin, y);
  y += 12;

  doc.setTextColor(60, 56, 54);
  doc.setFontSize(11);

  const rows: [string, string][] = [
    ["Entreprise", data.entreprise],
    ["Poste", data.poste],
    ["Statut", data.statutLabel],
    ["Date de candidature", formatShareDate(data.dateCandidature)],
    ["Localisation", data.localisation ?? "—"],
    ["CV envoyé", data.cvEnvoye ? "Oui" : "Non"],
  ];

  if (data.typeContratLabel) {
    rows.push(["Type de contrat", data.typeContratLabel]);
  }
  if (data.sourceLabel) {
    rows.push(["Source", data.sourceLabel]);
  }
  if (data.lienOffre) {
    rows.push(["Lien de l'offre", data.lienOffre]);
  }

  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}`, margin, y);
    doc.setFont("helvetica", "normal");

    const isLink = label === "Lien de l'offre";
    if (isLink) {
      doc.setFontSize(9);
    }

    const textValue = isLink ? prepareLinkForPdfWrap(value) : value;
    const lines = doc.splitTextToSize(textValue, VALUE_MAX_WIDTH_MM);
    doc.text(lines, VALUE_X_MM, y);

    if (isLink) {
      doc.setFontSize(11);
    }

    y += Math.max(6, lines.length * (isLink ? 4 : 5));
  }

  if (data.publicNotes) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Notes", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(data.publicNotes, PAGE_WIDTH_MM - 2 * margin);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 5 + 4;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Historique", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");

  for (const event of data.timeline) {
    doc.text(
      `${formatShareDateShort(event.date)} — ${event.label}`,
      margin,
      y
    );
    y += 6;
    if (y > 220) {
      doc.addPage();
      y = margin;
    }
  }

  y += 8;
  const shareSectionY = y;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Lien de partage", margin, shareSectionY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const urlLines = doc.splitTextToSize(prepareLinkForPdfWrap(shareUrl), QR_X_MM - margin - 5);
  doc.text(urlLines, margin, shareSectionY + 6);

  doc.addImage(qrDataUrl, "PNG", QR_X_MM, shareSectionY - 2, QR_SIZE_MM, QR_SIZE_MM);

  doc.save(buildPdfFilename(data.entreprise));
}

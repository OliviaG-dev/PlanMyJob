import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import type { PublicShareData } from "../types/share.types";
import {
  formatShareDate,
  formatShareDateShort,
  getShareUrl,
  getStatutEmoji,
} from "./shareSnapshot";

async function getQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 200,
    margin: 1,
    color: { dark: "#3d3836", light: "#ffffff" },
  });
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
  const margin = 20;
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
    ["Statut", `${getStatutEmoji(data.statut)} ${data.statutLabel}`],
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
    const lines = doc.splitTextToSize(value, 120);
    doc.text(lines, margin + 55, y);
    y += Math.max(6, lines.length * 5);
  }

  if (data.publicNotes) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Notes", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(data.publicNotes, 170);
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
    if (y > 240) {
      doc.addPage();
      y = margin;
    }
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Lien de partage", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const urlLines = doc.splitTextToSize(shareUrl, 100);
  doc.text(urlLines, margin, y);
  y += urlLines.length * 4 + 4;

  doc.addImage(qrDataUrl, "PNG", 140, margin, 40, 40);

  doc.save("PlanMyJob_Report.pdf");
}

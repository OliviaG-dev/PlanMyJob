import { jsPDF } from "jspdf";
import type { SourceCandidature } from "../types/candidature";
import type { PublicMonthlyReportData } from "../types/monthlyReport.types";
import { getMonthlyReportUrl } from "./monthlyReportSnapshot";
import { formatShareDate, formatShareDateShort } from "./shareSnapshot";
import { getQrDataUrl, prepareLinkForPdfWrap } from "./sharePdf";

const QR_SIZE_MM = 35;
const QR_X_MM = 140;
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 20;
const CONTENT_BOTTOM_MM = PAGE_HEIGHT_MM - MARGIN_MM;

const SOURCE_LABELS: Record<SourceCandidature, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  france_travail: "France Travail",
  welcome_to_the_jungle: "Welcome to the Jungle",
  hellowork: "HelloWork",
  site_entreprise: "Site entreprise",
  autre: "Autre",
};

export function buildMonthlyPdfFilename(monthLabel: string): string {
  const slug =
    monthLabel
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "bilan_mensuel";

  return `PlanMyJob_Bilan_${slug}.pdf`;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= CONTENT_BOTTOM_MM) return y;
  doc.addPage();
  return MARGIN_MM;
}

export async function downloadMonthlyReportPdf(
  token: string,
  data: PublicMonthlyReportData
): Promise<void> {
  const reportUrl = getMonthlyReportUrl(token);
  const qrDataUrl = await getQrDataUrl(reportUrl);
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
  doc.text("PlanMyJob — Bilan mensuel", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Généré le ${generatedAt}`, margin, y);
  y += 8;

  doc.setTextColor(60, 56, 54);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(data.monthLabel, margin, y);
  y += 8;

  if (data.isPartial) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(120, 100, 105);
    doc.text(
      `Bilan partiel · données jusqu'au ${formatShareDate(data.partialUntil)}`,
      margin,
      y
    );
    y += 8;
  }

  doc.setTextColor(60, 56, 54);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Statistiques du mois", margin, y);
  y += 8;

  const offres = data.stats.offres ?? 0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Activité", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(
    `Envoyées : ${data.stats.candidaturesEnvoyees} · En cours : ${data.stats.enCours} · Entretiens : ${data.stats.entretiens}`,
    margin,
    y
  );
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Indicateurs", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(
    `Offres reçues : ${offres} · Taux de refus : ${data.stats.tauxRefus}% · Sans réponse : ${data.stats.tauxSansReponse}%`,
    margin,
    y
  );
  y += 10;

  const sourcesSorted = (
    Object.entries(data.stats.repartitionSource) as [SourceCandidature, number][]
  )
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sourcesSorted.length > 0) {
    y = ensureSpace(doc, y, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Par source", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    for (const [source, count] of sourcesSorted) {
      y = ensureSpace(doc, y, 6);
      doc.text(`${SOURCE_LABELS[source]} : ${count}`, margin + 2, y);
      y += 6;
    }
    y += 4;
  }

  if (data.publicNotes) {
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Notes", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(
      data.publicNotes,
      PAGE_WIDTH_MM - 2 * margin
    );
    for (const line of noteLines) {
      y = ensureSpace(doc, y, 5);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 4;
  }

  y = ensureSpace(doc, y, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Candidatures semaine par semaine", margin, y);
  y += 8;

  if (data.weeks.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Aucune candidature enregistrée pour ce mois.", margin, y);
    y += 8;
  } else {
    for (const week of data.weeks) {
      y = ensureSpace(doc, y, 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`${week.weekLabel} (${week.candidatures.length})`, margin, y);
      y += 6;

      if (week.candidatures.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.text("Aucune candidature cette semaine.", margin + 2, y);
        y += 6;
        continue;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      for (const candidature of week.candidatures) {
        y = ensureSpace(doc, y, 5);
        const datePart = candidature.dateCandidature
          ? ` · ${formatShareDateShort(candidature.dateCandidature)}`
          : "";
        const line = `• ${candidature.entreprise} · ${candidature.poste} — ${candidature.statutLabel}${datePart}`;
        const wrapped = doc.splitTextToSize(line, PAGE_WIDTH_MM - 2 * margin - 4);
        doc.text(wrapped, margin + 2, y);
        y += wrapped.length * 4.5 + 1;
      }
      y += 3;
    }
  }

  y = ensureSpace(doc, y, QR_SIZE_MM + 12);
  const shareSectionY = y;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Lien de partage", margin, shareSectionY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const urlLines = doc.splitTextToSize(
    prepareLinkForPdfWrap(reportUrl),
    QR_X_MM - margin - 5
  );
  doc.text(urlLines, margin, shareSectionY + 6);

  doc.addImage(
    qrDataUrl,
    "PNG",
    QR_X_MM,
    shareSectionY - 2,
    QR_SIZE_MM,
    QR_SIZE_MM
  );

  doc.save(buildMonthlyPdfFilename(data.monthLabel));
}

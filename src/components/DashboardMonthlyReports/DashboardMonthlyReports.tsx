import { useMemo, useState } from "react";
import {
  createMonthlyReport,
  fetchActiveMonthlyReportForPeriod,
  regenerateMonthlyReport,
  revokeMonthlyReport,
} from "../../lib/monthlyReport";
import { useMonthlyReports } from "../../hooks/useMonthlyReports";
import type { ShareDuration } from "../../types/monthlyReport.types";
import { MONTH_LABELS } from "../../utils/dateWeek";
import {
  formatShareDateNumeric,
  formatShareExpiryNumeric,
} from "../../utils/shareSnapshot";
import { getMonthlyReportUrl } from "../../utils/monthlyReportSnapshot";
import { formatShareError } from "../../utils/shareErrors";
import "./DashboardMonthlyReports.css";

const DURATION_OPTIONS: { value: ShareDuration; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "never", label: "Jamais" },
];

type DashboardMonthlyReportsProps = {
  userId: string;
};

function DashboardMonthlyReports({ userId }: DashboardMonthlyReportsProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [duration, setDuration] = useState<ShareDuration>("30d");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { reports, loading, error, reload } = useMonthlyReports(userId);

  const selectedLabel = useMemo(
    () => `${MONTH_LABELS[selectedMonth]} ${selectedYear}`,
    [selectedMonth, selectedYear]
  );

  const activeForSelected = useMemo(
    () =>
      reports.find(
        (r) => r.year === selectedYear && r.month === selectedMonth
      ) ?? null,
    [reports, selectedYear, selectedMonth]
  );

  function goToPreviousMonth() {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
      return;
    }
    setSelectedMonth((m) => m - 1);
  }

  function goToNextMonth() {
    const isCurrent =
      selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
    if (isCurrent) return;

    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
      return;
    }
    setSelectedMonth((m) => m + 1);
  }

  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  const canGoNext = !isCurrentMonth;

  async function handleCreateOrRegenerate() {
    setCreating(true);
    setActionError(null);
    try {
      const existing = await fetchActiveMonthlyReportForPeriod(
        userId,
        selectedYear,
        selectedMonth
      );

      if (existing) {
        await regenerateMonthlyReport(
          userId,
          existing.id,
          selectedYear,
          selectedMonth,
          duration
        );
      } else {
        await createMonthlyReport(
          userId,
          selectedYear,
          selectedMonth,
          duration
        );
      }
      await reload();
    } catch (err) {
      setActionError(formatShareError(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(reportId: string, token: string) {
    setActionError(null);
    try {
      await navigator.clipboard.writeText(getMonthlyReportUrl(token));
      setCopiedId(reportId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setActionError("Impossible de copier le lien");
    }
  }

  async function handleRevoke(reportId: string) {
    setRevokingId(reportId);
    setActionError(null);
    try {
      await revokeMonthlyReport(reportId);
      await reload();
    } catch (err) {
      setActionError(formatShareError(err));
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <section className="dashboard__block dashboard-monthly-reports">
      <h2 className="dashboard__block-title">Bilans mensuels</h2>
      <p className="dashboard__block-desc">
        Générez un lien public avec les stats du mois et le détail semaine par semaine.
      </p>

      <div className="dashboard-monthly-reports__picker">
        <button
          type="button"
          className="dashboard-monthly-reports__nav-btn"
          onClick={goToPreviousMonth}
          aria-label="Mois précédent"
        >
          ◀
        </button>
        <span className="dashboard-monthly-reports__period">{selectedLabel}</span>
        <button
          type="button"
          className="dashboard-monthly-reports__nav-btn"
          onClick={goToNextMonth}
          disabled={!canGoNext}
          aria-label="Mois suivant"
        >
          ▶
        </button>
      </div>

      {isCurrentMonth && (
        <p className="dashboard-monthly-reports__hint">
          Bilan partiel jusqu&apos;à aujourd&apos;hui.
        </p>
      )}

      <div className="dashboard-monthly-reports__create">
        <label className="dashboard-monthly-reports__duration-label">
          Durée du lien
          <select
            className="dashboard-monthly-reports__duration-select"
            value={duration}
            onChange={(e) => setDuration(e.target.value as ShareDuration)}
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="dashboard-monthly-reports__generate-btn"
          onClick={() => void handleCreateOrRegenerate()}
          disabled={creating}
        >
          {creating
            ? "…"
            : activeForSelected
              ? "Regénérer le bilan"
              : "Générer le bilan"}
        </button>
      </div>

      {actionError && (
        <p className="dashboard-monthly-reports__error" role="alert">
          {actionError}
        </p>
      )}

      {loading ? (
        <p className="dashboard-monthly-reports__muted">Chargement…</p>
      ) : error ? (
        <p className="dashboard-monthly-reports__error" role="alert">
          {error}
        </p>
      ) : reports.length === 0 ? (
        <p className="dashboard-monthly-reports__muted">
          Aucun bilan actif. Sélectionnez un mois puis générez un lien.
        </p>
      ) : (
        <ul className="dashboard-monthly-reports__list">
          {reports.map((report) => {
            const reportUrl = getMonthlyReportUrl(report.token);
            return (
              <li key={report.id} className="dashboard-monthly-reports__item">
                <div className="dashboard-monthly-reports__info">
                  <p className="dashboard-monthly-reports__title">
                    {report.monthLabel}
                  </p>
                  <div className="dashboard-monthly-reports__meta">
                    <span className="dashboard-monthly-reports__meta-chip">
                      Créé le{" "}
                      <time dateTime={report.createdAt}>
                        {formatShareDateNumeric(report.createdAt)}
                      </time>
                    </span>
                    <span className="dashboard-monthly-reports__meta-chip">
                      {formatShareExpiryNumeric(report.expiresAt)}
                    </span>
                  </div>
                </div>
                <div className="dashboard-monthly-reports__actions">
                  <a
                    href={reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dashboard-monthly-reports__btn dashboard-monthly-reports__btn--view"
                  >
                    Voir
                  </a>
                  <button
                    type="button"
                    className="dashboard-monthly-reports__btn dashboard-monthly-reports__btn--copy"
                    onClick={() => void handleCopy(report.id, report.token)}
                  >
                    {copiedId === report.id ? "Copié ✓" : "Copier"}
                  </button>
                  <button
                    type="button"
                    className="dashboard-monthly-reports__btn dashboard-monthly-reports__btn--revoke"
                    onClick={() => void handleRevoke(report.id)}
                    disabled={revokingId === report.id}
                  >
                    {revokingId === report.id ? "…" : "Révoquer"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default DashboardMonthlyReports;

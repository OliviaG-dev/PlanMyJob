import { useEffect, useMemo, useState } from "react";
import {
  createMonthlyReport,
  fetchActiveMonthlyReportForPeriod,
  regenerateMonthlyReport,
  revokeMonthlyReport,
} from "../../lib/monthlyReport";
import { useMonthlyReports } from "../../hooks/useMonthlyReports";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import { Pagination } from "../Pagination/Pagination";
import type { ShareDuration } from "../../types/monthlyReport.types";
import { MONTH_LABELS } from "../../utils/dateWeek";
import { formatShareDateNumeric } from "../../utils/shareSnapshot";
import { getMonthlyReportUrl } from "../../utils/monthlyReportSnapshot";
import { formatShareError } from "../../utils/shareErrors";
import "./DashboardMonthlyReports.css";

const DURATION_OPTIONS: { value: ShareDuration; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "never", label: "Jamais" },
];

const LINKS_PAGE_SIZE = 2;

type RevokeTarget = {
  id: string;
  label: string;
};

type DashboardMonthlyReportsProps = {
  userId: string;
};

function CalendarIcon() {
  return (
    <svg
      className="dashboard-monthly-reports__meta-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="dashboard-monthly-reports__meta-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function InfinityIcon() {
  return (
    <svg
      className="dashboard-monthly-reports__meta-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.5 6-4" />
      <path d="M12 12c2 2.5 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.5-6 4" />
    </svg>
  );
}

function MonthNavChevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      className="dashboard-monthly-reports__nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === "prev" ? (
        <path d="M15 6l-6 6 6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

function DashboardMonthlyReports({ userId }: DashboardMonthlyReportsProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [duration, setDuration] = useState<ShareDuration>("30d");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<RevokeTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [listPage, setListPage] = useState(0);

  const { reports, loading, error, reload } = useMonthlyReports(userId);

  const totalListPages = Math.max(1, Math.ceil(reports.length / LINKS_PAGE_SIZE));
  const safeListPage = Math.min(listPage, totalListPages - 1);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(reports.length / LINKS_PAGE_SIZE) - 1);
    setListPage((page) => Math.min(page, maxPage));
  }, [reports.length]);

  const visibleReports = useMemo(
    () =>
      reports.slice(
        safeListPage * LINKS_PAGE_SIZE,
        safeListPage * LINKS_PAGE_SIZE + LINKS_PAGE_SIZE
      ),
    [reports, safeListPage]
  );

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

  async function handleRevokeConfirm() {
    if (!revokeTarget) return;
    setRevokingId(revokeTarget.id);
    setActionError(null);
    try {
      await revokeMonthlyReport(revokeTarget.id);
      await reload();
      setRevokeTarget(null);
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
          <MonthNavChevron direction="prev" />
        </button>
        <span className="dashboard-monthly-reports__period">{selectedLabel}</span>
        <button
          type="button"
          className="dashboard-monthly-reports__nav-btn"
          onClick={goToNextMonth}
          disabled={!canGoNext}
          aria-label="Mois suivant"
        >
          <MonthNavChevron direction="next" />
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
        <>
        <ul className="dashboard-monthly-reports__list">
          {visibleReports.map((report) => {
            const reportUrl = getMonthlyReportUrl(report.token);
            return (
              <li key={report.id} className="dashboard-monthly-reports__item">
                <div className="dashboard-monthly-reports__info">
                  <p className="dashboard-monthly-reports__title">
                    {report.monthLabel}
                  </p>
                  <div className="dashboard-monthly-reports__meta">
                    <span className="dashboard-monthly-reports__meta-chip dashboard-monthly-reports__meta-chip--created">
                      <CalendarIcon />
                      <span>
                        Créé le{" "}
                        <time dateTime={report.createdAt}>
                          {formatShareDateNumeric(report.createdAt)}
                        </time>
                      </span>
                    </span>
                    <span
                      className={`dashboard-monthly-reports__meta-chip dashboard-monthly-reports__meta-chip--expiry${
                        report.expiresAt
                          ? ""
                          : " dashboard-monthly-reports__meta-chip--never"
                      }`}
                    >
                      {report.expiresAt ? <ClockIcon /> : <InfinityIcon />}
                      <span>
                        {report.expiresAt ? (
                          <>
                            Expire le{" "}
                            <time dateTime={report.expiresAt}>
                              {formatShareDateNumeric(report.expiresAt)}
                            </time>
                          </>
                        ) : (
                          "Sans expiration"
                        )}
                      </span>
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
                    className="dashboard-monthly-reports__btn dashboard-monthly-reports__btn--deactivate"
                    onClick={() =>
                      setRevokeTarget({
                        id: report.id,
                        label: report.monthLabel,
                      })
                    }
                    disabled={revokingId === report.id}
                  >
                    {revokingId === report.id ? "…" : "Désactiver"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <Pagination
          currentPage={safeListPage}
          totalPages={totalListPages}
          onPageChange={setListPage}
          ariaLabel="Pagination des bilans mensuels"
        />
        </>
      )}

      <ConfirmModal
        isOpen={revokeTarget !== null}
        title="Désactiver ce bilan ?"
        message={
          revokeTarget
            ? `Le lien « ${revokeTarget.label} » ne sera plus accessible.`
            : ""
        }
        confirmLabel="Désactiver le bilan"
        loading={revokingId !== null}
        onConfirm={() => void handleRevokeConfirm()}
        onCancel={() => {
          if (!revokingId) setRevokeTarget(null);
        }}
      />
    </section>
  );
}

export default DashboardMonthlyReports;

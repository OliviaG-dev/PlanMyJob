import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ShareCandidatureCard from "../../components/ShareCandidatureCard/ShareCandidatureCard";
import ShareQrCode from "../../components/ShareQrCode/ShareQrCode";
import { fetchPublicMonthlyReport } from "../../lib/monthlyReport";
import type { PublicMonthlyReportData } from "../../types/monthlyReport.types";
import type { SourceCandidature } from "../../types/candidature";
import { getMonthlyReportUrl } from "../../utils/monthlyReportSnapshot";
import { formatShareDate } from "../../utils/shareSnapshot";
import "./PublicMonthlyReport.css";

const SOURCE_LABELS: Record<SourceCandidature, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  france_travail: "France Travail",
  welcome_to_the_jungle: "Welcome to the Jungle",
  hellowork: "HelloWork",
  site_entreprise: "Site entreprise",
  autre: "Autre",
};

type PageState =
  | { status: "loading" }
  | { status: "error"; reason: "not_found" | "expired" | "revoked" | "fetch" }
  | { status: "ready"; data: PublicMonthlyReportData };

const ERROR_MESSAGES = {
  not_found: "Ce lien de bilan mensuel est introuvable ou n'existe plus.",
  expired: "Ce lien de bilan mensuel a expiré.",
  revoked: "Ce lien de bilan mensuel a été désactivé.",
  fetch: "Impossible de charger le bilan. Réessayez plus tard.",
};

function PublicMonthlyReport() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>(() =>
    !token ? { status: "error", reason: "not_found" } : { status: "loading" }
  );
  const [openWeeks, setOpenWeeks] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchPublicMonthlyReport(token)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setState({ status: "ready", data: result.data });
          const initialOpen: Record<string, boolean> = {};
          for (const week of result.data.weeks) {
            initialOpen[week.weekStart] = week.candidatures.length > 0;
          }
          setOpenWeeks(initialOpen);
        } else {
          setState({ status: "error", reason: result.reason });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", reason: "fetch" });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    return () => {
      document.head.removeChild(robots);
    };
  }, []);

  async function handleDownloadPdf() {
    if (!token || state.status !== "ready") return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const { downloadMonthlyReportPdf } = await import("../../utils/monthlyReportPdf");
      await downloadMonthlyReportPdf(token, state.data);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Erreur lors du téléchargement"
      );
    } finally {
      setDownloading(false);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="public-monthly-report">
        <div className="public-monthly-report__container">
          <p className="public-monthly-report__loading">Chargement du bilan…</p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="public-monthly-report">
        <div className="public-monthly-report__container public-monthly-report__container--error">
          <header className="public-monthly-report__brand">
            <span className="public-monthly-report__brand-name">PlanMyJob</span>
          </header>
          <h1 className="public-monthly-report__error-title">Lien indisponible</h1>
          <p className="public-monthly-report__error-text">
            {ERROR_MESSAGES[state.reason]}
          </p>
          <Link to="/login" className="public-monthly-report__home-link">
            Accéder à PlanMyJob
          </Link>
        </div>
      </div>
    );
  }

  const { data } = state;
  const reportUrl = token ? getMonthlyReportUrl(token) : "";

  const sourcesSorted = (
    Object.entries(data.stats.repartitionSource) as [SourceCandidature, number][]
  )
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const maxSourceCount = sourcesSorted[0]?.[1] ?? 1;
  const offres = data.stats.offres ?? 0;

  return (
    <div className="public-monthly-report">
      <div className="public-monthly-report__container">
        <header className="public-monthly-report__header">
          <div className="public-monthly-report__brand">
            <span className="public-monthly-report__brand-name">PlanMyJob</span>
            <span className="public-monthly-report__brand-tag">Bilan mensuel</span>
          </div>
          <button
            type="button"
            className="public-monthly-report__pdf-btn"
            onClick={() => void handleDownloadPdf()}
            disabled={downloading}
          >
            {downloading ? "Génération…" : "Télécharger PDF"}
          </button>
        </header>

        {downloadError && (
          <p className="public-monthly-report__download-error" role="alert">
            {downloadError}
          </p>
        )}

        <section className="public-monthly-report__hero">
          <h1 className="public-monthly-report__title">{data.monthLabel}</h1>
          {data.isPartial && (
            <p className="public-monthly-report__partial-badge">
              Bilan partiel · données jusqu&apos;au{" "}
              {formatShareDate(data.partialUntil)}
            </p>
          )}
        </section>

        <section className="public-monthly-report__stats-panel">
          <h2 className="public-monthly-report__stats-panel-title">
            Statistiques du mois
          </h2>

          <div className="public-monthly-report__stats-group">
            <p className="public-monthly-report__stats-group-label">Activité</p>
            <div className="public-monthly-report__stats">
              <div className="public-monthly-report__stat public-monthly-report__stat--envoyees">
                <span className="public-monthly-report__stat-value">
                  {data.stats.candidaturesEnvoyees}
                </span>
                <span className="public-monthly-report__stat-label">Envoyées</span>
              </div>
              <div className="public-monthly-report__stat public-monthly-report__stat--encours">
                <span className="public-monthly-report__stat-value">
                  {data.stats.enCours}
                </span>
                <span className="public-monthly-report__stat-label">En cours</span>
              </div>
              <div className="public-monthly-report__stat public-monthly-report__stat--entretiens">
                <span className="public-monthly-report__stat-value">
                  {data.stats.entretiens}
                </span>
                <span className="public-monthly-report__stat-label">Entretiens</span>
              </div>
            </div>
          </div>

          <div className="public-monthly-report__stats-group">
            <p className="public-monthly-report__stats-group-label">Indicateurs</p>
            <div className="public-monthly-report__stats">
              <div className="public-monthly-report__stat public-monthly-report__stat--offres">
                <span className="public-monthly-report__stat-value">{offres}</span>
                <span className="public-monthly-report__stat-label">Offres reçues</span>
              </div>
              <div className="public-monthly-report__stat public-monthly-report__stat--taux public-monthly-report__stat--refus">
                <span className="public-monthly-report__stat-value">
                  {data.stats.tauxRefus}%
                </span>
                <span
                  className="public-monthly-report__stat-bar"
                  role="presentation"
                  aria-hidden
                >
                  <span
                    className="public-monthly-report__stat-bar-fill"
                    style={{ width: `${data.stats.tauxRefus}%` }}
                  />
                </span>
                <span className="public-monthly-report__stat-label">Taux de refus</span>
              </div>
              <div className="public-monthly-report__stat public-monthly-report__stat--taux public-monthly-report__stat--silence">
                <span className="public-monthly-report__stat-value">
                  {data.stats.tauxSansReponse}%
                </span>
                <span
                  className="public-monthly-report__stat-bar"
                  role="presentation"
                  aria-hidden
                >
                  <span
                    className="public-monthly-report__stat-bar-fill"
                    style={{ width: `${data.stats.tauxSansReponse}%` }}
                  />
                </span>
                <span className="public-monthly-report__stat-label">Sans réponse</span>
              </div>
            </div>
          </div>

          {sourcesSorted.length > 0 && (
            <>
              <h3 className="public-monthly-report__subtitle">Par source</h3>
              <ul className="public-monthly-report__source-list">
                {sourcesSorted.map(([source, count], index) => (
                  <li key={source} className="public-monthly-report__source-item">
                    <span className="public-monthly-report__source-name">
                      {SOURCE_LABELS[source]}
                    </span>
                    <span
                      className="public-monthly-report__source-bar"
                      role="presentation"
                      aria-hidden
                    >
                      <span
                        className={`public-monthly-report__source-bar-fill public-monthly-report__source-bar-fill--${index % 3}`}
                        style={{ width: `${Math.round((count / maxSourceCount) * 100)}%` }}
                      />
                    </span>
                    <span className="public-monthly-report__source-count">{count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="public-monthly-report__share-card">
          <ShareQrCode
            url={reportUrl}
            label="Scanner pour ouvrir le bilan"
          />
          <p className="public-monthly-report__share-url">{reportUrl}</p>
        </section>

        {data.publicNotes && (
          <section className="public-monthly-report__card">
            <h2 className="public-monthly-report__card-title">Notes</h2>
            <p className="public-monthly-report__notes">{data.publicNotes}</p>
          </section>
        )}

        <section className="public-monthly-report__weeks">
          <h2 className="public-monthly-report__card-title">Candidatures semaine par semaine</h2>
          {data.weeks.length === 0 ? (
            <p className="public-monthly-report__muted">
              Aucune candidature enregistrée pour ce mois.
            </p>
          ) : (
            data.weeks.map((week) => {
              const isOpen = openWeeks[week.weekStart] ?? false;
              return (
                <section
                  key={week.weekStart}
                  className={`public-monthly-report__week${isOpen ? " public-monthly-report__week--open" : ""}`}
                >
                  <header
                    className="public-monthly-report__week-header"
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenWeeks((prev) => ({
                        ...prev,
                        [week.weekStart]: !isOpen,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenWeeks((prev) => ({
                          ...prev,
                          [week.weekStart]: !isOpen,
                        }));
                      }
                    }}
                  >
                    <span className="public-monthly-report__week-chevron" aria-hidden>
                      {isOpen ? "▼" : "▶"}
                    </span>
                    <div className="public-monthly-report__week-heading">
                      <h3 className="public-monthly-report__week-title">
                        {(() => {
                          const sep = week.weekLabel.indexOf(" · ");
                          if (sep < 0) return week.weekLabel;
                          return (
                            <>
                              <span className="public-monthly-report__week-ordinal">
                                {week.weekLabel.slice(0, sep)}
                              </span>
                              <span className="public-monthly-report__week-dates">
                                {week.weekLabel.slice(sep + 3)}
                              </span>
                            </>
                          );
                        })()}
                      </h3>
                      <span className="public-monthly-report__week-count">
                        {week.candidatures.length}
                      </span>
                    </div>
                  </header>
                  {isOpen && (
                    <div className="public-monthly-report__week-body">
                      {week.candidatures.length === 0 ? (
                        <p className="public-monthly-report__muted">
                          Aucune candidature cette semaine.
                        </p>
                      ) : (
                        week.candidatures.map((c) => (
                          <ShareCandidatureCard
                            key={`${week.weekStart}-${c.entreprise}-${c.poste}-${c.dateCandidature}`}
                            data={c}
                            compact
                          />
                        ))
                      )}
                    </div>
                  )}
                </section>
              );
            })
          )}
        </section>

        <footer className="public-monthly-report__footer">
          <p>
            Bilan partagé via PlanMyJob · Partagé le {formatShareDate(data.sharedAt)}
            {data.expiresAt
              ? ` · Expire le ${formatShareDate(data.expiresAt)}`
              : ""}
          </p>
          <p className="public-monthly-report__footer-note">
            Document en lecture seule — les données ont été figées au moment du partage.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default PublicMonthlyReport;

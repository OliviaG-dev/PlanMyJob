import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ShareQrCode from "../../components/ShareQrCode/ShareQrCode";
import { fetchPublicShare } from "../../lib/share";
import type { PublicShareData } from "../../types/share.types";
import {
  formatShareDate,
  formatShareDateShort,
  getShareUrl,
  getStatutEmoji,
} from "../../utils/shareSnapshot";
import "./PublicShare.css";

type PageState =
  | { status: "loading" }
  | { status: "error"; reason: "not_found" | "expired" | "revoked" | "fetch" }
  | { status: "ready"; data: PublicShareData };

const ERROR_MESSAGES = {
  not_found: "Ce lien de partage est introuvable ou n'existe plus.",
  expired: "Ce lien de partage a expiré.",
  revoked: "Ce lien de partage a été révoqué.",
  fetch: "Impossible de charger le rapport. Réessayez plus tard.",
};

function PublicShare() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState({ status: "error", reason: "not_found" });
      return;
    }

    let cancelled = false;
    fetchPublicShare(token)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setState({ status: "ready", data: result.data });
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
      const { downloadSharePdf } = await import("../../utils/sharePdf");
      await downloadSharePdf(token, state.data);
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
      <div className="public-share">
        <div className="public-share__container">
          <p className="public-share__loading">Chargement du rapport…</p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="public-share">
        <div className="public-share__container public-share__container--error">
          <header className="public-share__brand">
            <span className="public-share__brand-name">PlanMyJob</span>
          </header>
          <h1 className="public-share__error-title">Lien indisponible</h1>
          <p className="public-share__error-text">
            {ERROR_MESSAGES[state.reason]}
          </p>
          <Link to="/login" className="public-share__home-link">
            Accéder à PlanMyJob
          </Link>
        </div>
      </div>
    );
  }

  const { data } = state;
  const shareUrl = token ? getShareUrl(token) : "";

  return (
    <div className="public-share">
      <div className="public-share__container">
        <header className="public-share__header">
          <div className="public-share__brand">
            <span className="public-share__brand-name">PlanMyJob</span>
            <span className="public-share__brand-tag">Rapport de candidature</span>
          </div>
          <button
            type="button"
            className="public-share__pdf-btn"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            {downloading ? "Génération…" : "Télécharger PDF"}
          </button>
        </header>

        {downloadError && (
          <p className="public-share__download-error" role="alert">
            {downloadError}
          </p>
        )}

        <section className="public-share__hero">
          <p className="public-share__company">{data.entreprise}</p>
          <h1 className="public-share__title">{data.poste}</h1>
          <div className="public-share__status">
            <span className="public-share__status-dot" aria-hidden>
              {getStatutEmoji(data.statut)}
            </span>
            {data.statutLabel}
          </div>
        </section>

        <div className="public-share__grid">
          <section className="public-share__card">
            <h2 className="public-share__card-title">Informations</h2>
            <dl className="public-share__details">
              <div className="public-share__detail">
                <dt>Date de candidature</dt>
                <dd>{formatShareDate(data.dateCandidature)}</dd>
              </div>
              <div className="public-share__detail">
                <dt>Localisation</dt>
                <dd>{data.localisation ?? "—"}</dd>
              </div>
              <div className="public-share__detail">
                <dt>CV envoyé</dt>
                <dd>{data.cvEnvoye ? "✓ Oui" : "— Non"}</dd>
              </div>
              {data.typeContratLabel && (
                <div className="public-share__detail">
                  <dt>Type de contrat</dt>
                  <dd>{data.typeContratLabel}</dd>
                </div>
              )}
              {data.sourceLabel && (
                <div className="public-share__detail">
                  <dt>Source</dt>
                  <dd>{data.sourceLabel}</dd>
                </div>
              )}
              {data.lienOffre && (
                <div className="public-share__detail">
                  <dt>Lien de l'offre</dt>
                  <dd>
                    <a
                      href={data.lienOffre}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="public-share__link"
                    >
                      Voir l'offre
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <aside className="public-share__card public-share__card--qr">
            <ShareQrCode url={shareUrl} />
            <p className="public-share__share-url">{shareUrl}</p>
          </aside>
        </div>

        {data.publicNotes && (
          <section className="public-share__card">
            <h2 className="public-share__card-title">Notes</h2>
            <p className="public-share__notes">{data.publicNotes}</p>
          </section>
        )}

        <section className="public-share__card">
          <h2 className="public-share__card-title">Historique</h2>
          {data.timeline.length === 0 ? (
            <p className="public-share__muted">Aucun événement enregistré.</p>
          ) : (
            <ol className="public-share__timeline">
              {data.timeline.map((event) => (
                <li key={`${event.date}-${event.label}`} className="public-share__timeline-item">
                  <span className="public-share__timeline-date">
                    {formatShareDateShort(event.date)}
                  </span>
                  <span className="public-share__timeline-label">
                    ✓ {event.label}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <footer className="public-share__footer">
          <p>
            Rapport généré via PlanMyJob · Partagé le{" "}
            {formatShareDate(data.sharedAt)}
            {data.expiresAt
              ? ` · Expire le ${formatShareDate(data.expiresAt)}`
              : ""}
          </p>
          <p className="public-share__footer-note">
            Document en lecture seule — les données ont été figées au moment du
            partage.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default PublicShare;

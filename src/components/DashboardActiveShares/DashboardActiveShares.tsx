import { useState } from "react";
import { revokeShare } from "../../lib/share";
import { useActiveShares } from "../../hooks/useActiveShares";
import {
  formatShareDateNumeric,
  getShareUrl,
} from "../../utils/shareSnapshot";
import { formatShareError } from "../../utils/shareErrors";
import "./DashboardActiveShares.css";

type DashboardActiveSharesProps = {
  userId: string;
};

function CalendarIcon() {
  return (
    <svg
      className="dashboard-active-shares__meta-icon"
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
      className="dashboard-active-shares__meta-icon"
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
      className="dashboard-active-shares__meta-icon"
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

function DashboardActiveShares({ userId }: DashboardActiveSharesProps) {
  const { shares, loading, error, reload } = useActiveShares(userId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleCopy(shareId: string, token: string) {
    setActionError(null);
    try {
      await navigator.clipboard.writeText(getShareUrl(token));
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setActionError("Impossible de copier le lien");
    }
  }

  async function handleRevoke(shareId: string) {
    setRevokingId(shareId);
    setActionError(null);
    try {
      await revokeShare(shareId);
      await reload();
    } catch (err) {
      setActionError(formatShareError(err));
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <section className="dashboard__block dashboard-active-shares">
      <h2 className="dashboard__block-title">Liens de partage actifs</h2>
      <p className="dashboard__block-desc">
        Consultez, copiez ou révoquez vos liens publics de candidature.
      </p>

      {actionError && (
        <p className="dashboard-active-shares__error" role="alert">
          {actionError}
        </p>
      )}

      {loading ? (
        <p className="dashboard-active-shares__muted">Chargement…</p>
      ) : error ? (
        <p className="dashboard-active-shares__error" role="alert">
          {error}
        </p>
      ) : shares.length === 0 ? (
        <p className="dashboard-active-shares__muted">
          Aucun lien actif. Créez un partage depuis une fiche candidature.
        </p>
      ) : (
        <ul className="dashboard-active-shares__list">
          {shares.map((share) => {
            const shareUrl = getShareUrl(share.token);
            return (
              <li key={share.id} className="dashboard-active-shares__item">
                <div className="dashboard-active-shares__info">
                  <p className="dashboard-active-shares__title">
                    <span className="dashboard-active-shares__company">
                      {share.entreprise}
                    </span>
                    <span className="dashboard-active-shares__separator">·</span>
                    <span className="dashboard-active-shares__role">
                      {share.poste}
                    </span>
                  </p>
                  <div className="dashboard-active-shares__meta">
                    <span className="dashboard-active-shares__meta-chip dashboard-active-shares__meta-chip--created">
                      <CalendarIcon />
                      <span>
                        Créé le{" "}
                        <time dateTime={share.createdAt}>
                          {formatShareDateNumeric(share.createdAt)}
                        </time>
                      </span>
                    </span>
                    <span
                      className={`dashboard-active-shares__meta-chip dashboard-active-shares__meta-chip--expiry${
                        share.expiresAt
                          ? ""
                          : " dashboard-active-shares__meta-chip--never"
                      }`}
                    >
                      {share.expiresAt ? <ClockIcon /> : <InfinityIcon />}
                      <span>
                        {share.expiresAt ? (
                          <>
                            Expire le{" "}
                            <time dateTime={share.expiresAt}>
                              {formatShareDateNumeric(share.expiresAt)}
                            </time>
                          </>
                        ) : (
                          "Sans expiration"
                        )}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="dashboard-active-shares__actions">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dashboard-active-shares__btn dashboard-active-shares__btn--view"
                  >
                    Voir
                  </a>
                  <button
                    type="button"
                    className="dashboard-active-shares__btn dashboard-active-shares__btn--copy"
                    onClick={() => handleCopy(share.id, share.token)}
                  >
                    {copiedId === share.id ? "Copié ✓" : "Copier"}
                  </button>
                  <button
                    type="button"
                    className="dashboard-active-shares__btn dashboard-active-shares__btn--revoke"
                    onClick={() => handleRevoke(share.id)}
                    disabled={revokingId === share.id}
                  >
                    {revokingId === share.id ? "…" : "Révoquer"}
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

export default DashboardActiveShares;

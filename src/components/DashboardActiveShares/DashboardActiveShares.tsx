import { useEffect, useMemo, useState } from "react";
import { revokeShare } from "../../lib/share";
import { useActiveShares } from "../../hooks/useActiveShares";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import { Pagination } from "../Pagination/Pagination";
import {
  formatShareDateNumeric,
  getShareUrl,
} from "../../utils/shareSnapshot";
import { formatShareError } from "../../utils/shareErrors";
import "./DashboardActiveShares.css";

type DashboardActiveSharesProps = {
  userId: string;
};

const LINKS_PAGE_SIZE = 2;

type RevokeTarget = {
  id: string;
  label: string;
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
  const [revokeTarget, setRevokeTarget] = useState<RevokeTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [listPage, setListPage] = useState(0);

  const totalListPages = Math.max(1, Math.ceil(shares.length / LINKS_PAGE_SIZE));
  const safeListPage = Math.min(listPage, totalListPages - 1);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(shares.length / LINKS_PAGE_SIZE) - 1);
    setListPage((page) => Math.min(page, maxPage));
  }, [shares.length]);

  const visibleShares = useMemo(
    () =>
      shares.slice(
        safeListPage * LINKS_PAGE_SIZE,
        safeListPage * LINKS_PAGE_SIZE + LINKS_PAGE_SIZE
      ),
    [shares, safeListPage]
  );

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

  async function handleRevokeConfirm() {
    if (!revokeTarget) return;
    setRevokingId(revokeTarget.id);
    setActionError(null);
    try {
      await revokeShare(revokeTarget.id);
      await reload();
      setRevokeTarget(null);
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
        Consultez, copiez ou désactivez vos liens publics de candidature.
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
        <>
        <ul className="dashboard-active-shares__list">
          {visibleShares.map((share) => {
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
                    className="dashboard-active-shares__btn dashboard-active-shares__btn--deactivate"
                    onClick={() =>
                      setRevokeTarget({
                        id: share.id,
                        label: `${share.entreprise} · ${share.poste}`,
                      })
                    }
                    disabled={revokingId === share.id}
                  >
                    {revokingId === share.id ? "…" : "Désactiver"}
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
          ariaLabel="Pagination des liens de partage actifs"
        />
        </>
      )}

      <ConfirmModal
        isOpen={revokeTarget !== null}
        title="Désactiver ce lien ?"
        message={
          revokeTarget
            ? `Le lien « ${revokeTarget.label} » ne sera plus accessible.`
            : ""
        }
        confirmLabel="Désactiver le lien"
        loading={revokingId !== null}
        onConfirm={() => void handleRevokeConfirm()}
        onCancel={() => {
          if (!revokingId) setRevokeTarget(null);
        }}
      />
    </section>
  );
}

export default DashboardActiveShares;

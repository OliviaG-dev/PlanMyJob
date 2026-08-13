import { useCallback, useEffect, useState } from "react";
import type { Candidature } from "../../types/candidature";
import type { ShareDuration, ShareRecord } from "../../types/share.types";
import {
  createShare,
  fetchSharesForCandidature,
  isShareActive,
  revokeShare,
} from "../../lib/share";
import { getShareUrl } from "../../utils/shareSnapshot";
import { formatShareError } from "../../utils/shareErrors";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import "./ShareModal.css";

const DURATION_OPTIONS: { value: ShareDuration; label: string }[] = [
  { value: "24h", label: "24 heures" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "never", label: "Jamais" },
];

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  candidature: Candidature;
  userId: string;
};

function ShareModal({ isOpen, onClose, candidature, userId }: ShareModalProps) {
  const [duration, setDuration] = useState<ShareDuration>("7d");
  const [publicNotes, setPublicNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [existingShares, setExistingShares] = useState<ShareRecord[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    setLoadingShares(true);
    setListError(null);
    try {
      const shares = await fetchSharesForCandidature(userId, candidature.id);
      setExistingShares(shares.filter(isShareActive));
    } catch (err) {
      setListError(formatShareError(err));
      setExistingShares([]);
    } finally {
      setLoadingShares(false);
    }
  }, [userId, candidature.id]);

  useEffect(() => {
    if (!isOpen) return;
    setCreatedUrl(null);
    setCopied(false);
    setError(null);
    setPublicNotes("");
    setDuration("7d");
    void loadShares();
  }, [isOpen, loadShares]);

  if (!isOpen) return null;

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const result = await createShare(userId, candidature, duration, publicNotes);
      const url = getShareUrl(result.token);
      setCreatedUrl(url);
      await loadShares();
    } catch (err) {
      setError(formatShareError(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Impossible de copier le lien");
    }
  }

  async function handleRevokeConfirm() {
    if (!revokeTargetId) return;
    setRevokingId(revokeTargetId);
    setError(null);
    try {
      await revokeShare(revokeTargetId);
      await loadShares();
      setRevokeTargetId(null);
    } catch (err) {
      setError(formatShareError(err));
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div
      className="share-modal__overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <header className="share-modal__header">
          <h2 id="share-modal-title" className="share-modal__title">
            Partager la candidature
          </h2>
          <p className="share-modal__subtitle">
            Générez un lien sécurisé en lecture seule — idéal pour France
            Travail, un recruteur ou un coach.
          </p>
        </header>

        {error && (
          <p className="share-modal__error" role="alert">
            {error}
          </p>
        )}

        {!createdUrl ? (
          <>
            <div className="share-modal__field">
              <label htmlFor="share-duration" className="share-modal__label">
                Durée de validité
              </label>
              <select
                id="share-duration"
                className="share-modal__select"
                value={duration}
                onChange={(e) => setDuration(e.target.value as ShareDuration)}
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="share-modal__field">
              <label htmlFor="share-notes" className="share-modal__label">
                Notes publiques (optionnel)
              </label>
              <textarea
                id="share-notes"
                className="share-modal__textarea"
                rows={3}
                placeholder="Ex. : Candidature envoyée via LinkedIn, relance prévue la semaine prochaine…"
                value={publicNotes}
                onChange={(e) => setPublicNotes(e.target.value)}
              />
            </div>

            <div className="share-modal__actions">
              <button
                type="button"
                className="share-modal__btn share-modal__btn--secondary"
                onClick={onClose}
              >
                Annuler
              </button>
              <button
                type="button"
                className="share-modal__btn share-modal__btn--primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Création…" : "Créer le lien"}
              </button>
            </div>
          </>
        ) : (
          <div className="share-modal__success">
            <p className="share-modal__success-text">
              Lien créé avec succès. Collez-le dans le commentaire de vos
              démarches France Travail ou partagez-le par email.
            </p>
            <div className="share-modal__url-row">
              <input
                type="text"
                readOnly
                className="share-modal__url-input"
                value={createdUrl}
                aria-label="Lien de partage"
              />
              <button
                type="button"
                className="share-modal__btn share-modal__btn--primary"
                onClick={() => handleCopy(createdUrl)}
              >
                {copied ? "Copié ✓" : "Copier"}
              </button>
            </div>
            <div className="share-modal__actions">
              <button
                type="button"
                className="share-modal__btn share-modal__btn--secondary"
                onClick={() => setCreatedUrl(null)}
              >
                Créer un autre lien
              </button>
              <button
                type="button"
                className="share-modal__btn share-modal__btn--primary"
                onClick={onClose}
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        <section className="share-modal__existing">
          <h3 className="share-modal__existing-title">Liens actifs</h3>
          {listError && (
            <p className="share-modal__list-error" role="status">
              {listError}
            </p>
          )}
          {loadingShares ? (
            <p className="share-modal__muted">Chargement…</p>
          ) : existingShares.length === 0 ? (
            <p className="share-modal__muted">Aucun lien actif pour cette candidature.</p>
          ) : (
            <ul className="share-modal__list">
              {existingShares.map((share) => {
                const url = getShareUrl(share.token);
                return (
                  <li key={share.id} className="share-modal__list-item">
                    <div className="share-modal__list-info">
                      <span className="share-modal__list-url">{url}</span>
                      <span className="share-modal__list-meta">
                        Créé le{" "}
                        {new Date(share.createdAt).toLocaleDateString("fr-FR")}
                        {share.expiresAt
                          ? ` · Expire le ${new Date(share.expiresAt).toLocaleDateString("fr-FR")}`
                          : " · Sans expiration"}
                      </span>
                    </div>
                    <div className="share-modal__list-actions">
                      <button
                        type="button"
                        className="share-modal__btn share-modal__btn--secondary share-modal__btn--small"
                        onClick={() => handleCopy(url)}
                      >
                        Copier
                      </button>
                      <button
                        type="button"
                        className="share-modal__btn share-modal__btn--deactivate share-modal__btn--small"
                        onClick={() => setRevokeTargetId(share.id)}
                        disabled={revokingId === share.id}
                      >
                        {revokingId === share.id ? "…" : "Désactiver"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <ConfirmModal
        isOpen={revokeTargetId !== null}
        title="Désactiver ce lien ?"
        message="Ce lien public ne sera plus accessible."
        confirmLabel="Désactiver le lien"
        loading={revokingId !== null}
        onConfirm={() => void handleRevokeConfirm()}
        onCancel={() => {
          if (!revokingId) setRevokeTargetId(null);
        }}
      />
    </div>
  );
}

export default ShareModal;

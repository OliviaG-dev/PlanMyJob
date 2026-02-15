import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchCandidature,
  updateCandidature,
  deleteCandidature,
} from "../../lib/candidatures";
import AddCandidatureModal, {
  type AddCandidatureFormData,
} from "../Candidatures/AddCandidatureModal";
import type {
  Candidature,
  Statut,
  StatutSuivi,
  TypeContrat,
  Teletravail,
  SourceCandidature,
} from "../../types/candidature";
import "./CandidatureDetail.css";

function candidatureToFormData(c: Candidature): AddCandidatureFormData {
  return {
    entreprise: c.entreprise ?? "",
    poste: c.poste ?? "",
    lienOffre: c.lienOffre ?? "",
    localisation: c.localisation ?? "",
    typeContrat: c.typeContrat ?? "cdi",
    teletravail: c.teletravail ?? "inconnu",
    dateCandidature:
      c.dateCandidature?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    source: c.source ?? "linkedin",
    notePersonnelle: c.notePersonnelle ?? 3,
    statutSuivi: c.statutSuivi ?? "en_cours",
    statut: c.statut ?? "a_postuler",
    salaireOuFourchette: c.salaireOuFourchette ?? "",
    notes: c.notes ?? "",
  };
}

const STATUT_KANBAN_LABELS: Record<Statut, string> = {
  a_postuler: "À postuler",
  cv_envoye: "CV envoyé",
  entretien_rh: "Entretien RH",
  entretien_technique: "Entretien technique",
  attente_reponse: "Attente de réponse",
  refus: "Refus",
  offre: "Offre",
};

const STATUT_SUIVI_LABELS: Record<StatutSuivi, string> = {
  en_cours: "En cours",
  terminee: "Terminée",
};

const TYPE_CONTRAT_LABELS: Record<TypeContrat, string> = {
  cdi: "CDI",
  cdd: "CDD",
  alternance: "Alternance",
  stage: "Stage",
  freelance: "Freelance",
  autre: "Autre",
};

const TELETRAVAIL_LABELS: Record<Teletravail, string> = {
  inconnu: "Je ne sais pas",
  oui: "Oui",
  non: "Non",
  hybride: "Hybride",
};

const SOURCE_LABELS: Record<SourceCandidature, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  welcome_to_the_jungle: "Welcome to the Jungle",
  hellowork: "HelloWork",
  site_entreprise: "Site entreprise",
  autre: "Autre",
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const MS_SEC = 1000;
const MS_MIN = 60 * MS_SEC;
const MS_H = 60 * MS_MIN;
const MS_J = 24 * MS_H;
const MS_SEM = 7 * MS_J;
const MS_MOIS = 30 * MS_J;

/** Affiche le temps écoulé depuis une date ISO (1 s, 1 min, 1 h, 1 j, 1 sem., 1 mois). */
function formatTemporalite(cvEnvoyeAt: string): string {
  const elapsed = Date.now() - new Date(cvEnvoyeAt).getTime();
  if (elapsed < 0) return "—";
  if (elapsed < MS_MIN) {
    const s = Math.max(1, Math.round(elapsed / MS_SEC));
    return `${s} seconde${s > 1 ? "s" : ""}`;
  }
  if (elapsed < MS_H) {
    const m = Math.max(1, Math.round(elapsed / MS_MIN));
    return `${m} minute${m > 1 ? "s" : ""}`;
  }
  if (elapsed < MS_J) {
    const h = Math.max(1, Math.round(elapsed / MS_H));
    return `${h} h`;
  }
  if (elapsed < MS_SEM) {
    const j = Math.max(1, Math.round(elapsed / MS_J));
    return `${j} j`;
  }
  if (elapsed < MS_MOIS) {
    const sem = Math.max(1, Math.round(elapsed / MS_SEM));
    return `${sem} sem.`;
  }
  const mois = Math.max(1, Math.round(elapsed / MS_MOIS));
  return `${mois} mois`;
}

const MAX_STARS = 5;

function StarRating({ value }: { value: number }) {
  const full = Math.min(MAX_STARS, Math.max(0, Math.round(value)));
  const empty = MAX_STARS - full;
  return (
    <span
      className="candidature-detail__stars"
      aria-label={`Note : ${value} sur ${MAX_STARS}`}
    >
      {Array.from({ length: full }, (_, i) => (
        <span
          key={`full-${i}`}
          className="candidature-detail__star candidature-detail__star--full"
          aria-hidden
        >
          ★
        </span>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <span
          key={`empty-${i}`}
          className="candidature-detail__star candidature-detail__star--empty"
          aria-hidden
        >
          ☆
        </span>
      ))}
    </span>
  );
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | number | null;
  children?: React.ReactNode;
}) {
  const content =
    children ?? (value != null && value !== "" ? String(value) : "—");
  return (
    <div className="candidature-detail__row">
      <dt className="candidature-detail__label">{label}</dt>
      <dd className="candidature-detail__value">{content}</dd>
    </div>
  );
}

type DetailState = {
  candidature: Candidature | null;
  loading: boolean;
  error: string | null;
};

function CandidatureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<DetailState>({
    candidature: null,
    loading: true,
    error: null,
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { candidature, loading, error } = state;

  useEffect(() => {
    if (!id || !user?.id) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setState((s) => ({ ...s, loading: true, error: null }));
    });
    fetchCandidature(user.id, id)
      .then((c) => {
        if (!cancelled)
          setState({ candidature: c, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState({
            candidature: null,
            loading: false,
            error: err.message ?? "Erreur au chargement",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  async function handleEditSubmit(data: AddCandidatureFormData) {
    if (!id || !user?.id) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await updateCandidature(user.id, id, {
        entreprise: data.entreprise,
        poste: data.poste,
        lienOffre: data.lienOffre,
        localisation: data.localisation || undefined,
        typeContrat: data.typeContrat,
        teletravail: data.teletravail,
        dateCandidature: data.dateCandidature || null,
        source: data.source,
        notePersonnelle: data.notePersonnelle,
        statutSuivi: data.statutSuivi,
        statut: data.statut,
        salaireOuFourchette: data.salaireOuFourchette || null,
        notes: data.notes || null,
      });
      setState((s) => ({ ...s, candidature: updated }));
      setEditModalOpen(false);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Erreur à l'enregistrement"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!id || !user?.id || !candidature) return;
    setDeleting(true);
    setActionError(null);
    setDeleteConfirmOpen(false);
    try {
      await deleteCandidature(user.id, id);
      navigate("/candidatures", { replace: true });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Erreur à la suppression"
      );
    } finally {
      setDeleting(false);
    }
  }

  if (!id) {
    return (
      <main className="candidature-detail">
        <Link to="/candidatures" className="candidature-detail__back">
          ← Retour aux candidatures
        </Link>
        <p className="candidature-detail__not-found">
          Candidature introuvable.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="candidature-detail">
        <Link to="/candidatures" className="candidature-detail__back">
          ← Retour aux candidatures
        </Link>
        <p className="candidature-detail__loading">Chargement…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="candidature-detail">
        <Link to="/candidatures" className="candidature-detail__back">
          ← Retour aux candidatures
        </Link>
        <p className="candidature-detail__error" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!candidature) {
    return (
      <main className="candidature-detail">
        <Link to="/candidatures" className="candidature-detail__back">
          ← Retour aux candidatures
        </Link>
        <p className="candidature-detail__not-found">
          Candidature introuvable.
        </p>
      </main>
    );
  }

  return (
    <main className="candidature-detail">
      <Link to="/candidatures" className="candidature-detail__back">
        ← Retour aux candidatures
      </Link>

      {actionError && (
        <p className="candidature-detail__error" role="alert">
          {actionError}
        </p>
      )}

      <header className="candidature-detail__header">
        <div className="candidature-detail__header-left">
          <h1 className="candidature-detail__title">
            {candidature.entreprise}
          </h1>
          <p className="candidature-detail__poste">{candidature.poste}</p>
        </div>
        <span
          className={`candidature-detail__badge candidature-detail__badge--kanban candidature-detail__badge--${candidature.statut}`}
        >
          {STATUT_KANBAN_LABELS[candidature.statut]}
        </span>
      </header>

      <section className="candidature-detail__section">
        <h2 className="candidature-detail__section-title">
          Informations générales
        </h2>
        <dl className="candidature-detail__grid">
          <DetailRow
            label="Suivi"
            value={
              candidature.statutSuivi
                ? STATUT_SUIVI_LABELS[candidature.statutSuivi]
                : undefined
            }
          />
          {candidature.statut === "cv_envoye" && candidature.cvEnvoyeAt && (
            <DetailRow
              label="CV envoyé depuis"
              value={formatTemporalite(candidature.cvEnvoyeAt)}
            />
          )}
          <DetailRow
            label="Date de candidature"
            value={formatDate(candidature.dateCandidature)}
          />
          <DetailRow label="Localisation" value={candidature.localisation} />
          <DetailRow
            label="Type de contrat"
            value={
              candidature.typeContrat
                ? TYPE_CONTRAT_LABELS[candidature.typeContrat]
                : undefined
            }
          />
          <DetailRow
            label="Télétravail"
            value={
              candidature.teletravail
                ? TELETRAVAIL_LABELS[candidature.teletravail]
                : undefined
            }
          />
          <DetailRow
            label="Source"
            value={
              candidature.source ? SOURCE_LABELS[candidature.source] : undefined
            }
          />
          <DetailRow label="Note personnelle">
            {candidature.notePersonnelle != null ? (
              <StarRating value={candidature.notePersonnelle} />
            ) : (
              "—"
            )}
          </DetailRow>
          <DetailRow
            label="Salaire ou fourchette"
            value={candidature.salaireOuFourchette}
          />
        </dl>
      </section>

      {(candidature.lienOffre || candidature.notes) && (
        <section className="candidature-detail__section">
          <h2 className="candidature-detail__section-title">Liens et notes</h2>
          <dl className="candidature-detail__grid">
            {candidature.lienOffre && (
              <DetailRow label="Lien de l'offre">
                <a
                  href={candidature.lienOffre}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="candidature-detail__link"
                >
                  {candidature.lienOffre}
                </a>
              </DetailRow>
            )}
            <DetailRow label="Notes" value={candidature.notes} />
          </dl>
        </section>
      )}

      <div className="candidature-detail__actions">
        <button
          type="button"
          className="candidature-detail__btn candidature-detail__btn--edit"
          onClick={() => setEditModalOpen(true)}
        >
          <img
            src="/icons/editer.png"
            alt=""
            className="candidature-detail__btn-icon"
            aria-hidden
          />
          Modifier
        </button>
        <button
          type="button"
          className="candidature-detail__btn candidature-detail__btn--delete"
          onClick={() => setDeleteConfirmOpen(true)}
          disabled={deleting}
        >
          <img
            src="/icons/supprimer.png"
            alt=""
            className="candidature-detail__btn-icon"
            aria-hidden
          />
          {deleting ? "Suppression…" : "Supprimer"}
        </button>
      </div>

      {deleteConfirmOpen && (
        <div
          className="candidature-detail__confirm-overlay"
          onClick={() => setDeleteConfirmOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="candidature-detail__confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="confirm-title"
              className="candidature-detail__confirm-title"
            >
              Supprimer cette candidature ?
            </h2>
            <p className="candidature-detail__confirm-text">
              Cette action est irréversible.
            </p>
            <div className="candidature-detail__confirm-actions">
              <button
                type="button"
                className="candidature-detail__confirm-btn candidature-detail__confirm-btn--cancel"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="candidature-detail__confirm-btn candidature-detail__confirm-btn--delete"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddCandidatureModal
        key={editModalOpen ? `edit-${id}` : "closed"}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setActionError(null);
        }}
        onSubmit={handleEditSubmit}
        isSubmitting={submitting}
        mode="edit"
        initialData={candidatureToFormData(candidature)}
      />
    </main>
  );
}

export default CandidatureDetail;

import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchCandidature } from "../../lib/candidatures";
import type {
  Candidature,
  Statut,
  StatutSuivi,
  TypeContrat,
  Teletravail,
  SourceCandidature,
} from "../../types/candidature";
import "./CandidatureDetail.css";

const STATUT_KANBAN_LABELS: Record<Statut, string> = {
  a_postuler: "À postuler",
  cv_envoye: "CV envoyé",
  entretien_rh: "Entretien RH",
  entretien_technique: "Entretien technique",
  attente_reponse: "Attente de réponse",
  refus: "Refus",
  offre: "Offre 🎉",
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
  const { user } = useAuth();
  const [state, setState] = useState<DetailState>({
    candidature: null,
    loading: true,
    error: null,
  });
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
    </main>
  );
}

export default CandidatureDetail;

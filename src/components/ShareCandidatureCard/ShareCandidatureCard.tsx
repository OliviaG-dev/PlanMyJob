import { useId, useState, type KeyboardEvent } from "react";
import type { PublicShareSnapshot } from "../../types/share.types";
import {
  formatShareDate,
  getStatutEmoji,
} from "../../utils/shareSnapshot";
import "./ShareCandidatureCard.css";

type ShareCandidatureCardProps = {
  data: PublicShareSnapshot;
  compact?: boolean;
};

function CandidatureDetails({
  data,
  compact = false,
}: {
  data: PublicShareSnapshot;
  compact?: boolean;
}) {
  return (
    <dl
      className={`share-candidature-card__details${
        compact ? " share-candidature-card__details--inline" : ""
      }`}
    >
      <div className="share-candidature-card__detail">
        <dt>Date</dt>
        <dd>{formatShareDate(data.dateCandidature)}</dd>
      </div>
      <div className="share-candidature-card__detail">
        <dt>Lieu</dt>
        <dd>{data.localisation ?? "—"}</dd>
      </div>
      <div className="share-candidature-card__detail">
        <dt>CV</dt>
        <dd>{data.cvEnvoye ? "Envoyé" : "Non"}</dd>
      </div>
      {data.typeContratLabel && (
        <div className="share-candidature-card__detail">
          <dt>Contrat</dt>
          <dd>{data.typeContratLabel}</dd>
        </div>
      )}
      {data.sourceLabel && (
        <div className="share-candidature-card__detail">
          <dt>Source</dt>
          <dd>{data.sourceLabel}</dd>
        </div>
      )}
      {data.lienOffre && (
        <div className="share-candidature-card__detail share-candidature-card__detail--link">
          <dt>Offre</dt>
          <dd>
            <a
              href={data.lienOffre}
              target="_blank"
              rel="noopener noreferrer"
              className="share-candidature-card__link"
            >
              Voir l&apos;offre
            </a>
          </dd>
        </div>
      )}
    </dl>
  );
}

function ShareCandidatureCard({ data, compact = false }: ShareCandidatureCardProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const infoPanelId = useId();

  function toggleInfo() {
    setInfoOpen((open) => !open);
  }

  function handleInfoKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleInfo();
    }
  }

  if (compact) {
    return (
      <article className="share-candidature-card share-candidature-card--compact">
        <div className="share-candidature-card__main">
          <div className="share-candidature-card__identity">
            <p className="share-candidature-card__company">{data.entreprise}</p>
            <h3 className="share-candidature-card__title">{data.poste}</h3>
          </div>
          <span
            className={`share-candidature-card__status share-candidature-card__status--${data.statut}`}
          >
            <span className="share-candidature-card__status-dot" aria-hidden>
              {getStatutEmoji(data.statut)}
            </span>
            {data.statutLabel}
          </span>
        </div>

        <header
          className={`share-candidature-card__toggle${
            infoOpen ? " share-candidature-card__toggle--open" : ""
          }`}
          role="button"
          tabIndex={0}
          aria-expanded={infoOpen}
          aria-controls={infoPanelId}
          onClick={toggleInfo}
          onKeyDown={handleInfoKeyDown}
        >
          <span className="share-candidature-card__toggle-chevron" aria-hidden>
            {infoOpen ? "▾" : "▸"}
          </span>
            <span className="share-candidature-card__toggle-label">
              {infoOpen ? "Refermer" : "Voir les détails"}
            </span>
          {!infoOpen && (
            <span className="share-candidature-card__toggle-hint">
              {formatShareDate(data.dateCandidature)}
              {data.sourceLabel ? ` · ${data.sourceLabel}` : ""}
            </span>
          )}
        </header>

        {infoOpen && (
          <div id={infoPanelId} className="share-candidature-card__panel">
            <CandidatureDetails data={data} compact />
          </div>
        )}
      </article>
    );
  }

  return (
    <article className="share-candidature-card">
      <div className="share-candidature-card__hero">
        <div className="share-candidature-card__hero-main">
          <p className="share-candidature-card__company">{data.entreprise}</p>
          <h3 className="share-candidature-card__title">{data.poste}</h3>
        </div>
        <div className="share-candidature-card__status">
          <span className="share-candidature-card__status-dot" aria-hidden>
            {getStatutEmoji(data.statut)}
          </span>
          {data.statutLabel}
        </div>
      </div>

      <div className="share-candidature-card__card">
        <h4 className="share-candidature-card__card-title">Informations</h4>
        <CandidatureDetails data={data} />
      </div>
    </article>
  );
}

export default ShareCandidatureCard;

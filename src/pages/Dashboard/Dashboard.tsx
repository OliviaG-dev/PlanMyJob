import { useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDashboardData } from "../../hooks/useDashboardData";
import type { SourceCandidature, Statut, TypeContrat } from "../../types/candidature";
import "./Dashboard.css";

const STATUT_LABELS: Record<Statut, string> = {
  a_postuler: "À postuler",
  cv_envoye: "CV envoyé",
  entretien_rh: "Entretien RH",
  entretien_technique: "Entretien technique",
  attente_reponse: "Attente de réponse",
  refus: "Refus",
  sans_reponse: "Sans réponse",
  offre: "Offre",
};

const SOURCE_LABELS: Record<SourceCandidature, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  france_travail: "France Travail",
  welcome_to_the_jungle: "Welcome to the Jungle",
  hellowork: "HelloWork",
  site_entreprise: "Site entreprise",
  autre: "Autre",
};

const TYPE_CONTRAT_LABELS: Record<TypeContrat, string> = {
  cdi: "CDI",
  cdd: "CDD",
  alternance: "Alternance",
  stage: "Stage",
  freelance: "Freelance",
  autre: "Autre",
};

/** Couleurs pour le graphique radial (répartition par statut) */
const STATUT_CHART_COLORS: Record<Statut, string> = {
  a_postuler: "#b76e79",
  cv_envoye: "#d4a5a5",
  entretien_rh: "#9b8b8e",
  entretien_technique: "#7a7573",
  attente_reponse: "#e8d5d7",
  refus: "#c4b5b7",
  sans_reponse: "#b9a8aa",
  offre: "#8f6b72",
};

type DonutSegment = { label: string; value: number; color: string };

function DonutChart({
  segments,
  size = 200,
  strokeWidth = 28,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="dashboard__donut-empty">
        <span>Aucune donnée</span>
      </div>
    );
  }
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2 - 2;
  const rInner = r - strokeWidth;
  const paths = segments.map((seg, index) => {
    const priorTotal = segments
      .slice(0, index)
      .reduce((sum, item) => sum + item.value, 0);
    const startRatio = priorTotal / total;
    const endRatio = (priorTotal + seg.value) / total;
    const ratio = seg.value / total;
    const startAngle = (startRatio * 360 - 90) * (Math.PI / 180);
    const endAngle = (endRatio * 360 - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const x3 = cx + rInner * Math.cos(endAngle);
    const y3 = cy + rInner * Math.sin(endAngle);
    const x4 = cx + rInner * Math.cos(startAngle);
    const y4 = cy + rInner * Math.sin(startAngle);
    const large = ratio > 0.5 ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
    return { ...seg, path };
  });

  return (
    <div className="dashboard__donut-wrap">
      <svg
        className="dashboard__donut-svg"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        aria-hidden
      >
        {paths.map((seg, i) => (
          <path
            key={i}
            d={seg.path}
            fill={seg.color}
            className="dashboard__donut-segment"
          />
        ))}
        <circle
          cx={cx}
          cy={cy}
          r={rInner}
          fill="var(--surface)"
          aria-hidden
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="dashboard__donut-total"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          className="dashboard__donut-total-label"
        >
          total
        </text>
      </svg>
      <ul className="dashboard__donut-legend">
        {segments.map((seg, i) => (
          <li key={i} className="dashboard__donut-legend-item">
            <span
              className="dashboard__donut-legend-dot"
              style={{ background: seg.color }}
              aria-hidden
            />
            <span className="dashboard__donut-legend-label">{seg.label}</span>
            <span className="dashboard__donut-legend-value">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { loading, error, weeklyGoals, stats } = useDashboardData(user?.id);

  const donutSegments = useMemo((): DonutSegment[] => {
    return (Object.entries(stats.repartitionStatut) as [Statut, number][])
      .filter(([, count]) => count > 0)
      .map(([statut, value]) => ({
        label: STATUT_LABELS[statut],
        value,
        color: STATUT_CHART_COLORS[statut],
      }));
  }, [stats.repartitionStatut]);

  if (loading) {
    return (
      <main className="dashboard">
        <div className="dashboard__header">
          <div>
            <h1>Tableau de bord</h1>
            <p className="dashboard__intro">Vue d'ensemble de votre recherche d'emploi.</p>
          </div>
          <img src="/icons/dashboard.png" alt="" className="dashboard__icon" aria-hidden />
        </div>
        <div className="dashboard__sections">
          <div className="dashboard__loading-wrap">
            <p className="dashboard__loading">Chargement…</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard">
        <div className="dashboard__header">
          <div>
            <h1>Tableau de bord</h1>
            <p className="dashboard__intro">Vue d'ensemble de votre recherche d'emploi.</p>
          </div>
          <img src="/icons/dashboard.png" alt="" className="dashboard__icon" aria-hidden />
        </div>
        <div className="dashboard__sections">
          <div className="dashboard__error-wrap">
            <p className="dashboard__error">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="dashboard__intro">
            Vue d'ensemble de votre recherche d'emploi.
          </p>
        </div>
        <img
          src="/icons/dashboard.png"
          alt=""
          className="dashboard__icon"
          aria-hidden
        />
      </div>

      <div className="dashboard__sections">
      {/* Bloc 1 : Candidatures */}
      <section className="dashboard__block">
        <h2 className="dashboard__block-title">Candidatures</h2>
        <p className="dashboard__block-desc">Résumé de vos envois et du suivi en cours.</p>
        <div className="dashboard__stats">
          <div className="stat-card">
            <span className="stat-card__value">{stats.candidaturesEnvoyees}</span>
            <span className="stat-card__label">Candidatures envoyées</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.enCours}</span>
            <span className="stat-card__label">En cours</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.entretiens}</span>
            <span className="stat-card__label">Entretiens</span>
          </div>
        </div>
      </section>

      {/* Bloc 2 : Taux et tendances */}
      <section className="dashboard__block">
        <h2 className="dashboard__block-title">Taux et tendances</h2>
        <p className="dashboard__block-desc">Taux de réponse, refus et activité récente.</p>
        <div className="dashboard__stats">
          <div className="stat-card">
            <span className="stat-card__value">{stats.tauxReponse}%</span>
            <span className="stat-card__label">Taux de réponse</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.tauxRefus}%</span>
            <span className="stat-card__label">Taux de refus</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.offres}</span>
            <span className="stat-card__label">Offres</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.sansReponse}</span>
            <span className="stat-card__label">Sans réponse</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.candidaturesCetteSemaine}</span>
            <span className="stat-card__label">Cette semaine</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.candidaturesCeMois}</span>
            <span className="stat-card__label">Ce mois</span>
          </div>
        </div>
      </section>

      {/* Bloc 3 : Organisation */}
      <section className="dashboard__block">
        <h2 className="dashboard__block-title">Organisation</h2>
        <p className="dashboard__block-desc">Tâches, projets et ressources à portée de main.</p>
        <div className="dashboard__stats">
          <div className="stat-card">
            <span className="stat-card__value">{stats.tachesAFaire}</span>
            <span className="stat-card__label">Tâches à faire (cette semaine)</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.tachesTermineesSemaine}</span>
            <span className="stat-card__label">Tâches terminées (semaine)</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.projetsCount}</span>
            <span className="stat-card__label">Projets / réalisations</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.cvsCount}</span>
            <span className="stat-card__label">CV disponibles</span>
          </div>
        </div>
      </section>

      {/* Bloc 4 : Répartition */}
      <section className="dashboard__block">
        <h2 className="dashboard__block-title">Répartition</h2>
        <p className="dashboard__block-desc">Vos candidatures par statut, source et type de contrat.</p>
        <div className="dashboard__radial-wrap">
          <div className="dashboard__radial-chart">
            <h3 className="dashboard__repartition-subtitle">Par statut</h3>
            <DonutChart segments={donutSegments} size={200} strokeWidth={32} />
          </div>
        </div>
        <div className="dashboard__repartition">
          <div className="dashboard__repartition-col">
            <h3 className="dashboard__repartition-subtitle">Par statut</h3>
            <ul className="dashboard__list">
              {(Object.entries(stats.repartitionStatut) as [Statut, number][]).map(
                ([statut, count]) =>
                  count > 0 ? (
                    <li key={statut} className="dashboard__list-item">
                      <span className="dashboard__list-label">{STATUT_LABELS[statut]}</span>
                      <span className="dashboard__list-value">{count}</span>
                    </li>
                  ) : null
              )}
            </ul>
          </div>
          <div className="dashboard__repartition-col">
            <h3 className="dashboard__repartition-subtitle">Par source</h3>
            <ul className="dashboard__list">
              {(Object.entries(stats.repartitionSource) as [SourceCandidature, number][]).map(
                ([source, count]) =>
                  count > 0 ? (
                    <li key={source} className="dashboard__list-item">
                      <span className="dashboard__list-label">{SOURCE_LABELS[source]}</span>
                      <span className="dashboard__list-value">{count}</span>
                    </li>
                  ) : null
              )}
            </ul>
          </div>
          <div className="dashboard__repartition-col">
            <h3 className="dashboard__repartition-subtitle">Par type de contrat</h3>
            <ul className="dashboard__list">
              {(Object.entries(stats.repartitionTypeContrat) as [TypeContrat, number][]).map(
                ([type, count]) =>
                  count > 0 ? (
                    <li key={type} className="dashboard__list-item">
                      <span className="dashboard__list-label">{TYPE_CONTRAT_LABELS[type]}</span>
                      <span className="dashboard__list-value">{count}</span>
                    </li>
                  ) : null
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Bloc 5 : Objectifs / motivation */}
      <section className="dashboard__block">
        <h2 className="dashboard__block-title">Objectifs & motivation</h2>
        <p className="dashboard__block-desc">Objectif hebdo, dernière candidature et sites utilisés.</p>
        <div className="dashboard__stats">
          <div className="stat-card stat-card--highlight">
            <span className="stat-card__value">
              {stats.candidaturesCetteSemaine} / {weeklyGoals.candidatures}
            </span>
            <span className="stat-card__label">Candidatures cette semaine (objectif)</span>
          </div>
          <div className="stat-card stat-card--highlight">
            <span className="stat-card__value">
              {stats.candidaturesCeMois} / {weeklyGoals.candidaturesMois}
            </span>
            <span className="stat-card__label">Candidatures ce mois (objectif)</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">
              {stats.joursDepuisDerniereCandidature !== null
                ? stats.joursDepuisDerniereCandidature
                : "—"}
            </span>
            <span className="stat-card__label">Jours depuis la dernière candidature</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">
              {stats.sitesUtilises} / {stats.totalSites}
            </span>
            <span className="stat-card__label">Sites d'emploi utilisés</span>
          </div>
        </div>
      </section>
      </div>
    </main>
  );
}

export default Dashboard;

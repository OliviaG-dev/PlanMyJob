import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { CvRessource, CvType, CvFormat } from "../../types/cvRessource";
import { useCvResources } from "../../hooks/useCvResources";
import { useJobSites } from "../../hooks/useJobSites";
import { OutilsProgressWrap } from "./OutilsProgressWrap";
import { MotivationGeneratorSection } from "./components/MotivationGeneratorSection";
import { OfferAnalyzerSection } from "./components/OfferAnalyzerSection";
import "./OutilsPostulations.css";

const CV_TYPE_LABELS: Record<CvType, string> = {
  tech: "Tech",
  agence: "Agence",
  grande_entreprise: "Grande entreprise",
  autre: "Autre",
};

const CV_FORMAT_LABELS: Record<CvFormat, string> = {
  court: "Court",
  complet: "Complet",
};

/** Convertit une URL en version affichable (Google Drive → preview ou viewer PDF) */
function getEmbedUrl(url: string): string {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const driveOpenMatch = url.match(
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  );
  const fileId = driveMatch?.[1] ?? driveOpenMatch?.[1];
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  if (url.toLowerCase().includes(".pdf") || url.includes("pdf")) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  }
  return url;
}

function CvSection() {
  const { user } = useAuth();
  const { cvs, loading, error, addCv, removeCv } = useCvResources(user?.id);
  const [showAdd, setShowAdd] = useState(false);
  const [addTitre, setAddTitre] = useState("");
  const [addType, setAddType] = useState<CvType>("tech");
  const [addFormat, setAddFormat] = useState<CvFormat | "">("");
  const [addUrl, setAddUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [viewCv, setViewCv] = useState<CvRessource | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = async (cv: CvRessource) => {
    try {
      await navigator.clipboard.writeText(cv.url);
      setCopiedId(cv.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback si clipboard non disponible
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const titre = addTitre.trim();
    const url = addUrl.trim();
    if (!titre || !url || adding) return;
    setAdding(true);
    const ok = await addCv({
        titre,
        type: addType,
        format: addFormat || undefined,
        url,
      });
    if (ok) {
      setAddTitre("");
      setAddType("tech");
      setAddFormat("");
      setAddUrl("");
      setShowAdd(false);
    }
    setAdding(false);
  };

  const handleDelete = async (cv: CvRessource) => {
    if (viewCv?.id === cv.id) setViewCv(null);
    await removeCv(cv.id);
  };

  useEffect(() => {
    if (!viewCv) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewCv(null);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [viewCv]);

  return (
    <section className="outils-postulations__block">
      <h2 className="outils-postulations__block-title">CV</h2>
      <p className="outils-postulations__block-desc">
        Stockez vos CV avec un lien et visualisez-les en grand.
      </p>
      {error && (
        <p className="outils-postulations__error" role="alert">
          {error}
        </p>
      )}

      {!loading && (
        <OutilsProgressWrap
          value={cvs.length}
          max={10}
          label={
            cvs.length === 0
              ? "Aucun CV pour l'instant"
              : cvs.length === 1
                ? "1 CV disponible"
                : `${cvs.length} CVs disponibles`
          }
        />
      )}

      {loading && <p className="outils-postulations__loading">Chargement…</p>}

      {!loading && (
        <>
          {showAdd ? (
            <form
              className="outils-postulations__add-form"
              onSubmit={handleAdd}
            >
              <input
                type="text"
                placeholder="Titre (ex. CV Tech)"
                value={addTitre}
                onChange={(e) => setAddTitre(e.target.value)}
                className="outils-postulations__add-input"
                required
                disabled={adding}
              />
              <div className="outils-postulations__add-row">
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as CvType)}
                  className="outils-postulations__add-select"
                  disabled={adding}
                  aria-label="Type de CV"
                >
                  {(Object.keys(CV_TYPE_LABELS) as CvType[]).map((t) => (
                    <option key={t} value={t}>
                      {CV_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <select
                  value={addFormat}
                  onChange={(e) =>
                    setAddFormat((e.target.value || "") as CvFormat | "")
                  }
                  className="outils-postulations__add-select"
                  disabled={adding}
                  aria-label="Format (sous-type)"
                >
                  <option value="">— Format —</option>
                  {(Object.keys(CV_FORMAT_LABELS) as CvFormat[]).map((f) => (
                    <option key={f} value={f}>
                      {CV_FORMAT_LABELS[f]}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="url"
                placeholder="Lien (Google Drive, Notion, etc.)"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                className="outils-postulations__add-input"
                required
                disabled={adding}
              />
              <div className="outils-postulations__add-actions">
                <button
                  type="submit"
                  className="outils-postulations__add-btn"
                  disabled={adding}
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  className="outils-postulations__add-cancel"
                  onClick={() => {
                    setShowAdd(false);
                    setAddTitre("");
                    setAddUrl("");
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : null}

          <ul className="outils-postulations__cv-list">
            {cvs.map((cv) => (
              <li key={cv.id} className="outils-postulations__cv-card">
                <div className="outils-postulations__cv-card-body">
                  <div className="outils-postulations__cv-card-header">
                    <h3 className="outils-postulations__cv-card-title">
                      {cv.titre}
                    </h3>
                    <div className="outils-postulations__cv-card-badges">
                      <span
                        className={`outils-postulations__cv-card-type outils-postulations__cv-card-type--${cv.type}`}
                      >
                        {CV_TYPE_LABELS[cv.type]}
                      </span>
                      {cv.format && (
                        <span className="outils-postulations__cv-card-format">
                          {CV_FORMAT_LABELS[cv.format]}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="outils-postulations__cv-card-delete"
                      onClick={() => handleDelete(cv)}
                      aria-label={`Supprimer ${cv.titre}`}
                    >
                      ×
                    </button>
                  </div>
                  <div className="outils-postulations__cv-card-actions">
                    <button
                      type="button"
                      className="outils-postulations__cv-card-link"
                      onClick={() => handleCopyLink(cv)}
                      aria-label={`Copier le lien de ${cv.titre}`}
                    >
                      {copiedId === cv.id ? "Copié !" : "Copier le lien"}
                    </button>
                    <button
                      type="button"
                      className="outils-postulations__cv-card-view"
                      onClick={() => setViewCv(cv)}
                    >
                      Voir en grand
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {cvs.length === 0 && !showAdd && (
            <p className="outils-postulations__empty">
              Aucun CV pour le moment.
            </p>
          )}

          {!showAdd && (
            <div className="outils-postulations__add-trigger-wrap">
              <button
                type="button"
                className="outils-postulations__add-trigger"
                onClick={() => setShowAdd(true)}
              >
                + Ajouter un CV
              </button>
            </div>
          )}
        </>
      )}

      {viewCv && (
        <div
          className="outils-postulations__view-overlay"
          onClick={() => setViewCv(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cv-view-title"
        >
          <div
            className="outils-postulations__view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="outils-postulations__view-header">
              <h2
                id="cv-view-title"
                className="outils-postulations__view-title"
              >
                {viewCv.titre}
              </h2>
              <button
                type="button"
                className="outils-postulations__view-close"
                onClick={() => setViewCv(null)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <div className="outils-postulations__view-body">
              <iframe
                src={getEmbedUrl(viewCv.url)}
                title={viewCv.titre}
                className="outils-postulations__view-iframe"
              />
            </div>
            <div className="outils-postulations__view-footer">
              <a
                href={viewCv.url}
                target="_blank"
                rel="noopener noreferrer"
                className="outils-postulations__view-open"
              >
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function OutilsPostulations() {
  const { user } = useAuth();
  const {
    jobSites,
    loadingSites,
    siteCheckboxes,
    sitesError,
    setSiteCheckbox,
    addSite,
    removeSite,
  } = useJobSites(user?.id);
  const [showAddSite, setShowAddSite] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addingSite, setAddingSite] = useState(false);

  const sitesUsedCount = useMemo(
    () =>
      jobSites.filter(
        (s) => siteCheckboxes[s.id]?.created || siteCheckboxes[s.id]?.cvSent
      ).length,
    [jobSites, siteCheckboxes]
  );

  const sitesUsedLabel =
    sitesUsedCount === 0
      ? "Aucun site utilisé"
      : sitesUsedCount === 1
        ? "1 site utilisé"
        : `${sitesUsedCount} sites utilisés`;

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = addLabel.trim();
    const url = addUrl.trim();
    if (!label || !url || addingSite) return;
    setAddingSite(true);
    const ok = await addSite(label, url);
    if (ok) {
      setAddLabel("");
      setAddUrl("");
      setShowAddSite(false);
    }
    setAddingSite(false);
  };

  const handleDeleteSite = async (id: string) => {
    if (!window.confirm("Supprimer ce site de la liste ?")) return;
    await removeSite(id);
  };

  return (
    <main className="outils-postulations">
      <div className="outils-postulations__header">
        <div>
          <h1>Ressources</h1>
          <p className="outils-postulations__intro">
            Modèles, templates et liens utiles pour optimiser vos candidatures.
          </p>
        </div>
        <img
          src="/icons/ressources.png"
          alt=""
          className="outils-postulations__icon"
          aria-hidden
        />
      </div>

      <div className="outils-postulations__sections">
        <CvSection />

        <MotivationGeneratorSection />

        <section className="outils-postulations__block">
          <h2 className="outils-postulations__block-title">
            Sites d&apos;emploi
          </h2>
          <p className="outils-postulations__block-desc">
            Liens vers les plateformes de recherche d&apos;emploi.
          </p>
          {sitesError && (
            <p className="outils-postulations__error" role="alert">
              {sitesError}
            </p>
          )}
          {!loadingSites && (
            <OutilsProgressWrap
              value={sitesUsedCount}
              max={jobSites.length}
              label={sitesUsedLabel}
            />
          )}
          {loadingSites && (
            <p className="outils-postulations__loading">Chargement des sites…</p>
          )}
          {!loadingSites && (
            <>
              <div className="outils-postulations__sites-grid">
                {jobSites.map((site) => (
                  <div key={site.id} className="outils-postulations__site-card">
                    <div className="outils-postulations__site-card-head">
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="outils-postulations__site-card-link"
                      >
                        {site.label}
                      </a>
                      <div className="outils-postulations__site-card-actions">
                        <button
                          type="button"
                          className="outils-postulations__site-card-btn outils-postulations__site-card-btn--delete"
                          onClick={() => handleDeleteSite(site.id)}
                          aria-label={`Supprimer ${site.label}`}
                          title="Supprimer"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="outils-postulations__site-card-checkboxes">
                          <label className="outils-postulations__site-card-check">
                            <input
                              type="checkbox"
                              checked={siteCheckboxes[site.id]?.created ?? false}
                              onChange={(e) =>
                                setSiteCheckbox(site.id, "created", e.target.checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Compte créé sur ${site.label}`}
                            />
                            <span>Compte créé</span>
                          </label>
                          <label className="outils-postulations__site-card-check">
                            <input
                              type="checkbox"
                              checked={siteCheckboxes[site.id]?.cvSent ?? false}
                              onChange={(e) =>
                                setSiteCheckbox(site.id, "cvSent", e.target.checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Compte mis à jour sur ${site.label}`}
                            />
                            <span>Compte mis à jour</span>
                          </label>
                        </div>
                  </div>
                ))}
              </div>
              {showAddSite ? (
                <form
                  className="outils-postulations__site-add-form"
                  onSubmit={handleAddSite}
                >
                  <input
                    type="text"
                    value={addLabel}
                    onChange={(e) => setAddLabel(e.target.value)}
                    className="outils-postulations__add-input"
                    placeholder="Nom du site (ex. LinkedIn)"
                    required
                    disabled={addingSite}
                  />
                  <input
                    type="url"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    className="outils-postulations__add-input"
                    placeholder="URL (ex. https://…)"
                    required
                    disabled={addingSite}
                  />
                  <div className="outils-postulations__add-actions">
                    <button
                      type="submit"
                      className="outils-postulations__add-btn"
                      disabled={addingSite}
                    >
                      Ajouter
                    </button>
                    <button
                      type="button"
                      className="outils-postulations__add-cancel"
                      onClick={() => {
                        setShowAddSite(false);
                        setAddLabel("");
                        setAddUrl("");
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div className="outils-postulations__site-add-trigger-wrap">
                  <button
                    type="button"
                    className="outils-postulations__add-trigger"
                    onClick={() => setShowAddSite(true)}
                  >
                    + Ajouter un site
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <OfferAnalyzerSection />
      </div>
    </main>
  );
}

export default OutilsPostulations;

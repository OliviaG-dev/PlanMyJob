import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import type {
  Candidature,
  Statut,
} from "../../types/candidature";
import CandidaturesFilters from "../../components/CandidaturesFilters/CandidaturesFilters";
import { Pagination } from "../../components/Pagination/Pagination";
import {
  type ListType,
  useCandidaturesBoard,
} from "../../hooks/useCandidaturesBoard";
import AddCandidatureModal from "./AddCandidatureModal";
import "./Candidatures.css";

const CANDIDATURES_PAGE_SIZE = 3;

const STATUT_KANBAN_LABELS: Record<Statut, string> = {
  a_postuler: "À postuler",
  cv_envoye: "CV envoyé",
  entretien_rh: "Entretien RH",
  entretien_technique: "Entretien technique",
  attente_reponse: "Attente de réponse",
  refus: "Refus",
  sans_reponse: "Sans réponse",
  offre: "Offre",
};

const MAX_STARS = 5;

function StarRating({ value }: { value: number }) {
  const full = Math.min(MAX_STARS, Math.max(0, Math.round(value)));
  const empty = MAX_STARS - full;
  return (
    <span
      className="candidatures__stars"
      aria-label={`Note : ${value} sur ${MAX_STARS}`}
    >
      {Array.from({ length: full }, (_, i) => (
        <span
          key={`full-${i}`}
          className="candidatures__star candidatures__star--full"
          aria-hidden
        >
          ★
        </span>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <span
          key={`empty-${i}`}
          className="candidatures__star candidatures__star--empty"
          aria-hidden
        >
          ☆
        </span>
      ))}
    </span>
  );
}

const LIST_OPTIONS: { listType: ListType; label: string }[] = [
  { listType: "en_cours", label: "En cours" },
  { listType: "terminee", label: "Terminée" },
  { listType: "refus", label: "Refus" },
];

function formatCreatedAt(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Candidatures() {
  const { user } = useAuth();
  const {
    candidatures,
    loading,
    error,
    submitting,
    modalOpen,
    initialDataForAdd,
    dragOverList,
    draggingId,
    filterNom,
    filterTeletravail,
    filterVille,
    filterNote,
    listPages,
    isMobile,
    openMoveMenuId,
    moveMenuAnchorRef,
    villesUniques,
    refus,
    enCours,
    terminee,
    setModalOpen,
    setInitialDataForAdd,
    setOpenMoveMenuId,
    setListPages,
    setFilterNom,
    setFilterTeletravail,
    setFilterVille,
    setFilterNote,
    handleAddCandidature,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    moveCandidatureToList,
  } = useCandidaturesBoard(user?.id);

  function renderList(items: Candidature[], listType: ListType) {
    return (
      <ul className="candidatures__items">
        {items.map((c) => (
          <li
            key={c.id}
            className={`candidatures__item ${
              draggingId === c.id ? "candidatures__item--dragging" : ""
            }`}
            draggable={!isMobile}
            onDragStart={!isMobile ? (e) => handleDragStart(e, c) : undefined}
            onDragEnd={!isMobile ? handleDragEnd : undefined}
          >
            <div
              className={`candidatures__item-mobile-wrap ${isMobile ? "candidatures__item-mobile-wrap--active" : ""}`}
              ref={
                openMoveMenuId === c.id
                  ? (el) => {
                      moveMenuAnchorRef.current = el;
                    }
                  : undefined
              }
            >
              <div className="candidatures__item-row">
                <Link
                  to={`/candidatures/${c.id}`}
                  className={`candidatures__link ${
                    listType === "terminee"
                      ? "candidatures__link--terminee"
                      : ""
                  } ${listType === "refus" ? "candidatures__link--refus" : ""}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="candidatures__link-content">
                    <span className="candidatures__item-entreprise">
                      {c.entreprise}
                    </span>
                    <span className="candidatures__item-poste">{c.poste}</span>
                  </div>
                  <div className="candidatures__link-right">
                    {c.createdAt && (
                      <span className="candidatures__item-date">
                        {formatCreatedAt(c.createdAt)}
                      </span>
                    )}
                    <div className="candidatures__link-right-bottom">
                      <span className="candidatures__item-kanban">
                        {STATUT_KANBAN_LABELS[c.statut]}
                      </span>
                    </div>
                  </div>
                  {c.notePersonnelle != null && (
                    <div className="candidatures__link-note">
                      <StarRating value={c.notePersonnelle} />
                    </div>
                  )}
                </Link>
                {isMobile && (
                  <button
                    type="button"
                    className="candidatures__item-move-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenMoveMenuId(
                        openMoveMenuId === c.id ? null : c.id
                      );
                    }}
                    aria-label="Déplacer"
                    aria-expanded={openMoveMenuId === c.id}
                    aria-haspopup="true"
                  >
                    ⋯
                  </button>
                )}
              </div>
              {isMobile && openMoveMenuId === c.id && (
                <div
                  className="candidatures__item-move-menu"
                  role="menu"
                  aria-label="Déplacer vers"
                >
                  {LIST_OPTIONS.filter((opt) => opt.listType !== listType).map(
                    ({ listType: targetList, label: l }) => (
                      <button
                        key={targetList}
                        type="button"
                        role="menuitem"
                        className="candidatures__item-move-menu-item"
                        onClick={() =>
                          moveCandidatureToList(c.id, targetList)
                        }
                      >
                        {l}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className="candidatures">
      <div className="candidatures__head">
        <div className="candidatures__head-left">
          <h1>Candidatures</h1>
          <p className="candidatures__intro">
            Liste de toutes vos candidatures.
          </p>
        </div>
        <div className="candidatures__head-center">
          <img
            src="/icons/candidatures.png"
            alt=""
            className="candidatures__icon"
            aria-hidden
          />
        </div>
        <div className="candidatures__head-right">
        <button
          type="button"
          className="candidatures__add-btn"
          onClick={() => setModalOpen(true)}
          disabled={!user}
        >
          <span className="candidatures__add-btn-plus">+</span> Ajouter une
          candidature
        </button>
        </div>
      </div>

      <div className="candidatures__add-bottom">
        <button
          type="button"
          className="candidatures__add-btn"
          onClick={() => setModalOpen(true)}
          disabled={!user}
        >
          <span className="candidatures__add-btn-plus">+</span> Ajouter une
          candidature
        </button>
      </div>

      {error && (
        <p className="candidatures__error" role="alert">
          {error}
        </p>
      )}

      {!loading && candidatures.length > 0 && (
        <CandidaturesFilters
          idPrefix="candidatures"
          nom={filterNom}
          onNomChange={setFilterNom}
          teletravail={filterTeletravail}
          onTeletravailChange={setFilterTeletravail}
          ville={filterVille}
          onVilleChange={setFilterVille}
          note={filterNote}
          onNoteChange={setFilterNote}
          villes={villesUniques}
        />
      )}

      {loading && (
        <section className="candidatures__list">
          <p className="candidatures__empty">Chargement…</p>
        </section>
      )}
      {!loading && !error && candidatures.length === 0 && (
        <section className="candidatures__list">
          <p className="candidatures__empty">
            Aucune candidature pour l'instant.
          </p>
        </section>
      )}

      {!loading && candidatures.length > 0 && (
        <>
          <section className="candidatures__list-wrapper">
            <h2 className="candidatures__list-title">En cours</h2>
            <div
              className={`candidatures__list ${
                dragOverList === "en_cours"
                  ? "candidatures__list--drag-over"
                  : ""
              }`}
              onDragOver={(e) => handleDragOver(e, "en_cours")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "en_cours")}
            >
              {enCours.length === 0 ? (
                <p className="candidatures__empty">
                  Aucune candidature en cours.
                </p>
              ) : (() => {
                const totalPages = Math.ceil(
                  enCours.length / CANDIDATURES_PAGE_SIZE
                );
                const currentPage = Math.min(
                  listPages.en_cours,
                  Math.max(0, totalPages - 1)
                );
                return (
                  <>
                    {renderList(
                      enCours.slice(
                        currentPage * CANDIDATURES_PAGE_SIZE,
                        (currentPage + 1) * CANDIDATURES_PAGE_SIZE
                      ),
                      "en_cours"
                    )}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) =>
                        setListPages((p) => ({ ...p, en_cours: page }))
                      }
                      ariaLabel="Pagination En cours"
                    />
                  </>
                );
              })()}
            </div>
          </section>
          <section className="candidatures__list-wrapper">
            <h2 className="candidatures__list-title">Terminée</h2>
            <div
              className={`candidatures__list ${
                dragOverList === "terminee"
                  ? "candidatures__list--drag-over"
                  : ""
              }`}
              onDragOver={(e) => handleDragOver(e, "terminee")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "terminee")}
            >
              {terminee.length === 0 ? (
                <p className="candidatures__empty">
                  Aucune candidature terminée.
                </p>
              ) : (() => {
                const totalPages = Math.ceil(
                  terminee.length / CANDIDATURES_PAGE_SIZE
                );
                const currentPage = Math.min(
                  listPages.terminee,
                  Math.max(0, totalPages - 1)
                );
                return (
                  <>
                    {renderList(
                      terminee.slice(
                        currentPage * CANDIDATURES_PAGE_SIZE,
                        (currentPage + 1) * CANDIDATURES_PAGE_SIZE
                      ),
                      "terminee"
                    )}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) =>
                        setListPages((p) => ({ ...p, terminee: page }))
                      }
                      ariaLabel="Pagination Terminée"
                    />
                  </>
                );
              })()}
            </div>
          </section>
          <section className="candidatures__list-wrapper">
            <h2 className="candidatures__list-title">Refus</h2>
            <div
              className={`candidatures__list ${
                dragOverList === "refus" ? "candidatures__list--drag-over" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, "refus")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "refus")}
            >
              {refus.length === 0 ? (
                <p className="candidatures__empty">Aucun refus.</p>
              ) : (() => {
                const totalPages = Math.ceil(
                  refus.length / CANDIDATURES_PAGE_SIZE
                );
                const currentPage = Math.min(
                  listPages.refus,
                  Math.max(0, totalPages - 1)
                );
                return (
                  <>
                    {renderList(
                      refus.slice(
                        currentPage * CANDIDATURES_PAGE_SIZE,
                        (currentPage + 1) * CANDIDATURES_PAGE_SIZE
                      ),
                      "refus"
                    )}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) =>
                        setListPages((p) => ({ ...p, refus: page }))
                      }
                      ariaLabel="Pagination Refus"
                    />
                  </>
                );
              })()}
            </div>
          </section>
        </>
      )}

      <AddCandidatureModal
        key={initialDataForAdd ? "prefilled" : "add"}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setInitialDataForAdd(null);
        }}
        onSubmit={handleAddCandidature}
        isSubmitting={submitting}
        initialData={initialDataForAdd ?? undefined}
      />
    </main>
  );
}

export default Candidatures;

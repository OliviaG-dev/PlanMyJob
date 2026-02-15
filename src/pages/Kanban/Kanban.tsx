import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { fetchCandidatures, updateCandidature } from "../../lib/candidatures";
import type {
  Candidature,
  Statut,
  StatutSuivi,
  Teletravail,
} from "../../types/candidature";
import CandidaturesFilters, {
  filterCandidaturesByFilters,
} from "../../components/CandidaturesFilters/CandidaturesFilters";
import { Pagination } from "../../components/Pagination/Pagination";
import "./Kanban.css";

const STATUT_ICONS: Record<Statut, string> = {
  a_postuler: "/icons/a-postuler.png",
  cv_envoye: "/icons/cv-envoyer.png",
  entretien_rh: "/icons/entretien-rh.png",
  entretien_technique: "/icons/entretien-technique.png",
  attente_reponse: "/icons/attente d'une reponse.png",
  refus: "/icons/refus.png",
  offre: "/icons/offre.png",
};

const COLUMNS_MAIN: { statut: Statut; label: string }[] = [
  { statut: "a_postuler", label: "À postuler" },
  { statut: "cv_envoye", label: "CV envoyé" },
  { statut: "entretien_rh", label: "Entretien RH" },
  { statut: "entretien_technique", label: "Entretien technique" },
  { statut: "attente_reponse", label: "Attente de réponse" },
];

const COLUMNS_BOTTOM: { statut: Statut; label: string }[] = [
  { statut: "refus", label: "Refus" },
  { statut: "offre", label: "Offre" },
];

const ALL_COLUMNS = [...COLUMNS_MAIN, ...COLUMNS_BOTTOM];

const MAX_STARS = 5;
const MAIN_PAGE_SIZE = 5;
const REFUS_PAGE_SIZE = 10;
const OFFRE_PAGE_SIZE = 5;

function getPageSize(statut: Statut): number {
  if (statut === "refus") return REFUS_PAGE_SIZE;
  if (statut === "offre") return OFFRE_PAGE_SIZE;
  return MAIN_PAGE_SIZE;
}

function StarRating({ value }: { value: number }) {
  const full = Math.min(MAX_STARS, Math.max(0, Math.round(value)));
  const empty = MAX_STARS - full;
  return (
    <span
      className="kanban__stars"
      aria-label={`Note : ${value} sur ${MAX_STARS}`}
    >
      {Array.from({ length: full }, (_, i) => (
        <span
          key={`full-${i}`}
          className="kanban__star kanban__star--full"
          aria-hidden
        >
          ★
        </span>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <span
          key={`empty-${i}`}
          className="kanban__star kanban__star--empty"
          aria-hidden
        >
          ☆
        </span>
      ))}
    </span>
  );
}

function Kanban() {
  const { user } = useAuth();
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatut, setDragOverStatut] = useState<Statut | null>(null);
  const [columnPages, setColumnPages] = useState<Record<string, number>>({});
  const [filterNom, setFilterNom] = useState("");
  const [filterTeletravail, setFilterTeletravail] = useState<
    "" | Teletravail
  >("");
  const [filterVille, setFilterVille] = useState("");
  const [filterNote, setFilterNote] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [openMoveMenuId, setOpenMoveMenuId] = useState<string | null>(null);
  const moveMenuAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!openMoveMenuId) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        moveMenuAnchorRef.current &&
        !moveMenuAnchorRef.current.contains(target)
      ) {
        setOpenMoveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [openMoveMenuId]);

  const setColumnPage = (statut: Statut, page: number) => {
    setColumnPages((prev) => ({ ...prev, [statut]: page }));
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchCandidatures(user.id)
      .then((data) => {
        setError(null);
        setCandidatures(data);
      })
      .catch((err) => {
        setError(err.message ?? "Erreur au chargement");
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const effectiveCandidatures = user?.id ? candidatures : [];
  const villesUniques = [
    ...new Set(
      effectiveCandidatures
        .map((c) => (c.localisation ?? "").trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b, "fr"));
  const filterState = {
    nom: filterNom,
    teletravail: filterTeletravail,
    ville: filterVille,
    note: filterNote,
  };
  const filteredCandidatures = filterCandidaturesByFilters(
    effectiveCandidatures,
    filterState
  );
  const effectiveLoading = user?.id ? loading : false;

  const candidaturesEnCours = filteredCandidatures.filter(
    (c) =>
      c.statut !== "refus" &&
      (c.statutSuivi === "en_cours" || c.statutSuivi !== "terminee")
  );
  const candidaturesRefus = filteredCandidatures.filter(
    (c) => c.statut === "refus"
  );
  const candidaturesOffre = filteredCandidatures.filter(
    (c) => c.statut === "offre"
  );

  const getCandidaturesByStatut = (statut: Statut) =>
    candidaturesEnCours.filter((c) => c.statut === statut);

  const getBottomCandidatures = (statut: Statut) =>
    statut === "refus" ? candidaturesRefus : candidaturesOffre;

  function handleDragStart(e: React.DragEvent, c: Candidature) {
    setDraggingId(c.id);
    e.dataTransfer.setData("application/json", JSON.stringify({ id: c.id }));
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", c.id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStatut(null);
  }

  function handleDragOver(e: React.DragEvent, statut: Statut) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatut(statut);
  }

  function handleDragLeave() {
    setDragOverStatut(null);
  }

  async function moveCandidatureTo(candidatureId: string, newStatut: Statut) {
    if (!user?.id) return;
    const candidature = effectiveCandidatures.find((c) => c.id === candidatureId);
    if (!candidature || candidature.statut === newStatut) return;
    setOpenMoveMenuId(null);

    const payload: { statut: Statut; statutSuivi?: StatutSuivi } = {
      statut: newStatut,
    };
    if (newStatut === "refus") {
      payload.statutSuivi = "terminee";
    }

    const previous = [...effectiveCandidatures];
    setCandidatures((prev) =>
      prev.map((c) => {
        if (c.id !== candidatureId) return c;
        return {
          ...c,
          statut: payload.statut,
          ...(payload.statutSuivi !== undefined && {
            statutSuivi: payload.statutSuivi,
          }),
        };
      })
    );
    setError(null);
    try {
      await updateCandidature(user.id, candidatureId, payload);
    } catch (err) {
      setCandidatures(previous);
      setError(
        err instanceof Error ? err.message : "Erreur lors du déplacement"
      );
    }
  }

  async function handleDrop(e: React.DragEvent, newStatut: Statut) {
    e.preventDefault();
    setDragOverStatut(null);
    const raw =
      e.dataTransfer.getData("application/json") ||
      e.dataTransfer.getData("text/plain");
    let id: string;
    try {
      const parsed = raw.startsWith("{") ? JSON.parse(raw) : { id: raw };
      id = parsed.id ?? raw;
    } catch {
      id = raw;
    }
    if (!id) return;
    await moveCandidatureTo(id, newStatut);
  }

  return (
    <main className="kanban">
      <h1>Kanban</h1>
      <p className="kanban__intro">
        Glissez-déposez vos candidatures en cours entre les colonnes selon leur
        statut.
      </p>

      <CandidaturesFilters
        idPrefix="kanban"
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

      {error && (
        <p className="kanban__error" role="alert">
          {error}
        </p>
      )}

      {effectiveLoading && <div className="kanban__loading">Chargement…</div>}

      {!effectiveLoading && !error && (
        <>
          <div className="kanban__board kanban__board--main">
            {COLUMNS_MAIN.map(({ statut, label }) => {
              const columnCandidatures = getCandidaturesByStatut(statut);
              const pageSize = getPageSize(statut);
              const totalPages = Math.max(
                1,
                Math.ceil(columnCandidatures.length / pageSize)
              );
              const currentPage = Math.min(
                columnPages[statut] ?? 0,
                totalPages - 1
              );
              const displayed = columnCandidatures.slice(
                currentPage * pageSize,
                (currentPage + 1) * pageSize
              );
              const isDragOver = dragOverStatut === statut;
              return (
                <div
                  key={statut}
                  className={`kanban__column ${
                    isDragOver ? "kanban__column--drag-over" : ""
                  }`}
                  onDragOver={(e) => handleDragOver(e, statut)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, statut)}
                >
                  <h3 className="kanban__column-title">
                    <span className="kanban__column-title-text">
                      <img
                        src={STATUT_ICONS[statut]}
                        alt=""
                        className="kanban__column-icon"
                        aria-hidden
                      />
                      {label}
                    </span>
                    <div className="kanban__column-count">
                      <span className="kanban__column-count-num">
                        {columnCandidatures.length}
                      </span>
                    </div>
                  </h3>
                  <div className="kanban__cards">
                    {displayed.map((c) => (
                      <div
                        key={c.id}
                        className={`kanban__card-mobile-wrap ${isMobile ? "kanban__card-mobile-wrap--active" : ""}`}
                        ref={
                          openMoveMenuId === c.id
                            ? (el) => {
                                moveMenuAnchorRef.current = el;
                              }
                            : undefined
                        }
                      >
                        <div
                          className={`kanban__card ${
                            draggingId === c.id ? "kanban__card--dragging" : ""
                          }`}
                          draggable={!isMobile}
                          onDragStart={!isMobile ? (e) => handleDragStart(e, c) : undefined}
                          onDragEnd={!isMobile ? handleDragEnd : undefined}
                        >
                          <Link
                            to={`/candidatures/${c.id}`}
                            className="kanban__card-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="kanban__card-entreprise">
                              {c.entreprise}
                            </span>
                            {c.notePersonnelle != null && (
                              <StarRating value={c.notePersonnelle} />
                            )}
                          </Link>
                          {isMobile && statut !== "refus" && (
                            <button
                              type="button"
                              className="kanban__card-move-btn"
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
                        {isMobile && statut !== "refus" && openMoveMenuId === c.id && (
                          <div
                            className="kanban__card-move-menu"
                            role="menu"
                            aria-label="Déplacer vers"
                          >
                            {ALL_COLUMNS.filter(
                              (col) => col.statut !== c.statut
                            ).map(({ statut, label }) => (
                              <button
                                key={statut}
                                type="button"
                                role="menuitem"
                                className="kanban__card-move-menu-item"
                                onClick={() =>
                                  moveCandidatureTo(c.id, statut)
                                }
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setColumnPage(statut, page)}
                    ariaLabel={`Pagination ${label}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="kanban__board kanban__board--bottom">
            {COLUMNS_BOTTOM.map(({ statut, label }) => {
              const columnCandidatures = getBottomCandidatures(statut);
              const pageSize = getPageSize(statut);
              const totalPages = Math.max(
                1,
                Math.ceil(columnCandidatures.length / pageSize)
              );
              const currentPage = Math.min(
                columnPages[statut] ?? 0,
                totalPages - 1
              );
              const displayed = columnCandidatures.slice(
                currentPage * pageSize,
                (currentPage + 1) * pageSize
              );
              const isDragOver = dragOverStatut === statut;
              return (
                <div
                  key={statut}
                  className={`kanban__column ${
                    isDragOver ? "kanban__column--drag-over" : ""
                  }`}
                  onDragOver={(e) => handleDragOver(e, statut)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, statut)}
                >
                  <h3 className="kanban__column-title">
                    <span className="kanban__column-title-text">
                      <img
                        src={STATUT_ICONS[statut]}
                        alt=""
                        className="kanban__column-icon"
                        aria-hidden
                      />
                      {label}
                    </span>
                    <div className="kanban__column-count">
                      <span className="kanban__column-count-num">
                        {columnCandidatures.length}
                      </span>
                    </div>
                  </h3>
                  <div className="kanban__cards">
                    {displayed.map((c) => (
                      <div
                        key={c.id}
                        className={`kanban__card-mobile-wrap ${isMobile ? "kanban__card-mobile-wrap--active" : ""}`}
                        ref={
                          openMoveMenuId === c.id
                            ? (el) => {
                                moveMenuAnchorRef.current = el;
                              }
                            : undefined
                        }
                      >
                        <div
                          className={`kanban__card ${
                            statut === "refus" ? "kanban__card--refus" : ""
                          } ${
                            draggingId === c.id ? "kanban__card--dragging" : ""
                          }`}
                          draggable={!isMobile}
                          onDragStart={!isMobile ? (e) => handleDragStart(e, c) : undefined}
                          onDragEnd={!isMobile ? handleDragEnd : undefined}
                        >
                          <Link
                            to={`/candidatures/${c.id}`}
                            className="kanban__card-link"
                            onClick={(e) => e.stopPropagation()}
                            title={c.entreprise}
                          >
                            <span className="kanban__card-entreprise">
                              {statut === "refus"
                                ? (c.entreprise.slice(0, 2) || "?").toUpperCase()
                                : c.entreprise}
                            </span>
                            {statut !== "refus" &&
                              c.notePersonnelle != null && (
                                <StarRating value={c.notePersonnelle} />
                              )}
                          </Link>
                          {isMobile && statut !== "refus" && (
                            <button
                              type="button"
                              className="kanban__card-move-btn"
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
                        {isMobile && statut !== "refus" && openMoveMenuId === c.id && (
                          <div
                            className="kanban__card-move-menu"
                            role="menu"
                            aria-label="Déplacer vers"
                          >
                            {ALL_COLUMNS.filter(
                              (col) => col.statut !== c.statut
                            ).map(({ statut: s, label: l }) => (
                              <button
                                key={s}
                                type="button"
                                role="menuitem"
                                className="kanban__card-move-menu-item"
                                onClick={() =>
                                  moveCandidatureTo(c.id, s)
                                }
                              >
                                {l}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setColumnPage(statut, page)}
                    ariaLabel={`Pagination ${label}`}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {!effectiveLoading &&
        (filterNom.trim() ||
          filterTeletravail ||
          filterVille ||
          filterNote) &&
        filteredCandidatures.length === 0 && (
          <p className="kanban__empty" role="status">
            Aucun résultat avec ces filtres. Modifiez le nom, la ville, le
            télétravail ou la note.
          </p>
        )}

      {!effectiveLoading &&
        !filterNom.trim() &&
        !filterTeletravail &&
        !filterVille &&
        !filterNote &&
        candidaturesEnCours.length === 0 &&
        effectiveCandidatures.length > 0 && (
          <p className="kanban__empty">
            Aucune candidature en cours. Terminées et refus apparaissent sur la
            page Candidatures.
          </p>
        )}

      {!effectiveLoading && effectiveCandidatures.length === 0 && (
        <p className="kanban__empty">
          Aucune candidature. Ajoutez-en depuis la page Candidatures.
        </p>
      )}
    </main>
  );
}

export default Kanban;

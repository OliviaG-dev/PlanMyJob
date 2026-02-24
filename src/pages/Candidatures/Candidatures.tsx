import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchCandidatures,
  insertCandidature,
  updateCandidature,
} from "../../lib/candidatures";
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
import AddCandidatureModal, {
  type AddCandidatureFormData,
} from "./AddCandidatureModal";
import "./Candidatures.css";

const CANDIDATURES_PAGE_SIZE = 3;

const STATUT_KANBAN_LABELS: Record<Statut, string> = {
  a_postuler: "À postuler",
  cv_envoye: "CV envoyé",
  entretien_rh: "Entretien RH",
  entretien_technique: "Entretien technique",
  attente_reponse: "Attente de réponse",
  refus: "Refus",
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

type ListType = "en_cours" | "terminee" | "refus";

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
  const navigate = useNavigate();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [initialDataForAdd, setInitialDataForAdd] = useState<AddCandidatureFormData | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOverList, setDragOverList] = useState<ListType | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [filterNom, setFilterNom] = useState("");
  const [filterTeletravail, setFilterTeletravail] = useState<
    "" | Teletravail
  >("");
  const [filterVille, setFilterVille] = useState("");
  const [filterNote, setFilterNote] = useState("");
  const [listPages, setListPages] = useState<Record<ListType, number>>({
    en_cours: 0,
    terminee: 0,
    refus: 0,
  });
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

  useEffect(() => {
    if (!user?.id) {
      setCandidatures([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchCandidatures(user.id)
      .then(setCandidatures)
      .catch((err) => setError(err.message ?? "Erreur au chargement"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    const data = (location.state as { addWithInitialData?: AddCandidatureFormData } | null)?.addWithInitialData;
    if (data) {
      setInitialDataForAdd(data);
      setModalOpen(true);
      navigate("/candidatures", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  async function handleAddCandidature(data: AddCandidatureFormData) {
    if (!user?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await insertCandidature(user.id, data);
      setCandidatures((prev) => [created, ...prev]);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur à l'ajout");
    } finally {
      setSubmitting(false);
    }
  }

  const filterState = {
    nom: filterNom,
    teletravail: filterTeletravail,
    ville: filterVille,
    note: filterNote,
  };
  const filteredCandidatures = filterCandidaturesByFilters(
    candidatures,
    filterState
  );
  const villesUniques = [
    ...new Set(
      candidatures
        .map((c) => (c.localisation ?? "").trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b, "fr"));

  const refus = filteredCandidatures.filter((c) => c.statut === "refus");
  const enCours = filteredCandidatures.filter(
    (c) =>
      c.statut !== "refus" &&
      (c.statutSuivi === "en_cours" || c.statutSuivi !== "terminee")
  );
  const terminee = filteredCandidatures.filter(
    (c) => c.statutSuivi === "terminee" && c.statut !== "refus"
  );

  const getPayloadForList = useCallback(
    (listType: ListType): { statut?: Statut; statutSuivi?: StatutSuivi } => {
      if (listType === "refus")
        return { statut: "refus", statutSuivi: "terminee" };
      if (listType === "terminee") return { statutSuivi: "terminee" };
      return { statutSuivi: "en_cours" };
    },
    []
  );

  function handleDragStart(e: React.DragEvent, c: Candidature) {
    setDraggingId(c.id);
    e.dataTransfer.setData("application/json", JSON.stringify({ id: c.id }));
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", c.id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverList(null);
  }

  function handleDragOver(e: React.DragEvent, listType: ListType) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverList(listType);
  }

  function handleDragLeave() {
    setDragOverList(null);
  }

  async function moveCandidatureToList(
    candidatureId: string,
    targetListType: ListType
  ) {
    if (!user?.id) return;
    const candidature = candidatures.find((c) => c.id === candidatureId);
    if (!candidature) return;
    setOpenMoveMenuId(null);

    let payload: { statut?: Statut; statutSuivi?: StatutSuivi };
    if (targetListType === "en_cours" && candidature.statut === "refus") {
      payload = { statutSuivi: "en_cours", statut: "a_postuler" };
    } else {
      payload = getPayloadForList(targetListType);
    }
    const alreadyInList =
      targetListType === "refus"
        ? candidature.statut === "refus"
        : targetListType === "terminee"
        ? candidature.statutSuivi === "terminee" &&
          candidature.statut !== "refus"
        : candidature.statut !== "refus" &&
          (candidature.statutSuivi === "en_cours" ||
            candidature.statutSuivi !== "terminee");
    if (alreadyInList) return;

    const previous = [...candidatures];
    setCandidatures((prev) =>
      prev.map((c) => {
        if (c.id !== candidatureId) return c;
        return {
          ...c,
          ...(payload.statut !== undefined && { statut: payload.statut }),
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

  async function handleDrop(e: React.DragEvent, listType: ListType) {
    e.preventDefault();
    setDragOverList(null);
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
    await moveCandidatureToList(id, listType);
  }

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

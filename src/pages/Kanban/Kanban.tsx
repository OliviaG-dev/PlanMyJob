import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { fetchCandidatures, updateCandidature } from "../../lib/candidatures";
import type { Candidature, Statut, StatutSuivi } from "../../types/candidature";
import "./Kanban.css";

const COLUMNS_MAIN: { statut: Statut; label: string }[] = [
  { statut: "a_postuler", label: "À postuler" },
  { statut: "cv_envoye", label: "CV envoyé" },
  { statut: "entretien_rh", label: "Entretien RH" },
  { statut: "entretien_technique", label: "Entretien technique" },
  { statut: "attente_reponse", label: "Attente de réponse" },
];

const COLUMNS_BOTTOM: { statut: Statut; label: string }[] = [
  { statut: "refus", label: "Refus" },
  { statut: "offre", label: "Offre 🎉" },
];

const MAX_STARS = 5;

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

  const candidaturesEnCours = candidatures.filter(
    (c) =>
      c.statut !== "refus" &&
      (c.statutSuivi === "en_cours" || c.statutSuivi !== "terminee")
  );
  const candidaturesRefus = candidatures.filter((c) => c.statut === "refus");
  const candidaturesOffre = candidatures.filter((c) => c.statut === "offre");

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
    if (!id || !user?.id) return;
    const candidature = candidatures.find((c) => c.id === id);
    if (!candidature || candidature.statut === newStatut) return;

    const payload: { statut: Statut; statutSuivi?: StatutSuivi } = {
      statut: newStatut,
    };
    if (newStatut === "refus") {
      payload.statutSuivi = "terminee";
    }

    const previous = [...candidatures];
    setCandidatures((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
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
      await updateCandidature(user.id, id, payload);
    } catch (err) {
      setCandidatures(previous);
      setError(
        err instanceof Error ? err.message : "Erreur lors du déplacement"
      );
    }
  }

  return (
    <main className="kanban">
      <h1>Kanban</h1>
      <p className="kanban__intro">
        Glissez-déposez vos candidatures en cours entre les colonnes selon leur
        statut.
      </p>

      {error && (
        <p className="kanban__error" role="alert">
          {error}
        </p>
      )}

      {loading && <div className="kanban__loading">Chargement…</div>}

      {!loading && !error && (
        <>
          <div className="kanban__board kanban__board--main">
            {COLUMNS_MAIN.map(({ statut, label }) => {
              const columnCandidatures = getCandidaturesByStatut(statut);
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
                    {label}
                    <span className="kanban__column-count">
                      {columnCandidatures.length}
                    </span>
                  </h3>
                  <div className="kanban__cards">
                    {columnCandidatures.map((c) => (
                      <div
                        key={c.id}
                        className={`kanban__card ${
                          draggingId === c.id ? "kanban__card--dragging" : ""
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, c)}
                        onDragEnd={handleDragEnd}
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
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="kanban__board kanban__board--bottom">
            {COLUMNS_BOTTOM.map(({ statut, label }) => {
              const columnCandidatures = getBottomCandidatures(statut);
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
                    {label}
                    <span className="kanban__column-count">
                      {columnCandidatures.length}
                    </span>
                  </h3>
                  <div className="kanban__cards">
                    {columnCandidatures.map((c) => (
                      <div
                        key={c.id}
                        className={`kanban__card ${
                          draggingId === c.id ? "kanban__card--dragging" : ""
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, c)}
                        onDragEnd={handleDragEnd}
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
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading &&
        candidaturesEnCours.length === 0 &&
        candidatures.length > 0 && (
          <p className="kanban__empty">
            Aucune candidature en cours. Terminées et refus apparaissent sur la
            page Candidatures.
          </p>
        )}

      {!loading && candidatures.length === 0 && (
        <p className="kanban__empty">
          Aucune candidature. Ajoutez-en depuis la page Candidatures.
        </p>
      )}
    </main>
  );
}

export default Kanban;

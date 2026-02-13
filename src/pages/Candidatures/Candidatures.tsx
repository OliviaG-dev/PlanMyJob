import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchCandidatures,
  insertCandidature,
  updateCandidature,
} from "../../lib/candidatures";
import type { Candidature, Statut, StatutSuivi } from "../../types/candidature";
import AddCandidatureModal, {
  type AddCandidatureFormData,
} from "./AddCandidatureModal";
import "./Candidatures.css";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOverList, setDragOverList] = useState<ListType | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

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

  const refus = candidatures.filter((c) => c.statut === "refus");
  const enCours = candidatures.filter(
    (c) =>
      c.statut !== "refus" &&
      (c.statutSuivi === "en_cours" || c.statutSuivi !== "terminee")
  );
  const terminee = candidatures.filter(
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
    if (!id || !user?.id) return;
    const candidature = candidatures.find((c) => c.id === id);
    if (!candidature) return;

    let payload: { statut?: Statut; statutSuivi?: StatutSuivi };
    if (listType === "en_cours" && candidature.statut === "refus") {
      payload = { statutSuivi: "en_cours", statut: "a_postuler" };
    } else {
      payload = getPayloadForList(listType);
    }
    const alreadyInList =
      listType === "refus"
        ? candidature.statut === "refus"
        : listType === "terminee"
        ? candidature.statutSuivi === "terminee" &&
          candidature.statut !== "refus"
        : candidature.statut !== "refus" &&
          (candidature.statutSuivi === "en_cours" ||
            candidature.statutSuivi !== "terminee");
    if (alreadyInList) return;

    const previous = [...candidatures];
    setCandidatures((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
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
      await updateCandidature(user.id, id, payload);
    } catch (err) {
      setCandidatures(previous);
      setError(
        err instanceof Error ? err.message : "Erreur lors du déplacement"
      );
    }
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
            draggable
            onDragStart={(e) => handleDragStart(e, c)}
            onDragEnd={handleDragEnd}
          >
            <Link
              to={`/candidatures/${c.id}`}
              className={`candidatures__link ${
                listType === "terminee" ? "candidatures__link--terminee" : ""
              } ${listType === "refus" ? "candidatures__link--refus" : ""}`}
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
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className="candidatures">
      <div className="candidatures__head">
        <div>
          <h1>Candidatures</h1>
          <p className="candidatures__intro">
            Liste de toutes vos candidatures.
          </p>
        </div>
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
              ) : (
                renderList(enCours, "en_cours")
              )}
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
              ) : (
                renderList(terminee, "terminee")
              )}
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
              ) : (
                renderList(refus, "refus")
              )}
            </div>
          </section>
        </>
      )}

      <AddCandidatureModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddCandidature}
        isSubmitting={submitting}
      />
    </main>
  );
}

export default Candidatures;

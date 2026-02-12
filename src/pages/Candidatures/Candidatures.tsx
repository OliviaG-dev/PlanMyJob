import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { fetchCandidatures, insertCandidature } from "../../lib/candidatures";
import type { Candidature } from "../../types/candidature";
import AddCandidatureModal, {
  type AddCandidatureFormData,
} from "./AddCandidatureModal";
import "./Candidatures.css";

function Candidatures() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
          + Ajouter une candidature
        </button>
      </div>
      <section className="candidatures__list">
        {error && (
          <p className="candidatures__error" role="alert">
            {error}
          </p>
        )}
        {loading && <p className="candidatures__empty">Chargement…</p>}
        {!loading && !error && candidatures.length === 0 && (
          <p className="candidatures__empty">
            Aucune candidature pour l'instant.
          </p>
        )}
        {!loading && candidatures.length > 0 && (
          <ul className="candidatures__items">
            {candidatures.map((c) => (
              <li key={c.id} className="candidatures__item">
                <Link
                  to={`/candidatures/${c.id}`}
                  className="candidatures__link"
                >
                  <span className="candidatures__item-entreprise">
                    {c.entreprise}
                  </span>
                  <span className="candidatures__item-poste">{c.poste}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

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

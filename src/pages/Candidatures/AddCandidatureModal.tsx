import { useState } from "react";
import type { FormEvent } from "react";
import type {
  Statut,
  StatutSuivi,
  TypeContrat,
  Teletravail,
  SourceCandidature,
} from "../../types/candidature";
import { Select } from "../../components/Select/Select";
import "./AddCandidatureModal.css";

const STATUT_LABELS: Record<Statut, string> = {
  a_postuler: "À postuler",
  cv_envoye: "CV envoyé",
  entretien_rh: "Entretien RH",
  entretien_technique: "Entretien technique",
  attente_reponse: "Attente de réponse",
  refus: "Refus",
  offre: "Offre",
};

const TYPE_CONTRAT_OPTIONS = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "alternance", label: "Alternance" },
  { value: "stage", label: "Stage" },
  { value: "freelance", label: "Freelance" },
  { value: "autre", label: "Autre" },
] satisfies { value: TypeContrat; label: string }[];

const TELETRAVAIL_OPTIONS = [
  { value: "inconnu", label: "Je ne sais pas" },
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
  { value: "hybride", label: "Hybride" },
] satisfies { value: Teletravail; label: string }[];

const SOURCE_OPTIONS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "welcome_to_the_jungle", label: "Welcome to the Jungle" },
  { value: "hellowork", label: "HelloWork" },
  { value: "site_entreprise", label: "Site entreprise" },
  { value: "autre", label: "Autre" },
] satisfies { value: SourceCandidature; label: string }[];

const STATUT_SUIVI_OPTIONS = [
  { value: "en_cours", label: "En cours" },
  { value: "terminee", label: "Terminée" },
] satisfies { value: StatutSuivi; label: string }[];

export type AddCandidatureFormData = {
  entreprise: string;
  poste: string;
  lienOffre: string;
  localisation: string;
  typeContrat: TypeContrat;
  teletravail: Teletravail;
  dateCandidature: string;
  source: SourceCandidature;
  notePersonnelle: number;
  statutSuivi: StatutSuivi;
  statut: Statut;
  salaireOuFourchette: string;
  notes: string;
};

const defaultFormData: AddCandidatureFormData = {
  entreprise: "",
  poste: "",
  lienOffre: "",
  localisation: "",
  typeContrat: "cdi",
  teletravail: "inconnu",
  dateCandidature: new Date().toISOString().slice(0, 10),
  source: "linkedin",
  notePersonnelle: 3,
  statutSuivi: "en_cours",
  statut: "a_postuler",
  salaireOuFourchette: "",
  notes: "",
};

type AddCandidatureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddCandidatureFormData) => void;
  isSubmitting?: boolean;
  /** En mode édition : données initiales et libellé du bouton */
  mode?: "add" | "edit";
  initialData?: AddCandidatureFormData | null;
};

/** Convertit une candidature (ou objet partiel) en données du formulaire pour le modal d’édition. */
function candidatureToFormData(
  c: Partial<AddCandidatureFormData> & { dateCandidature?: string }
): AddCandidatureFormData {
  return {
    entreprise: c.entreprise ?? "",
    poste: c.poste ?? "",
    lienOffre: c.lienOffre ?? "",
    localisation: c.localisation ?? "",
    typeContrat: (c.typeContrat as TypeContrat) ?? "cdi",
    teletravail: (c.teletravail as Teletravail) ?? "inconnu",
    dateCandidature:
      c.dateCandidature?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    source: (c.source as SourceCandidature) ?? "linkedin",
    notePersonnelle: c.notePersonnelle != null ? c.notePersonnelle : 3,
    statutSuivi: (c.statutSuivi as StatutSuivi) ?? "en_cours",
    statut: (c.statut as Statut) ?? "a_postuler",
    salaireOuFourchette: c.salaireOuFourchette ?? "",
    notes: c.notes ?? "",
  };
}

function AddCandidatureModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  mode = "add",
  initialData = null,
}: AddCandidatureModalProps) {
  const [formData, setFormData] = useState<AddCandidatureFormData>(() =>
    mode === "edit" && initialData
      ? candidatureToFormData(initialData)
      : defaultFormData
  );

  function update<K extends keyof AddCandidatureFormData>(
    key: K,
    value: AddCandidatureFormData[K]
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(formData);
    if (mode === "add") setFormData(defaultFormData);
    onClose();
  }

  function handleClose() {
    setFormData(defaultFormData);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="add-candidature-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="add-candidature-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="add-candidature-modal__header">
          <h2 id="modal-title" className="add-candidature-modal__title">
            {mode === "edit"
              ? "Modifier la candidature"
              : "Nouvelle candidature"}
          </h2>
          <button
            type="button"
            className="add-candidature-modal__close"
            onClick={handleClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form className="add-candidature-form" onSubmit={handleSubmit}>
          <section className="add-candidature-form__section">
            <div className="add-candidature-form__grid">
              <label className="add-candidature-form__label">
                <span className="add-candidature-form__label-line">
                  Entreprise <span className="required">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={formData.entreprise}
                  onChange={(e) => update("entreprise", e.target.value)}
                  placeholder="Nom de l'entreprise"
                  className="add-candidature-form__input"
                />
              </label>
              <label className="add-candidature-form__label">
                <span className="add-candidature-form__label-line">
                  Poste <span className="required">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={formData.poste}
                  onChange={(e) => update("poste", e.target.value)}
                  placeholder="Intitulé du poste"
                  className="add-candidature-form__input"
                />
              </label>
              <label className="add-candidature-form__label add-candidature-form__label--full">
                Lien de l'offre
                <input
                  type="url"
                  value={formData.lienOffre}
                  onChange={(e) => update("lienOffre", e.target.value)}
                  placeholder="https://..."
                  className="add-candidature-form__input"
                />
              </label>
              <label className="add-candidature-form__label">
                Localisation
                <input
                  type="text"
                  value={formData.localisation}
                  onChange={(e) => update("localisation", e.target.value)}
                  placeholder="Ville ou télétravail"
                  className="add-candidature-form__input"
                />
              </label>
              <div className="add-candidature-form__label">
                <Select
                  id="add-typeContrat"
                  label="Type de contrat"
                  value={formData.typeContrat}
                  options={TYPE_CONTRAT_OPTIONS}
                  onChange={(v) => update("typeContrat", v as TypeContrat)}
                  wrapClassName="add-candidature-form__select-field"
                />
              </div>
              <div className="add-candidature-form__label">
                <Select
                  id="add-teletravail"
                  label="Télétravail"
                  value={formData.teletravail}
                  options={TELETRAVAIL_OPTIONS}
                  onChange={(v) => update("teletravail", v as Teletravail)}
                  wrapClassName="add-candidature-form__select-field"
                />
              </div>
              <label className="add-candidature-form__label">
                Date de candidature
                <input
                  type="date"
                  value={formData.dateCandidature}
                  onChange={(e) => update("dateCandidature", e.target.value)}
                  className="add-candidature-form__input"
                />
              </label>
              <div className="add-candidature-form__label">
                <Select
                  id="add-source"
                  label="Source"
                  value={formData.source}
                  options={SOURCE_OPTIONS}
                  onChange={(v) => update("source", v as SourceCandidature)}
                  wrapClassName="add-candidature-form__select-field"
                />
              </div>
            </div>
          </section>

          <section className="add-candidature-form__section">
            <label className="add-candidature-form__label">
              Note personnelle (1–5)
              <div className="add-candidature-form__stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`add-candidature-form__star ${
                      formData.notePersonnelle >= n
                        ? "add-candidature-form__star--on"
                        : ""
                    }`}
                    onClick={() => update("notePersonnelle", n)}
                    aria-label={`Note ${n}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </label>
          </section>

          <section className="add-candidature-form__section">
            <label className="add-candidature-form__label add-candidature-form__label--full">
              Salaire / fourchette (optionnel)
              <input
                type="text"
                value={formData.salaireOuFourchette}
                onChange={(e) => update("salaireOuFourchette", e.target.value)}
                placeholder="Ex. 45–50 k€, à préciser…"
                className="add-candidature-form__input"
              />
            </label>
          </section>

          <section className="add-candidature-form__section">
            <div className="add-candidature-form__label">
              <Select
                id="add-statutSuivi"
                label="Statut"
                value={formData.statutSuivi}
                options={STATUT_SUIVI_OPTIONS}
                onChange={(v) => update("statutSuivi", v as StatutSuivi)}
                wrapClassName="add-candidature-form__select-field"
              />
            </div>
            <div className="add-candidature-form__label add-candidature-form__label--top-spaced">
              <Select
                id="add-statut"
                label="Kanban"
                value={formData.statut}
                options={(Object.entries(STATUT_LABELS) as [Statut, string][]).map(
                  ([value, label]) => ({ value, label })
                )}
                onChange={(v) => update("statut", v as Statut)}
                wrapClassName="add-candidature-form__select-field"
              />
            </div>
            <label className="add-candidature-form__label add-candidature-form__label--full add-candidature-form__label--top-spaced">
              Notes libres
              <textarea
                value={formData.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Points clés, remarques…"
                className="add-candidature-form__textarea"
                rows={3}
              />
            </label>
          </section>

          <div className="add-candidature-form__actions">
            <button
              type="button"
              className="add-candidature-form__btn add-candidature-form__btn--secondary"
              onClick={handleClose}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="add-candidature-form__btn add-candidature-form__btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? mode === "edit"
                  ? "Enregistrement…"
                  : "Ajout…"
                : mode === "edit"
                ? "Enregistrer"
                : "Ajouter la candidature"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCandidatureModal;

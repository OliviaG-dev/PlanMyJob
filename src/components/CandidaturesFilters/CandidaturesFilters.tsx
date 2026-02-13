import type { Candidature, Teletravail } from "../../types/candidature";
import "./CandidaturesFilters.css";

const TELETRAVAIL_OPTIONS: { value: "" | Teletravail; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
  { value: "hybride", label: "Hybride" },
  { value: "inconnu", label: "Inconnu" },
];

const NOTE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Toutes" },
  ...Array.from({ length: 5 }, (_, i) => ({
    value: String(i + 1),
    label: "★".repeat(i + 1),
  })),
];

export type CandidaturesFiltersState = {
  nom: string;
  teletravail: "" | Teletravail;
  ville: string;
  note: string;
};

export function filterCandidaturesByFilters(
  list: Candidature[],
  filters: CandidaturesFiltersState
): Candidature[] {
  return list.filter((c) => {
    const q = filters.nom.trim().toLowerCase();
    if (q) {
      const matchNom =
        c.entreprise?.toLowerCase().includes(q) ||
        c.poste?.toLowerCase().includes(q);
      if (!matchNom) return false;
    }
    if (filters.teletravail && c.teletravail !== filters.teletravail)
      return false;
    if (filters.ville && (c.localisation ?? "").trim() !== filters.ville.trim())
      return false;
    if (filters.note) {
      const n = parseInt(filters.note, 10);
      if (c.notePersonnelle == null || c.notePersonnelle !== n) return false;
    }
    return true;
  });
}

type CandidaturesFiltersProps = {
  idPrefix: string;
  nom: string;
  onNomChange: (value: string) => void;
  teletravail: "" | Teletravail;
  onTeletravailChange: (value: "" | Teletravail) => void;
  ville: string;
  onVilleChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
  villes: string[];
};

function CandidaturesFilters({
  idPrefix,
  nom,
  onNomChange,
  teletravail,
  onTeletravailChange,
  ville,
  onVilleChange,
  note,
  onNoteChange,
  villes,
}: CandidaturesFiltersProps) {
  return (
    <div className="candidatures-filters">
      <div className="candidatures-filters__group candidatures-filters__group--nom">
        <label
          htmlFor={`${idPrefix}-filter-nom`}
          className="candidatures-filters__label"
        >
          Nom
        </label>
        <span className="candidatures-filters__input-wrap">
          <img
            src="/icons/search.png"
            alt=""
            className="candidatures-filters__search-icon"
            aria-hidden
          />
          <input
            id={`${idPrefix}-filter-nom`}
            type="search"
            className="candidatures-filters__input"
            placeholder="Entreprise ou poste"
            value={nom}
            onChange={(e) => onNomChange(e.target.value)}
          />
        </span>
      </div>
      <div className="candidatures-filters__group">
        <label
          htmlFor={`${idPrefix}-filter-teletravail`}
          className="candidatures-filters__label"
        >
          Télétravail
        </label>
        <select
          id={`${idPrefix}-filter-teletravail`}
          className="candidatures-filters__select"
          value={teletravail}
          onChange={(e) =>
            onTeletravailChange((e.target.value || "") as "" | Teletravail)
          }
        >
          {TELETRAVAIL_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="candidatures-filters__group">
        <label
          htmlFor={`${idPrefix}-filter-ville`}
          className="candidatures-filters__label"
        >
          Ville
        </label>
        <select
          id={`${idPrefix}-filter-ville`}
          className="candidatures-filters__select"
          value={ville}
          onChange={(e) => onVilleChange(e.target.value)}
        >
          <option value="">Toutes</option>
          {villes.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="candidatures-filters__group">
        <label
          htmlFor={`${idPrefix}-filter-note`}
          className="candidatures-filters__label"
        >
          Note
        </label>
        <select
          id={`${idPrefix}-filter-note`}
          className="candidatures-filters__select candidatures-filters__select--note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
        >
          {NOTE_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default CandidaturesFilters;

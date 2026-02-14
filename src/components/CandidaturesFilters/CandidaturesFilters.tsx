import { useState } from "react";
import type { Candidature, Teletravail } from "../../types/candidature";
import { Select, type SelectOption } from "../Select/Select";
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const villeOptions: SelectOption[] = [
    { value: "", label: "Toutes" },
    ...villes.map((v) => ({ value: v, label: v })),
  ];

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
        <Select
          id={`${idPrefix}-filter-teletravail`}
          label="Télétravail"
          value={teletravail}
          options={TELETRAVAIL_OPTIONS}
          onChange={(v) => onTeletravailChange(v as "" | Teletravail)}
          openId={openDropdown}
          onOpenChange={setOpenDropdown}
        />
      </div>
      <div className="candidatures-filters__group">
        <Select
          id={`${idPrefix}-filter-ville`}
          label="Ville"
          value={ville}
          options={villeOptions}
          onChange={onVilleChange}
          openId={openDropdown}
          onOpenChange={setOpenDropdown}
        />
      </div>
      <div className="candidatures-filters__group">
        <Select
          id={`${idPrefix}-filter-note`}
          label="Note"
          value={note}
          options={NOTE_OPTIONS}
          onChange={onNoteChange}
          optionClassName="candidatures-filters__select-option--note"
          wrapClassName="candidatures-filters__select-wrap--note"
          openId={openDropdown}
          onOpenChange={setOpenDropdown}
        />
      </div>
    </div>
  );
}

export default CandidaturesFilters;

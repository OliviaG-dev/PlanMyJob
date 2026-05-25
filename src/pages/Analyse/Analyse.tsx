import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  extractOfferFromText,
  extractedToFormData,
  type ExtractedOffer,
} from "../../lib/offerAnalyzer";
import type { TypeContrat, Teletravail } from "../../types/candidature";
import "./Analyse.css";

const TYPE_CONTRAT_LABELS: Record<TypeContrat, string> = {
  cdi: "CDI",
  cdd: "CDD",
  alternance: "Alternance",
  stage: "Stage",
  freelance: "Freelance",
  autre: "Autre",
};

const TELETRAVAIL_LABELS: Record<Teletravail, string> = {
  oui: "Oui",
  non: "Non",
  hybride: "Hybride",
  inconnu: "Non précisé",
};

function Analyse() {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState("");
  const [extracted, setExtracted] = useState<ExtractedOffer | null>(null);

  const handleExtract = () => {
    const result = extractOfferFromText(rawText);
    setExtracted(result);
  };

  const updateField = <K extends keyof ExtractedOffer>(
    key: K,
    value: ExtractedOffer[K]
  ) => {
    setExtracted((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleCreateCandidature = () => {
    if (!extracted) return;
    const formData = extractedToFormData(extracted);
    navigate("/candidatures", { state: { addWithInitialData: formData } });
  };

  return (
    <main className="analyse">
      <div className="analyse__header">
        <div>
          <h1>Analyser une offre</h1>
          <p className="analyse__intro">
            Collez le texte d&apos;une annonce pour en extraire les informations
            clés et créer une candidature pré-remplie.
          </p>
        </div>
        <img
          src="/icons/ressources.png"
          alt=""
          className="analyse__icon"
          aria-hidden
        />
      </div>

      <section className="analyse__card">
        <div className="analyse__input-zone">
          <p className="analyse__desc">
            Collez le texte d&apos;une annonce (LinkedIn, Indeed, site
            entreprise…) puis cliquez sur « Extraire les informations ».
          </p>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="analyse__textarea"
            placeholder="Collez ici le texte complet de l'offre d'emploi…"
            rows={6}
          />
          <div className="analyse__actions">
            <button
              type="button"
              className="analyse__btn-primary"
              onClick={handleExtract}
              disabled={!rawText.trim()}
            >
              Extraire les informations
            </button>
          </div>
        </div>

        {extracted && (
          <div className="analyse__result">
            <h2 className="analyse__result-title">Informations extraites</h2>
            <p className="analyse__result-desc">
              Vous pouvez modifier les champs avant de créer la candidature.
            </p>
            <div className="analyse__result-grid">
              <label className="analyse__label">
                Poste
                <input
                  type="text"
                  value={extracted.poste}
                  onChange={(e) => updateField("poste", e.target.value)}
                  className="analyse__input"
                  placeholder="Intitulé du poste"
                />
              </label>
              <label className="analyse__label">
                Entreprise
                <input
                  type="text"
                  value={extracted.entreprise}
                  onChange={(e) => updateField("entreprise", e.target.value)}
                  className="analyse__input"
                  placeholder="Nom de l'entreprise"
                />
              </label>
              <label className="analyse__label">
                Type de contrat
                <select
                  value={extracted.typeContrat}
                  onChange={(e) =>
                    updateField("typeContrat", e.target.value as TypeContrat)
                  }
                  className="analyse__select"
                >
                  {(
                    Object.entries(TYPE_CONTRAT_LABELS) as [
                      TypeContrat,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="analyse__label">
                Télétravail
                <select
                  value={extracted.teletravail}
                  onChange={(e) =>
                    updateField("teletravail", e.target.value as Teletravail)
                  }
                  className="analyse__select"
                >
                  {(
                    Object.entries(TELETRAVAIL_LABELS) as [
                      Teletravail,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="analyse__label analyse__label--full">
                Localisation
                <input
                  type="text"
                  value={extracted.localisation}
                  onChange={(e) => updateField("localisation", e.target.value)}
                  className="analyse__input"
                  placeholder="Ville, région…"
                />
              </label>
              <label className="analyse__label">
                Expérience demandée
                <input
                  type="text"
                  value={extracted.experienceYears}
                  onChange={(e) =>
                    updateField("experienceYears", e.target.value)
                  }
                  className="analyse__input"
                  placeholder="Ex. 3 à 5 ans"
                />
              </label>
              <label className="analyse__label">
                Salaire / fourchette
                <input
                  type="text"
                  value={extracted.salaireOuFourchette}
                  onChange={(e) =>
                    updateField("salaireOuFourchette", e.target.value)
                  }
                  className="analyse__input"
                  placeholder="Si indiqué dans l'offre"
                />
              </label>
              <label className="analyse__label analyse__label--full">
                Lien de candidature
                <input
                  type="url"
                  value={extracted.lienCandidature}
                  onChange={(e) =>
                    updateField("lienCandidature", e.target.value)
                  }
                  className="analyse__input"
                  placeholder="https://…"
                />
              </label>
            </div>
            {extracted.competences.length > 0 && (
              <div className="analyse__section-extra">
                <span className="analyse__label">
                  Compétences / mots-clés détectés
                </span>
                <p className="analyse__tags">
                  {extracted.competences.map((c) => (
                    <span key={c} className="analyse__tag">
                      {c}
                    </span>
                  ))}
                </p>
              </div>
            )}
            {extracted.pointsCles.length > 0 && (
              <div className="analyse__section-extra">
                <span className="analyse__label">
                  Points clés de l&apos;offre
                </span>
                <ul className="analyse__points">
                  {extracted.pointsCles.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="analyse__actions analyse__actions--result">
              <button
                type="button"
                className="analyse__btn-primary"
                onClick={handleCreateCandidature}
              >
                Créer une candidature
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Analyse;

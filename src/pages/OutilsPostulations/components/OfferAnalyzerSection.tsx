import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  extractOfferFromText,
  extractedToFormData,
  type ExtractedOffer,
} from "../../../lib/offerAnalyzer";
import type { TypeContrat, Teletravail } from "../../../types/candidature";

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

export function OfferAnalyzerSection() {
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
    <section className="outils-postulations__block">
      <h2 className="outils-postulations__block-title">
        Analyser une offre d&apos;emploi
      </h2>

      <div className="outils-postulations__offer-analyzer">
        <p className="outils-postulations__offer-analyzer-desc">
          Collez le texte d&apos;une annonce (LinkedIn, Indeed, site entreprise…) puis cliquez sur « Extraire les informations ».
        </p>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="outils-postulations__letter-textarea outils-postulations__letter-textarea--large"
          placeholder="Collez ici le texte complet de l'offre d'emploi…"
          rows={6}
        />
        <div className="outils-postulations__add-actions">
          <button
            type="button"
            className="outils-postulations__add-btn"
            onClick={handleExtract}
            disabled={!rawText.trim()}
          >
            Extraire les informations
          </button>
        </div>

        {extracted && (
          <div className="outils-postulations__offer-result">
            <h4 className="outils-postulations__offer-result-title">Informations extraites</h4>
            <p className="outils-postulations__offer-result-desc">Vous pouvez modifier les champs avant de créer la candidature.</p>
            <div className="outils-postulations__offer-result-grid">
              <label className="outils-postulations__letter-label">
                Poste
                <input
                  type="text"
                  value={extracted.poste}
                  onChange={(e) => updateField("poste", e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder="Intitulé du poste"
                />
              </label>
              <label className="outils-postulations__letter-label">
                Entreprise
                <input
                  type="text"
                  value={extracted.entreprise}
                  onChange={(e) => updateField("entreprise", e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder="Nom de l'entreprise"
                />
              </label>
              <label className="outils-postulations__letter-label">
                Type de contrat
                <select
                  value={extracted.typeContrat}
                  onChange={(e) => updateField("typeContrat", e.target.value as TypeContrat)}
                  className="outils-postulations__add-select"
                >
                  {(Object.entries(TYPE_CONTRAT_LABELS) as [TypeContrat, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="outils-postulations__letter-label">
                Télétravail
                <select
                  value={extracted.teletravail}
                  onChange={(e) => updateField("teletravail", e.target.value as Teletravail)}
                  className="outils-postulations__add-select"
                >
                  {(Object.entries(TELETRAVAIL_LABELS) as [Teletravail, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="outils-postulations__letter-label outils-postulations__offer-result-full">
                Localisation
                <input
                  type="text"
                  value={extracted.localisation}
                  onChange={(e) => updateField("localisation", e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder="Ville, région…"
                />
              </label>
              <label className="outils-postulations__letter-label">
                Expérience demandée
                <input
                  type="text"
                  value={extracted.experienceYears}
                  onChange={(e) => updateField("experienceYears", e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder="Ex. 3 à 5 ans"
                />
              </label>
              <label className="outils-postulations__letter-label">
                Salaire / fourchette
                <input
                  type="text"
                  value={extracted.salaireOuFourchette}
                  onChange={(e) => updateField("salaireOuFourchette", e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder="Si indiqué dans l'offre"
                />
              </label>
              <label className="outils-postulations__letter-label outils-postulations__offer-result-full">
                Lien de candidature
                <input
                  type="url"
                  value={extracted.lienCandidature}
                  onChange={(e) => updateField("lienCandidature", e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder="https://…"
                />
              </label>
            </div>
            {extracted.competences.length > 0 && (
              <label className="outils-postulations__letter-label outils-postulations__offer-result-full">
                Compétences / mots-clés détectés
                <p className="outils-postulations__offer-tags">
                  {extracted.competences.map((c) => (
                    <span key={c} className="outils-postulations__offer-tag">{c}</span>
                  ))}
                </p>
              </label>
            )}
            {extracted.pointsCles.length > 0 && (
              <label className="outils-postulations__letter-label outils-postulations__offer-result-full">
                Points clés de l&apos;offre
                <ul className="outils-postulations__offer-points">
                  {extracted.pointsCles.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </label>
            )}
            <div className="outils-postulations__add-actions outils-postulations__offer-result-actions">
              <button
                type="button"
                className="outils-postulations__add-btn"
                onClick={handleCreateCandidature}
              >
                Créer une candidature
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Select } from "../../../components/Select/Select";
import {
  fetchProjets,
  insertProjet,
  updateProjet,
  deleteProjet,
} from "../../../lib/projets";
import type { Projet } from "../../../types/projet";
import type { WhyCompanyTemplate } from "../../../data/interface";
import {
  computeMatchingScore,
  detectToneFromOffer,
  generateLetter,
  TONE_LABELS,
  type LetterTone,
  type GenerateLetterInput,
} from "../../../utils/motivationLetter";
import whyCompanyTemplates from "../../../data/whyCompanyTemplates.json";

const WHY_COMPANY_TEMPLATES = whyCompanyTemplates as WhyCompanyTemplate[];

export function MotivationGeneratorSection() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [skills, setSkills] = useState(["", "", ""]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [projetsLoading, setProjetsLoading] = useState(false);
  const [selectedProjetId, setSelectedProjetId] = useState<string>("");
  const [customAchievement, setCustomAchievement] = useState("");
  const [showAddProjet, setShowAddProjet] = useState(false);
  const [addProjetTitre, setAddProjetTitre] = useState("");
  const [addProjetDescription, setAddProjetDescription] = useState("");
  const [addingProjet, setAddingProjet] = useState(false);
  const [editingProjetId, setEditingProjetId] = useState<string | null>(null);
  const [editProjetTitre, setEditProjetTitre] = useState("");
  const [editProjetDescription, setEditProjetDescription] = useState("");
  const [savingProjetId, setSavingProjetId] = useState<string | null>(null);
  const [motivation, setMotivation] = useState("");
  const [offerText, setOfferText] = useState("");
  const [toneSelection, setToneSelection] = useState<LetterTone | "auto">("auto");
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [lastToneUsed, setLastToneUsed] = useState<LetterTone | null>(null);
  const [matchedSkills, setMatchedSkills] = useState<string[]>([]);
  const [matchingScore, setMatchingScore] = useState<number | null>(null);
  const [projetsError, setProjetsError] = useState<string | null>(null);

  const achievementText =
    selectedProjetId && selectedProjetId !== ""
      ? (projets.find((p) => p.id === selectedProjetId)?.description ?? "").trim()
      : customAchievement.trim();

  const whyCompanySelectValue = useMemo(() => {
    const idx = WHY_COMPANY_TEMPLATES.findIndex((t) => t.text === motivation);
    return idx >= 0 ? String(idx) : "";
  }, [motivation]);

  const hasRequiredFields =
    position.trim() &&
    company.trim() &&
    skills.some((s) => s.trim()) &&
    achievementText.length > 0 &&
    motivation.trim();

  useEffect(() => {
    if (!user?.id) {
      queueMicrotask(() => {
        setProjets([]);
        setProjetsLoading(false);
        setProjetsError(null);
      });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => { setProjetsLoading(true); });
    setProjetsError(null);
    fetchProjets(user.id)
      .then((data) => { if (!cancelled) setProjets(data); })
      .catch((err) => {
        if (!cancelled) {
          setProjets([]);
          setProjetsError(
            err instanceof Error
              ? err.message
              : "Impossible de charger les projets"
          );
        }
      })
      .finally(() => { if (!cancelled) setProjetsLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const detectedTone = useMemo(() => {
    if (!offerText.trim()) return null;
    return detectToneFromOffer(offerText);
  }, [offerText]);

  const setSkillAt = (index: number, value: string) => {
    setSkills((prev) => prev.map((skill, i) => (i === index ? value : skill)));
  };

  const handleGenerate = () => {
    if (!hasRequiredFields) return;
    const cleanSkills = skills.map((s) => s.trim()).filter(Boolean);
    const selectedTone =
      toneSelection === "auto" ? detectedTone ?? "classic" : toneSelection;
    const input: GenerateLetterInput = {
      company: company.trim(),
      position: position.trim(),
      skills: cleanSkills,
      achievement: achievementText,
      motivation: motivation.trim(),
      tone: selectedTone,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      offerText: offerText.trim() || undefined,
      yearsExperience:
        yearsExperience.trim().length > 0 ? Number.parseInt(yearsExperience, 10) : undefined,
    };
    const letter = generateLetter(input);
    const scoreDetails = computeMatchingScore(input);
    setGeneratedLetter(letter);
    setMatchingScore(scoreDetails.score);
    setMatchedSkills(scoreDetails.matchedSkills);
    setLastToneUsed(selectedTone);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!generatedLetter) return;
    try {
      await navigator.clipboard.writeText(generatedLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard failures
    }
  };

  const handleAddProjet = async (e: React.FormEvent) => {
    e.preventDefault();
    const titre = addProjetTitre.trim();
    const description = addProjetDescription.trim();
    if (!titre || !description || !user?.id || addingProjet) return;
    setAddingProjet(true);
    setProjetsError(null);
    try {
      const nouveau = await insertProjet(user.id, { titre, description });
      setProjets((prev) => [nouveau, ...prev]);
      setSelectedProjetId(nouveau.id);
      setAddProjetTitre("");
      setAddProjetDescription("");
      setShowAddProjet(false);
    } catch (err) {
      setProjetsError(
        err instanceof Error ? err.message : "Impossible d'ajouter le projet"
      );
    } finally {
      setAddingProjet(false);
    }
  };

  const startEditProjet = (p: Projet) => {
    setEditingProjetId(p.id);
    setEditProjetTitre(p.titre);
    setEditProjetDescription(p.description);
  };

  const cancelEditProjet = () => {
    setEditingProjetId(null);
    setEditProjetTitre("");
    setEditProjetDescription("");
  };

  const handleUpdateProjet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjetId || !user?.id || savingProjetId !== null) return;
    setSavingProjetId(editingProjetId);
    setProjetsError(null);
    try {
      const updated = await updateProjet(user.id, editingProjetId, {
        titre: editProjetTitre.trim(),
        description: editProjetDescription.trim(),
      });
      setProjets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      cancelEditProjet();
    } catch (err) {
      setProjetsError(
        err instanceof Error
          ? err.message
          : "Impossible de mettre a jour le projet"
      );
    } finally {
      setSavingProjetId(null);
    }
  };

  const handleDeleteProjet = async (id: string) => {
    if (!user?.id || !window.confirm("Supprimer ce projet ?")) return;
    setProjetsError(null);
    try {
      await deleteProjet(user.id, id);
      setProjets((prev) => prev.filter((p) => p.id !== id));
      if (selectedProjetId === id) setSelectedProjetId("");
    } catch (err) {
      setProjetsError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le projet"
      );
    }
  };

  return (
    <section className="outils-postulations__block">
      <h2 className="outils-postulations__block-title">Mail / lettre de motivation</h2>
      <p className="outils-postulations__block-desc">
        Generez une base personnalisee en quelques questions, puis ajustez-la manuellement.
      </p>
      {projetsError && (
        <p className="outils-postulations__error" role="alert">
          {projetsError}
        </p>
      )}

      <div className="outils-postulations__letter-grid">
        <div className="outils-postulations__letter-form">
          <div className="outils-postulations__add-row">
            <label className="outils-postulations__letter-label">
              Prénom
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="outils-postulations__add-input"
                placeholder="Ex. Marie"
              />
            </label>
            <label className="outils-postulations__letter-label">
              Nom
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="outils-postulations__add-input"
                placeholder="Ex. Dupont"
              />
            </label>
          </div>
          <label className="outils-postulations__letter-label">
            Poste visé
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="outils-postulations__add-input"
              placeholder="Ex. Frontend Developer React"
            />
          </label>
          <label className="outils-postulations__letter-label">
            Entreprise
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="outils-postulations__add-input"
              placeholder="Ex. PlanMyJob"
            />
          </label>
          <label className="outils-postulations__letter-label">
            Compétences clés
            <div className="outils-postulations__letter-skills">
              {skills.map((skill, index) => (
                <input
                  key={index}
                  type="text"
                  value={skill}
                  onChange={(e) => setSkillAt(index, e.target.value)}
                  className="outils-postulations__add-input"
                  placeholder={`Compétence ${index + 1}`}
                />
              ))}
            </div>
          </label>
          <div className="outils-postulations__letter-label">
            {projetsLoading ? (
              <p className="outils-postulations__placeholder">Chargement des projets…</p>
            ) : (
              <>
                <Select
                  id="letter-projet"
                  label="Réalisation importante (projet)"
                  value={selectedProjetId}
                  options={[
                    { value: "", label: "Saisie libre" },
                    ...projets.map((p) => ({ value: p.id, label: p.titre })),
                  ]}
                  onChange={(value) => setSelectedProjetId(value)}
                  wrapClassName="outils-postulations__letter-projet-select"
                />
                {selectedProjetId === "" && (
                  <textarea
                    value={customAchievement}
                    onChange={(e) => setCustomAchievement(e.target.value)}
                    className="outils-postulations__letter-textarea"
                    placeholder="Ex. j'ai refondu le tunnel de candidature et augmenté la conversion de 22%"
                  />
                )}
              </>
            )}
          </div>
          <div className="outils-postulations__letter-label">
            <Select
              id="letter-why-company"
              label="Pourquoi cette entreprise ?"
              value={whyCompanySelectValue}
              options={WHY_COMPANY_TEMPLATES.map((t, i) => ({
                value: String(i),
                label: t.title,
              }))}
              onChange={(value) =>
                setMotivation(WHY_COMPANY_TEMPLATES[Number(value)].text)
              }
              wrapClassName="outils-postulations__letter-why-company-select"
            />
          </div>
          <label className="outils-postulations__letter-label">
            Offre d'emploi (optionnel)
            <textarea
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              className="outils-postulations__letter-textarea outils-postulations__letter-textarea--large"
              placeholder="Collez ici le texte de l'annonce pour prioriser automatiquement les mots-cles."
            />
          </label>
          <div className="outils-postulations__add-row">
            <Select
              id="letter-tone"
              label="Style souhaité"
              value={toneSelection}
              options={[
                { value: "auto", label: "Auto (selon l'offre)" },
                { value: "classic", label: "Classique" },
                { value: "modern", label: "Moderne" },
                { value: "startup", label: "Startup" },
              ]}
              onChange={(value) => setToneSelection(value as LetterTone | "auto")}
              wrapClassName="outils-postulations__letter-select-wrap"
            />
            <label className="outils-postulations__letter-label">
              Années d'expérience
              <input
                type="number"
                min={0}
                max={40}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="outils-postulations__add-input"
                placeholder="Ex. 3"
              />
            </label>
          </div>
          <div className="outils-postulations__add-actions">
            <button
              type="button"
              className="outils-postulations__add-btn"
              onClick={handleGenerate}
              disabled={!hasRequiredFields}
            >
              Générer la lettre
            </button>
          </div>
        </div>

        <div className="outils-postulations__letter-result">
          {generatedLetter ? (
            <>
              <div className="outils-postulations__letter-meta">
                {matchingScore !== null && (
                  <span className="outils-postulations__letter-badge">
                    Score de matching: {matchingScore}%
                  </span>
                )}
                {lastToneUsed && (
                  <span className="outils-postulations__letter-badge">
                    Style: {TONE_LABELS[lastToneUsed]}
                  </span>
                )}
                {toneSelection === "auto" && detectedTone && (
                  <span className="outils-postulations__letter-badge">
                    Ton detecte annonce: {TONE_LABELS[detectedTone]}
                  </span>
                )}
              </div>
              {matchedSkills.length > 0 && (
                <p className="outils-postulations__letter-keywords">
                  Mots-cles detectes dans l'offre: {matchedSkills.join(", ")}
                </p>
              )}
              <label className="outils-postulations__letter-label">
                Version editable
                <textarea
                  value={generatedLetter}
                  onChange={(e) => setGeneratedLetter(e.target.value)}
                  className="outils-postulations__letter-textarea outils-postulations__letter-textarea--result"
                />
              </label>
              <div className="outils-postulations__letter-result-actions">
                <button
                  type="button"
                  className="outils-postulations__cv-card-link"
                  onClick={handleCopy}
                >
                  {copied ? "Copiée !" : "Copier la lettre"}
                </button>
              </div>
            </>
          ) : (
            <p className="outils-postulations__placeholder">
              Remplissez le mini formulaire puis cliquez sur "Générer la lettre".
            </p>
          )}
        </div>
      </div>

      {user?.id && (
        <div className="outils-postulations__letter-projets">
          <h3 className="outils-postulations__letter-projets-title">Mes projets</h3>
          {projetsLoading ? (
            <p className="outils-postulations__placeholder">Chargement…</p>
          ) : (
            <>
              <ul className="outils-postulations__projets-list">
                {projets.map((p) => (
                  <li key={p.id} className="outils-postulations__projet-card">
                    {editingProjetId === p.id ? (
                      <form
                        className="outils-postulations__projet-edit-form"
                        onSubmit={handleUpdateProjet}
                      >
                        <input
                          type="text"
                          value={editProjetTitre}
                          onChange={(e) => setEditProjetTitre(e.target.value)}
                          className="outils-postulations__add-input"
                          placeholder="Titre"
                          required
                          disabled={savingProjetId !== null}
                        />
                        <textarea
                          value={editProjetDescription}
                          onChange={(e) => setEditProjetDescription(e.target.value)}
                          className="outils-postulations__letter-textarea"
                          placeholder="Réalisation"
                          required
                          disabled={savingProjetId !== null}
                        />
                        <div className="outils-postulations__add-actions">
                          <button
                            type="submit"
                            className="outils-postulations__add-btn"
                            disabled={savingProjetId !== null}
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            className="outils-postulations__add-cancel"
                            onClick={cancelEditProjet}
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="outils-postulations__projet-card-body">
                          <span className="outils-postulations__projet-card-titre">{p.titre}</span>
                          <p className="outils-postulations__projet-card-desc">
                            {p.description.length > 120
                              ? `${p.description.slice(0, 120)}…`
                              : p.description}
                          </p>
                        </div>
                        <div className="outils-postulations__projet-card-actions">
                          <button
                            type="button"
                            className="outils-postulations__projet-card-btn"
                            onClick={() => startEditProjet(p)}
                            aria-label={`Éditer ${p.titre}`}
                            title="Éditer"
                          >
                            <img
                              src="/icons/editer.png"
                              alt=""
                              className="outils-postulations__projet-card-icon"
                            />
                            Éditer
                          </button>
                          <button
                            type="button"
                            className="outils-postulations__projet-card-btn outils-postulations__projet-card-btn--delete"
                            onClick={() => handleDeleteProjet(p.id)}
                            aria-label={`Supprimer ${p.titre}`}
                            title="Supprimer"
                          >
                            <img
                              src="/icons/supprimer.png"
                              alt=""
                              className="outils-postulations__projet-card-icon"
                            />
                            Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              {showAddProjet ? (
                <form
                  className="outils-postulations__add-form outils-postulations__letter-add-projet"
                  onSubmit={handleAddProjet}
                >
                  <input
                    type="text"
                    value={addProjetTitre}
                    onChange={(e) => setAddProjetTitre(e.target.value)}
                    className="outils-postulations__add-input"
                    placeholder="Titre du projet"
                    required
                    disabled={addingProjet}
                  />
                  <textarea
                    value={addProjetDescription}
                    onChange={(e) => setAddProjetDescription(e.target.value)}
                    className="outils-postulations__letter-textarea"
                    placeholder="Réalisation (ex. j'ai refondu le tunnel et augmenté la conversion de 22%)"
                    required
                    disabled={addingProjet}
                  />
                  <div className="outils-postulations__add-actions">
                    <button
                      type="submit"
                      className="outils-postulations__add-btn"
                      disabled={addingProjet}
                    >
                      Ajouter le projet
                    </button>
                    <button
                      type="button"
                      className="outils-postulations__add-cancel"
                      onClick={() => {
                        setShowAddProjet(false);
                        setAddProjetTitre("");
                        setAddProjetDescription("");
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="outils-postulations__add-trigger"
                  onClick={() => setShowAddProjet(true)}
                >
                  + Ajouter un projet
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

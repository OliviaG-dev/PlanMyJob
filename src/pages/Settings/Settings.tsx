import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { getWeeklyGoals, setWeeklyGoals, type WeeklyGoals } from "../../lib/userGoals";
import "./Settings.css";

function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [goals, setGoals] = useState<WeeklyGoals>(() => getWeeklyGoals(user?.id));

  const handleCandidaturesChange = (value: number) => {
    const next = setWeeklyGoals(user?.id, { ...goals, candidatures: value });
    setGoals(next);
  };

  const handleCandidaturesMoisChange = (value: number) => {
    const next = setWeeklyGoals(user?.id, { ...goals, candidaturesMois: value });
    setGoals(next);
  };

  return (
    <main className="settings">
      <div className="settings__header">
        <div>
          <h1>Paramètres</h1>
          <p className="settings__intro">
            Préférences et configuration de PlanMyJob.
          </p>
        </div>
        <img
          src="/icons/setting.png"
          alt=""
          className="settings__icon"
          aria-hidden
        />
      </div>
      <section className="settings__sections">
        <div className="settings__block">
          <h2>Compte</h2>
          <p className="settings__block-desc">{user?.email}</p>
          <button
            type="button"
            className="settings__signout"
            onClick={() => signOut()}
          >
            Déconnexion
          </button>
        </div>
        <div className="settings__block">
          <h2>Apparence</h2>
          <p className="settings__block-desc">
            Choisissez le thème d'affichage de l'application.
          </p>
          <div className="settings__theme-toggle">
            <button
              type="button"
              className={`settings__theme-btn ${
                theme === "light" ? "settings__theme-btn--active" : ""
              }`}
              onClick={() => setTheme("light")}
            >
              Clair
            </button>
            <button
              type="button"
              className={`settings__theme-btn ${
                theme === "dark" ? "settings__theme-btn--active" : ""
              }`}
              onClick={() => setTheme("dark")}
            >
              Sombre
            </button>
          </div>
        </div>
        <div className="settings__block">
          <h2>Objectifs</h2>
          <p className="settings__block-desc">
            Définissez vos objectifs de candidatures (semaine et mois). Ils sont utilisés sur le tableau de bord.
          </p>
          <div className="settings__goals">
            <label className="settings__goal-label">
              <span className="settings__goal-text">Candidatures par semaine</span>
              <div className="settings__goal-input-wrap">
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={goals.candidatures}
                  onChange={(e) => handleCandidaturesChange(parseInt(e.target.value, 10) || 0)}
                  className="settings__goal-input"
                />
                <button
                  type="button"
                  className="settings__goal-validate"
                  onClick={() => setWeeklyGoals(user?.id, goals)}
                >
                  OK
                </button>
              </div>
            </label>
            <label className="settings__goal-label">
              <span className="settings__goal-text">Candidatures par mois</span>
              <div className="settings__goal-input-wrap">
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={goals.candidaturesMois}
                  onChange={(e) => handleCandidaturesMoisChange(parseInt(e.target.value, 10) || 0)}
                  className="settings__goal-input"
                />
                <button
                  type="button"
                  className="settings__goal-validate"
                  onClick={() => setWeeklyGoals(user?.id, goals)}
                >
                  OK
                </button>
              </div>
            </label>
          </div>
        </div>
      </section>
    </main>
  );
}

/** Wrapper pour réinitialiser l’état objectifs quand l’utilisateur change (key). */
function SettingsKeyed() {
  const { user } = useAuth();
  return <Settings key={user?.id ?? "anon"} />;
}

export default SettingsKeyed;

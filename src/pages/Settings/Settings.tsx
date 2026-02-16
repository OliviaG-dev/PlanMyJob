import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import "./Settings.css";

function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

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
          <p>Objectif hebdo de candidatures (à venir).</p>
        </div>
      </section>
    </main>
  );
}

export default Settings;

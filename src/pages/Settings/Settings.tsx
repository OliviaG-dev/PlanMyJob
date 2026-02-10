import "./Settings.css";

function Settings() {
  return (
    <main className="settings">
      <h1>Paramètres</h1>
      <p className="settings__intro">
        Préférences et configuration de PlanMyJob.
      </p>
      <section className="settings__sections">
        <div className="settings__block">
          <h2>Apparence</h2>
          <p>Thème clair / sombre (à venir).</p>
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

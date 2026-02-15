import "./Dashboard.css";

function Dashboard() {
  return (
    <main className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="dashboard__intro">
            Vue d'ensemble de votre recherche d'emploi.
          </p>
        </div>
        <img
          src="/icons/dashboard.png"
          alt=""
          className="dashboard__icon"
          aria-hidden
        />
      </div>
      <section className="dashboard__stats">
        <div className="stat-card">Candidatures envoyées</div>
        <div className="stat-card">En cours</div>
        <div className="stat-card">Entretiens</div>
      </section>
    </main>
  );
}

export default Dashboard;

import "./Taches.css";

function Taches() {
  return (
    <main className="taches">
      <div className="taches__header">
        <div>
          <h1>Tâches</h1>
          <p className="taches__intro">Todo liées aux candidatures ou globales.</p>
        </div>
        <img
          src="/icons/taches.png"
          alt=""
          className="taches__icon"
          aria-hidden
        />
      </div>
      <section className="taches__list">
        <p className="taches__empty">Aucune tâche.</p>
      </section>
    </main>
  );
}

export default Taches;

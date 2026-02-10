import "./Taches.css";

function Taches() {
  return (
    <main className="taches">
      <h1>Tâches</h1>
      <p className="taches__intro">Todo liées aux candidatures ou globales.</p>
      <section className="taches__list">
        <p className="taches__empty">Aucune tâche.</p>
      </section>
    </main>
  );
}

export default Taches;

import "./Candidatures.css";

function Candidatures() {
  return (
    <main className="candidatures">
      <h1>Candidatures</h1>
      <p className="candidatures__intro">Liste de toutes vos candidatures.</p>
      <section className="candidatures__list">
        <p className="candidatures__empty">
          Aucune candidature pour l'instant.
        </p>
      </section>
    </main>
  );
}

export default Candidatures;

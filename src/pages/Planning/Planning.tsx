import "./Planning.css";

function Planning() {
  return (
    <main className="planning">
      <h1>Semainier / Planning</h1>
      <p className="planning__intro">
        Entretiens, relances et deadlines de la semaine.
      </p>
      <section className="planning__week">
        <p className="planning__empty">Vue calendrier à venir.</p>
      </section>
    </main>
  );
}

export default Planning;

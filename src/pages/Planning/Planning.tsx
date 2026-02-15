import "./Planning.css";

function Planning() {
  return (
    <main className="planning">
      <div className="planning__header">
        <div>
          <h1>Semainier / Planning</h1>
          <p className="planning__intro">
            Entretiens, relances et deadlines de la semaine.
          </p>
        </div>
        <img
          src="/icons/callendar.png"
          alt=""
          className="planning__icon"
          aria-hidden
        />
      </div>
      <section className="planning__week">
        <p className="planning__empty">Vue calendrier à venir.</p>
      </section>
    </main>
  );
}

export default Planning;

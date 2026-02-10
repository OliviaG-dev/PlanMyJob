import "./Kanban.css";

function Kanban() {
  const columns = [
    "À postuler",
    "CV envoyé",
    "Entretien RH",
    "Entretien technique",
    "Attente de réponse",
    "Refus",
    "Offre 🎉",
  ];

  return (
    <main className="kanban">
      <h1>Kanban</h1>
      <p className="kanban__intro">
        Glissez-déposez vos candidatures entre les colonnes.
      </p>
      <div className="kanban__board">
        {columns.map((col) => (
          <div key={col} className="kanban__column">
            <h3 className="kanban__column-title">{col}</h3>
            <div className="kanban__cards" />
          </div>
        ))}
      </div>
    </main>
  );
}

export default Kanban;

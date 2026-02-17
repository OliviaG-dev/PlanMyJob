import "./OutilsPostulations.css";

function OutilsPostulations() {
  return (
    <main className="outils-postulations">
      <div className="outils-postulations__header">
        <div>
          <h1>Outils de postulation</h1>
          <p className="outils-postulations__intro">
            Modèles, templates et ressources pour optimiser vos candidatures.
          </p>
        </div>
        <img
          src="/icons/setting.png"
          alt=""
          className="outils-postulations__icon"
          aria-hidden
        />
      </div>
      <section className="outils-postulations__content">
        <p className="outils-postulations__empty">
          Contenu à venir : templates de lettres, conseils entretien, liens utiles…
        </p>
      </section>
    </main>
  );
}

export default OutilsPostulations;

import "./Loader.css";

type LoaderProps = {
  /** Affiche le loader en plein écran (fond, centrage). Par défaut true. */
  fullScreen?: boolean;
  /** Texte sous le spinner (ex. "Chargement…"). */
  label?: string;
};

function Loader({ fullScreen = true, label = "Chargement…" }: LoaderProps) {
  return (
    <div
      className={`loader ${fullScreen ? "loader--full-screen" : ""}`}
      role="status"
      aria-label={label}
    >
      <div className="loader__spinner" aria-hidden />
      {label ? <p className="loader__label">{label}</p> : null}
    </div>
  );
}

export default Loader;

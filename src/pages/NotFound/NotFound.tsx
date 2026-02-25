import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <img
          src="/404.png"
          alt=""
          className="not-found-illustration"
        />
        <Link to="/" className="not-found-link">
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}

export default NotFound;

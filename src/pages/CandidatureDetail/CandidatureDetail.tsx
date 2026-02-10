import { useParams, Link } from "react-router-dom";
import "./CandidatureDetail.css";

function CandidatureDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="candidature-detail">
      <Link to="/candidatures" className="candidature-detail__back">
        ← Retour aux candidatures
      </Link>
      <h1>Détail de la candidature</h1>
      <p className="candidature-detail__id">ID : {id}</p>
    </main>
  );
}

export default CandidatureDetail;

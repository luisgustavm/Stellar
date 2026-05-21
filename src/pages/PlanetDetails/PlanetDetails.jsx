// src/pages/PlanetDetails/PlanetDetails.jsx
import { useNavigate, useParams } from "react-router-dom";
import "./PlanetDetails.css";

export default function PlanetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const planetName = id ? id.charAt(0).toUpperCase() + id.slice(1) : "Planeta";

  return (
    <div className="planet-details-page">
      <section className="planet-details-card">
        <button
          className="planet-details-close"
          type="button"
          onClick={() => navigate("/planets")}
          aria-label="Fechar detalhes"
        >
          ×
        </button>
        <span className="planet-details-orb" />
        <div>
          <p className="page-kicker">Dossiê planetário</p>
          <h1>Detalhes de {planetName}</h1>
          <p>
            Aqui entrará a integração com NASA API e uma descrição completa do planeta.
          </p>
        </div>
      </section>
    </div>
  );
}

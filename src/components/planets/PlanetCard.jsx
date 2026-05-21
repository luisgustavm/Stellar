import { useState } from "react";

export default function PlanetCard({ planet, onDetails }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(planet.image && !imageFailed);
  const isRealImage = planet.imageKind?.toLowerCase().includes("real");

  return (
    <article className="planeta-card">
      <div className="planet-card-image">
        {hasImage ? (
          <img
            src={planet.image}
            alt={planet.imageAlt || planet.name}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className={`planet-generated-visual ${planet.visualClass || "planet-visual-default"}`} />
        )}

        {planet.imageKind && (
          <span className={`planet-image-badge ${isRealImage ? "is-real" : ""}`}>
            {planet.imageKind}
          </span>
        )}
      </div>

      <div className="planet-card-body">
        <div className="planet-card-badges">
          <span className="planet-card-type">{planet.type}</span>
          <span className="planet-card-system">{planet.system}</span>
        </div>

        <h2>{planet.name}</h2>
        <p className="planet-card-description">{planet.description}</p>

        <dl className="planet-card-metrics">
          <div>
            <dt>Sistema</dt>
            <dd>{planet.system}</dd>
          </div>
          <div>
            <dt>Estrela</dt>
            <dd>{planet.star}</dd>
          </div>
          <div>
            <dt>Órbita</dt>
            <dd>{planet.translation}</dd>
          </div>
          <div>
            <dt>Descoberta</dt>
            <dd>{planet.discovery}</dd>
          </div>
        </dl>
      </div>

      <button onClick={onDetails} className="btn-saiba-mais" type="button">
        Abrir dossiê
      </button>
    </article>
  );
}

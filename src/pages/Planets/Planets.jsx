import { useMemo, useState } from "react";
import PlanetSearch from "../../components/planets/PlanetSearch";
import PlanetCard from "../../components/planets/PlanetCard";
import { planetSources, planetsData } from "../../data/planetsData";
import "./Planets.css";

const allValue = "all";

function getUniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

function normalize(value = "") {
  return value
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export default function Planets() {
  const [activePlanet, setActivePlanet] = useState(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(allValue);
  const [typeFilter, setTypeFilter] = useState(allValue);
  const [systemFilter, setSystemFilter] = useState(allValue);

  const categories = useMemo(() => getUniqueValues(planetsData, "category"), []);
  const types = useMemo(() => getUniqueValues(planetsData, "type"), []);
  const systems = useMemo(() => getUniqueValues(planetsData, "system"), []);

  const visiblePlanets = useMemo(() => {
    const term = normalize(query.trim());

    return planetsData.filter((planet) => {
      const matchesQuery =
        !term ||
        [
          planet.name,
          planet.category,
          planet.type,
          planet.system,
          planet.star,
          planet.discovery,
          planet.method,
          planet.nasaSource,
          planet.imageKind,
          planet.imageCredit,
          ...(planet.facts || []),
        ]
          .filter(Boolean)
          .some((value) => normalize(value).includes(term));

      const matchesCategory =
        categoryFilter === allValue || planet.category === categoryFilter;
      const matchesType = typeFilter === allValue || planet.type === typeFilter;
      const matchesSystem = systemFilter === allValue || planet.system === systemFilter;

      return matchesQuery && matchesCategory && matchesType && matchesSystem;
    });
  }, [categoryFilter, query, systemFilter, typeFilter]);

  const stats = useMemo(() => {
    const exoplanets = planetsData.filter((planet) => planet.category === "Exoplanetas").length;
    const officialSolarPlanets = planetsData.filter(
      (planet) => planet.category === "Sistema Solar"
    ).length;
    const systemsCount = new Set(planetsData.map((planet) => planet.system)).size;

    return [
      { label: "mundos catalogados", value: planetsData.length },
      { label: "planetas oficiais", value: officialSolarPlanets },
      { label: "exoplanetas famosos", value: exoplanets },
      { label: "sistemas", value: systemsCount },
    ];
  }, []);

  function clearFilters() {
    setQuery("");
    setCategoryFilter(allValue);
    setTypeFilter(allValue);
    setSystemFilter(allValue);
  }

  return (
    <div className="planets-page">
      <main className="planets-main">
        <header className="planets-heading">
          <p className="page-kicker">Arquivo planetário</p>
          <h1>Planetas, exoplanetas e mundos conhecidos</h1>
          <p>
            Explore corpos do Sistema Solar e mundos famosos confirmados fora dele,
            com sistema planetário, estrela, dados orbitais e referências da NASA.
          </p>

          <div className="planet-source-links" aria-label="Fontes científicas">
            {planetSources.map((source) => (
              <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                <strong>{source.label}</strong>
                <span>{source.description}</span>
              </a>
            ))}
          </div>
        </header>

        <section className="planet-stats-grid" aria-label="Resumo do catálogo">
          {stats.map((stat) => (
            <article key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </section>

        <section className="planet-filters" aria-label="Filtros de planetas">
          <PlanetSearch
            planets={planetsData}
            query={query}
            onQueryChange={setQuery}
            placeholder="Buscar por planeta, estrela, sistema, missão ou tipo..."
          />

          <div className="planet-filter-grid">
            <label>
              <span>Categoria</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value={allValue}>Todas</option>
                {categories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Tipo</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value={allValue}>Todos</option>
                {types.map((type) => (
                  <option value={type} key={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Sistema</span>
              <select
                value={systemFilter}
                onChange={(event) => setSystemFilter(event.target.value)}
              >
                <option value={allValue}>Todos</option>
                {systems.map((system) => (
                  <option value={system} key={system}>
                    {system}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" onClick={clearFilters}>
              Limpar filtros
            </button>
          </div>
        </section>

        <section className="planet-nasa-panel" aria-labelledby="nasa-title">
          <div>
            <p className="page-kicker">Dados NASA</p>
            <h2 id="nasa-title">Contexto científico</h2>
          </div>
          <p>
            A NASA reconhece oito planetas oficiais no Sistema Solar e cinco
            planetas anões. Para exoplanetas, o catálogo da NASA organiza mundos
            por tipo, método de descoberta, órbita, massa, raio e sistema estelar.
            Os cards indicam quando a imagem é uma foto/observação real ou uma
            ilustração oficial baseada em dados científicos.
          </p>
        </section>

        <div className="planet-results-heading">
          <div>
            <p className="page-kicker">Resultados</p>
            <h2>{visiblePlanets.length} mundos encontrados</h2>
          </div>
          <span>
            {categoryFilter === allValue ? "Todas as categorias" : categoryFilter}
          </span>
        </div>

        {visiblePlanets.length > 0 ? (
          <div className="planetas" aria-live="polite">
            {visiblePlanets.map((planet) => (
              <PlanetCard
                key={planet.id}
                planet={planet}
                onDetails={() => setActivePlanet(planet)}
              />
            ))}
          </div>
        ) : (
          <p className="planets-empty">
            Nenhum mundo encontrado com esses filtros. Tente limpar a busca ou
            trocar o sistema selecionado.
          </p>
        )}
      </main>

      {activePlanet && (
        <div className="planet-modal-backdrop" role="dialog" aria-modal="true">
          <section className="planet-modal-card">
            <button
              className="planet-modal-close"
              type="button"
              onClick={() => setActivePlanet(null)}
              aria-label="Fechar detalhes"
            >
              X
            </button>

            <div className="planet-modal-media">
              {activePlanet.image ? (
                <img
                  src={activePlanet.image}
                  alt={activePlanet.imageAlt || activePlanet.name}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span
                  className={`planet-generated-visual ${
                    activePlanet.visualClass || "planet-visual-default"
                  }`}
                />
              )}

              {activePlanet.imageKind && (
                <div className="planet-image-meta">
                  <strong>{activePlanet.imageKind}</strong>
                  {activePlanet.imageCredit && <span>{activePlanet.imageCredit}</span>}
                  {activePlanet.imageSourceUrl && (
                    <a href={activePlanet.imageSourceUrl} target="_blank" rel="noreferrer">
                      Fonte da imagem
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="planet-modal-content">
              <p className="page-kicker">{activePlanet.category}</p>
              <h2>{activePlanet.name}</h2>
              <p>{activePlanet.details}</p>

              <dl className="planet-modal-grid">
                <div>
                  <dt>Sistema</dt>
                  <dd>{activePlanet.system}</dd>
                </div>
                <div>
                  <dt>Estrela</dt>
                  <dd>{activePlanet.star}</dd>
                </div>
                <div>
                  <dt>Tipo</dt>
                  <dd>{activePlanet.type}</dd>
                </div>
                <div>
                  <dt>Distância orbital</dt>
                  <dd>{activePlanet.distance}</dd>
                </div>
                <div>
                  <dt>Distância da Terra</dt>
                  <dd>{activePlanet.distanceFromEarth}</dd>
                </div>
                <div>
                  <dt>Diâmetro/Raio</dt>
                  <dd>{activePlanet.diameter}</dd>
                </div>
                <div>
                  <dt>Rotação</dt>
                  <dd>{activePlanet.rotation}</dd>
                </div>
                <div>
                  <dt>Translação</dt>
                  <dd>{activePlanet.translation}</dd>
                </div>
                <div>
                  <dt>Gravidade</dt>
                  <dd>{activePlanet.gravity}</dd>
                </div>
                <div>
                  <dt>Temperatura</dt>
                  <dd>{activePlanet.temperature}</dd>
                </div>
                <div>
                  <dt>Atmosfera</dt>
                  <dd>{activePlanet.atmosphere}</dd>
                </div>
                <div>
                  <dt>Descoberta</dt>
                  <dd>{activePlanet.discovery} | {activePlanet.method}</dd>
                </div>
              </dl>

              <aside className="planet-nasa-note">
                <strong>{activePlanet.nasaSource}</strong>
                <p>{activePlanet.nasaNote}</p>
                <a href={activePlanet.sourceUrl} target="_blank" rel="noreferrer">
                  Ver fonte da NASA
                </a>
              </aside>

              <ul className="planet-facts">
                {activePlanet.facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

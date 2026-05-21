import { useMemo, useState } from "react";
import VideoGallery from "../../components/videos/VideoGallery";
import { videosData } from "../../data/videosData";
import "./Videos.css";

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

export default function Videos() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(allValue);
  const [sourceFilter, setSourceFilter] = useState(allValue);
  const [levelFilter, setLevelFilter] = useState(allValue);

  const categoriesCount = new Set(videosData.map((video) => video.category)).size;
  const categories = useMemo(() => getUniqueValues(videosData, "category"), []);
  const sources = useMemo(() => getUniqueValues(videosData, "source"), []);
  const levels = useMemo(() => getUniqueValues(videosData, "level"), []);

  const visibleVideos = useMemo(() => {
    const term = normalize(query.trim());

    return videosData.filter((video) => {
      const matchesQuery =
        !term ||
        [
          video.title,
          video.category,
          video.source,
          video.level,
          video.duration,
          video.description,
          ...(video.takeaways || []),
        ]
          .filter(Boolean)
          .some((value) => normalize(value).includes(term));

      const matchesCategory =
        categoryFilter === allValue || video.category === categoryFilter;
      const matchesSource = sourceFilter === allValue || video.source === sourceFilter;
      const matchesLevel = levelFilter === allValue || video.level === levelFilter;

      return matchesQuery && matchesCategory && matchesSource && matchesLevel;
    });
  }, [categoryFilter, levelFilter, query, sourceFilter]);

  function clearFilters() {
    setQuery("");
    setCategoryFilter(allValue);
    setSourceFilter(allValue);
    setLevelFilter(allValue);
  }

  return (
    <div className="videos-page">
      <header className="videos-header">
        <p className="page-kicker">Observatório audiovisual</p>
        <h1>Vídeos</h1>
        <p>
          Uma seleção revisada de vídeos funcionais para estudar astronomia,
          exploração espacial, planetas e cosmologia com conteúdo visual.
        </p>
        <div className="videos-summary" aria-label="Resumo da biblioteca">
          <span>{videosData.length} vídeos</span>
          <span>{categoriesCount} categorias</span>
          <span>Embeds verificados</span>
          <span>Conteúdo educativo</span>
        </div>
      </header>

      <section className="video-study-panel" aria-labelledby="video-study-title">
        <div>
          <p className="page-kicker">Trilha recomendada</p>
          <h2 id="video-study-title">Como estudar pela aba de vídeos</h2>
        </div>
        <ol>
          <li>Comece por Sistema Solar e Lua para entender escala e órbitas.</li>
          <li>Depois avance para Sol, buracos negros e cosmologia.</li>
          <li>Finalize com TESS, TRAPPIST-1 e atmosferas alienígenas.</li>
        </ol>
      </section>

      <section className="video-filters" aria-label="Filtros de vídeos">
        <form
          className="video-search"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por vídeo, missão, planeta, cosmologia ou tópico..."
            aria-label="Buscar vídeos"
          />
          <button type="submit">Buscar</button>
        </form>

        <div className="video-filter-grid">
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
            <span>Fonte</span>
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              <option value={allValue}>Todas</option>
              {sources.map((source) => (
                <option value={source} key={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Nível</span>
            <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
              <option value={allValue}>Todos</option>
              {levels.map((level) => (
                <option value={level} key={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={clearFilters}>
            Limpar filtros
          </button>
        </div>
      </section>

      <div className="video-results-heading">
        <div>
          <p className="page-kicker">Resultados</p>
          <h2>{visibleVideos.length} vídeos encontrados</h2>
        </div>
        <span>{categoryFilter === allValue ? "Todas as categorias" : categoryFilter}</span>
      </div>

      {visibleVideos.length > 0 ? (
        <VideoGallery videos={visibleVideos} />
      ) : (
        <p className="videos-empty">
          Nenhum vídeo encontrado com esses filtros. Tente limpar a busca ou trocar a categoria.
        </p>
      )}
    </div>
  );
}

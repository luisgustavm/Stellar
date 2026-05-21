// src/components/planets/PlanetSearch.jsx
import { useState } from "react";

export default function PlanetSearch({
  planets = [],
  onSelect,
  query: controlledQuery,
  onQueryChange,
  placeholder = "Buscar planeta, sistema ou estrela...",
}) {
  const [internalQuery, setInternalQuery] = useState("");
  const query = controlledQuery ?? internalQuery;

  function handleSearch(nextQuery = query) {
    const term = nextQuery.trim().toLowerCase();
    const result = term
      ? planets.filter((planet) =>
          [planet.name, planet.system, planet.star, planet.type, planet.category]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(term))
        )
      : null;

    onSelect?.(result);
  }

  function handleChange(value) {
    if (controlledQuery === undefined) {
      setInternalQuery(value);
      handleSearch(value);
    }

    onQueryChange?.(value);
  }

  return (
    <form
      className="planet-search"
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
    >
      <input
        value={query}
        onChange={(e) => {
          handleChange(e.target.value);
        }}
        placeholder={placeholder}
      />

      <button type="submit">Buscar</button>
    </form>
  );
}

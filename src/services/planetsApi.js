// src/services/planetsApi.js
export const getPlanetDetails = async (id) => {
  const res = await fetch(
    `https://api.le-systeme-solaire.net/rest/bodies/${id}`
  );
  return res.json();
};
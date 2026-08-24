'use strict';

// ---------- SuperFlixAPI (via proxy do backend) ----------
// A SuperFlixAPI não envia cabeçalhos CORS, então o front-end sempre
// passa pelo proxy do nosso backend (server.js) para buscar os dados.

// Busca genérica da SuperFlixAPI.
async function sfList(params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${CONFIG.SUPERFLIX_PROXY}/lista?${qs}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// Gêneros de um catálogo (filme/serie/anime/dorama).
function sfGenres(category) {
  return sfList({ category, type: 'generos', format: 'json' });
}

// Conteúdos (IDs) de um gênero específico.
function sfGenreContents(category, genreSlug, limit = 20) {
  return sfList({ category, type: 'tmdb', genero: genreSlug, format: 'json', limit });
}

// Busca por termo (retorna lista de IDs).
function sfSearch(query, limit = 40) {
  return sfList({ category: 'filme', type: 'search', query, format: 'json', limit });
}

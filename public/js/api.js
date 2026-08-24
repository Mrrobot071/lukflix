'use strict';

// ---------- SuperFlixAPI (via proxy do backend) ----------

// Busca listas genéricas da SuperFlixAPI.
// Tenta primeiro o proxy local do backend (Node) e, se falhar (ex.: site
// estático no GitHub Pages), usa proxies CORS públicos.
async function sfList(params) {
  const qs = new URLSearchParams(params).toString();
  const targets = [
    `${CONFIG.SUPERFLIX_PROXY}/lista?${qs}`,
    ...CORS_PROXIES.map(p => p(`${CONFIG.SUPERFLIX_HOST}/lista?${qs}`))
  ];

  let lastErr;
  for (const url of targets) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      return JSON.parse(text);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error('SuperFlixAPI indisponível (proxy CORS falhou): ' + (lastErr && lastErr.message));
}

// Gêneros de um catálogo (filme/serie/anime/dorama).
function sfGenres(category) {
  return sfList({ category, type: 'generos', format: 'json' });
}

// Conteúdos (IDs TMDB) de um gênero específico.
function sfGenreContents(category, genreSlug, limit = 20) {
  return sfList({ category, type: 'tmdb', genero: genreSlug, format: 'json', limit });
}

// ---------- TMDB (chamado direto do navegador, suporta CORS) ----------

async function tmdb(path, params = {}) {
  const key = tmdbKey();
  if (!key) throw new Error('no-key');
  const qs = new URLSearchParams(Object.assign({ api_key: key }, params)).toString();
  const res = await fetch(`${CONFIG.TMDB_BASE}${path}?${qs}`);
  if (!res.ok) {
    if (res.status === 401) throw new Error('invalid-key');
    throw new Error('TMDB ' + res.status);
  }
  return res.json();
}

function tmdbMovie(id) { return tmdb(`/movie/${id}`); }
function tmdbTv(id) { return tmdb(`/tv/${id}`); }
function tmdbTvSeason(tvId, season) { return tmdb(`/tv/${tvId}/season/${season}`); }
function tmdbSearch(query, page = 1) {
  return tmdb('/search/multi', { query, page, include_adult: false });
}

function imgUrl(path, size = 'IMG') {
  if (!path) return '';
  return CONFIG[size] + path;
}

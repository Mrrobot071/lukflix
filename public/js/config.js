'use strict';

const CONFIG = {
  SUPERFLIX_PROXY: '/api/superflix',
  SUPERFLIX_HOST: 'https://superflixapi.sbs',
  TMDB_PROXY: '/api/tmdb',
  TMDB_BASE: 'https://api.themoviedb.org/3',
  IMG: 'https://image.tmdb.org/t/p/w342',
  IMG_LG: 'https://image.tmdb.org/t/p/w780',
  IMG_ORIGINAL: 'https://image.tmdb.org/t/p/original'
};

// Proxies CORS públicos usados quando o app roda como site estático
// (ex.: GitHub Pages), já que a SuperFlixAPI não envia cabeçalhos CORS.
const CORS_PROXIES = [
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://corsproxy.io/?url=${encodeURIComponent(u)}`
];

const STORAGE_KEY = 'lukflix_tmdb_key';

function tmdbKey() {
  try { return localStorage.getItem(STORAGE_KEY) || ''; }
  catch (e) { return ''; }
}

function setTmdbKey(key) {
  try { localStorage.setItem(STORAGE_KEY, key.trim()); } catch (e) {}
}

function clearTmdbKey() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

function hasTmdbKey() {
  return tmdbKey().length > 0;
}

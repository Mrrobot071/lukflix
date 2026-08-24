'use strict';

const CONFIG = {
  SUPERFLIX_PROXY: '/api/superflix',
  TMDB_BASE: 'https://api.themoviedb.org/3',
  IMG: 'https://image.tmdb.org/t/p/w342',
  IMG_LG: 'https://image.tmdb.org/t/p/w780',
  IMG_ORIGINAL: 'https://image.tmdb.org/t/p/original'
};

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

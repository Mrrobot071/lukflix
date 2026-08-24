'use strict';

const SUPERFLIX_PLAYER = 'https://superflixapi.sbs';

const TAB_MAP = {
  filme:  { category: 'filme',  media: 'movie' },
  serie:  { category: 'serie',  media: 'tv' },
  anime:  { category: 'anime',  media: 'tv' },
  dorama: { category: 'dorama', media: 'tv' }
};

let currentTab = 'filme';
let tmdbAvailable = false;
const catalogEl = document.getElementById('catalog');

// Verifica se o TMDB está acessível (chave no servidor OU chave do navegador).
async function checkTmdb() {
  try {
    await tmdb('/movie/550');
    tmdbAvailable = true;
    document.getElementById('keyBanner').classList.add('hidden');
  } catch (e) {
    tmdbAvailable = false;
    if (!tmdbKey()) document.getElementById('keyBanner').classList.remove('hidden');
  }
}

// ---------- Utilidades de UI ----------

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// ---------- Catálogo ----------

async function loadCatalog(category) {
  catalogEl.innerHTML = '';
  let genres;
  try {
    genres = await sfGenres(category);
  } catch (e) {
    catalogEl.appendChild(el('p', { class: 'loading-more', text: 'Não foi possível carregar a SuperFlixAPI: ' + e.message }));
    return;
  }
  if (!Array.isArray(genres)) genres = (genres && genres.data) || [];

  const featured = genres.slice(0, 5);
  for (const g of featured) {
    catalogEl.appendChild(renderRow(category, g));
  }
}

function renderRow(category, genre) {
  const row = el('section', { class: 'row' });
  row.appendChild(el('h2', { class: 'row-title', html: `${esc(genre.name)} <small>(${genre.items_count || 0})</small>` }));

  const grid = el('div', { class: 'grid' });
  // espaços reservados enquanto carrega
  for (let i = 0; i < 12; i++) {
    grid.appendChild(el('div', { class: 'card skeleton' }));
  }
  row.appendChild(grid);
  catalogEl.appendChild(row);

  sfGenreContents(category, genre.slug, 18)
    .then(ids => {
      const list = Array.isArray(ids) ? ids.slice(0, 18) : [];
      grid.innerHTML = '';
      if (list.length === 0) {
        grid.appendChild(el('div', { class: 'no-poster', text: 'Sem conteúdo' }));
        return;
      }
      list.forEach(id => grid.appendChild(renderCard(category, id)));
    })
    .catch(() => { grid.innerHTML = ''; });

  return row;
}

function renderCard(category, id) {
  const media = TAB_MAP[category].media;
  const card = el('div', { class: 'card', onclick: () => openDetail(media, id) });

  const poster = el('div', { class: 'no-poster', text: 'TMDB ID: ' + id });
  card.appendChild(poster);

  if (tmdbAvailable) {
    tmdb(media === 'movie' ? `/movie/${id}` : `/tv/${id}`)
      .then(data => {
        if (data && data.poster_path) {
          poster.outerHTML = '';
          const img = el('img', { src: imgUrl(data.poster_path), alt: data.title || data.name || '', loading: 'lazy' });
          card.insertBefore(img, card.firstChild);
        } else {
          poster.textContent = data.title || data.name || ('ID ' + id);
        }
        const meta = el('div', { class: 'meta' }, [
          el('div', { class: 'title', text: data.title || data.name || ('ID ' + id) }),
          el('div', { class: 'sub', text: (data.release_date || data.first_air_date || '').slice(0, 4) || '' })
        ]);
        card.appendChild(meta);
      })
      .catch(() => { poster.textContent = 'ID ' + id; });
  } else {
    card.appendChild(el('div', { class: 'meta' }, [
      el('div', { class: 'title', text: 'ID ' + id }),
      el('div', { class: 'sub', text: 'Adicione a chave TMDB' })
    ]));
  }
  return card;
}

// ---------- Login SuperFlixAPI ----------
// A SuperFlixAPI protege o player com uma verificação (captcha) ou login.
// Abrir o login em outra aba grava o cookie de sessão no navegador, o que
// faz o iframe do player (mesmo domínio) ignorar a verificação.
document.getElementById('sflixLogin').addEventListener('click', () => {
  window.open('https://superflixapi.sbs/login', '_blank', 'noopener');
});

// ---------- Detalhe / Player ----------

const detailModal = document.getElementById('detailModal');
const detailBody = document.getElementById('detailBody');

function playerNote() {
  return el('p', {
    class: 'hint',
    html: 'Player da <b>SuperFlixAPI</b>. Se aparecer uma verificação, ' +
          '<a href="https://superflixapi.sbs/login" target="_blank" rel="noopener">faça login na SuperFlixAPI</a> ' +
          'em outra aba e recarregue esta página.'
  });
}

async function openDetail(media, id) {
  detailBody.innerHTML = '<div class="loading-more">Carregando…</div>';
  detailModal.classList.remove('hidden');

  const posterCol = el('div', { class: 'detail-poster' });
  const infoCol = el('div', { class: 'detail-info' });
  detailBody.innerHTML = '';
  detailBody.append(posterCol, infoCol);

  let data = null;
  if (tmdbAvailable) {
    try {
      data = media === 'movie' ? await tmdbMovie(id) : await tmdbTv(id);
    } catch (e) {
      infoCol.appendChild(el('p', { class: 'status err', text: 'Erro TMDB: ' + e.message }));
    }
  }

  const title = data ? (data.title || data.name) : ('ID ' + id);
  const year = data ? (data.release_date || data.first_air_date || '').slice(0, 4) : '';

  if (data && data.poster_path) {
    posterCol.appendChild(el('img', { src: imgUrl(data.poster_path, 'IMG_LG'), alt: title }));
  } else {
    posterCol.appendChild(el('div', { class: 'no-poster', text: 'Sem pôster' }));
  }

  infoCol.appendChild(el('h1', { text: title }));
  if (data && data.tagline) infoCol.appendChild(el('div', { class: 'tagline', text: data.tagline }));

  const facts = el('div', { class: 'facts' });
  if (year) facts.appendChild(el('span', { html: `<b>${esc(year)}</b>` }));
  if (data && data.vote_average) facts.appendChild(el('span', { html: `★ <b>${data.vote_average.toFixed(1)}</b>` }));
  if (data && data.genres && data.genres.length) {
    facts.appendChild(el('span', { html: data.genres.map(g => esc(g.name)).join(', ') }));
  }
  if (data && media === 'tv' && data.number_of_seasons) {
    facts.appendChild(el('span', { html: `<b>${data.number_of_seasons}</b> temporada(s)` }));
  }
  infoCol.appendChild(facts);

  if (data && data.overview) infoCol.appendChild(el('p', { class: 'overview', text: data.overview }));

  // Player
  const playerWrap = el('div', { class: 'player-wrap' });
  infoCol.appendChild(playerWrap);
  infoCol.appendChild(playerNote());

  if (media === 'movie') {
    playerWrap.appendChild(buildPlayerFrame(`${SUPERFLIX_PLAYER}/filme/${id}`));
  } else {
    await buildSeriesPlayer(playerWrap, id, data);
  }
}

function buildPlayerFrame(src) {
  const frame = el('div', { class: 'player-frame' });
  frame.appendChild(el('iframe', {
    src,
    allow: 'autoplay *; encrypted-media *; picture-in-picture *; fullscreen *; web-share *; accelerometer *; gyroscope *',
    allowfullscreen: 'true',
    referrerpolicy: 'no-referrer'
  }));
  return frame;
}

async function buildSeriesPlayer(container, id, data) {
  const controls = el('div', { class: 'player-controls' });
  const seasonSel = el('select', { 'aria-label': 'Temporada' });
  const epSel = el('select', { 'aria-label': 'Episódio' });
  const frameHolder = el('div');

  controls.append(
    el('label', { text: 'Temporada ' }), seasonSel,
    el('label', { text: 'Episódio ' }), epSel
  );
  container.append(controls, frameHolder);

  let seasons = [];
  if (data && data.seasons) {
    seasons = data.seasons.filter(s => s.season_number >= 0);
  }
  if (seasons.length === 0) {
    // fallback: temporadas 1..(number_of_seasons)
    const n = (data && data.number_of_seasons) || 1;
    for (let i = 1; i <= n; i++) seasons.push({ season_number: i, episode_count: 0 });
  }

  seasons.forEach(s => {
    seasonSel.appendChild(el('option', { value: s.season_number, text: s.season_number === 0 ? 'Especiais' : ('T' + s.season_number) }));
  });

  async function loadEpisodes(season) {
    epSel.innerHTML = '';
    let count = 0;
    try {
      const sd = await tmdbTvSeason(id, season);
      if (sd && sd.episodes) count = sd.episodes.length;
    } catch (e) { count = 0; }
    if (count === 0) {
      // fallback
      const sInfo = seasons.find(s => s.season_number == season);
      count = sInfo ? sInfo.episode_count || 12 : 12;
    }
    for (let i = 1; i <= count; i++) {
      epSel.appendChild(el('option', { value: i, text: 'E' + i }));
    }
    updatePlayer();
  }

  function updatePlayer() {
    const s = seasonSel.value;
    const e = epSel.value || 1;
    frameHolder.innerHTML = '';
    frameHolder.appendChild(buildPlayerFrame(`${SUPERFLIX_PLAYER}/serie/${id}/${s}/${e}`));
  }

  seasonSel.addEventListener('change', () => loadEpisodes(seasonSel.value));
  epSel.addEventListener('change', updatePlayer);

  await loadEpisodes(seasons.length ? seasons[0].season_number : 1);
}

// ---------- Busca ----------

async function runSearch(query) {
  catalogEl.innerHTML = '';
  if (!tmdbAvailable) {
    catalogEl.appendChild(el('p', { class: 'loading-more', text: 'Adicione a chave do TMDB para buscar.' }));
    return;
  }
  const status = el('p', { class: 'loading-more', text: 'Buscando por "' + esc(query) + '"…' });
  catalogEl.appendChild(status);
  try {
    const res = await tmdbSearch(query);
    status.remove();
    const results = (res.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
    if (results.length === 0) {
      catalogEl.appendChild(el('p', { class: 'loading-more', text: 'Nenhum resultado.' }));
      return;
    }
    const row = el('section', { class: 'row' });
    row.appendChild(el('h2', { class: 'row-title', text: 'Resultados' }));
    const grid = el('div', { class: 'grid' });
    results.forEach(r => {
      const card = el('div', { class: 'card', onclick: () => openDetail(r.media_type, r.id) });
      if (r.poster_path) card.appendChild(el('img', { src: imgUrl(r.poster_path), alt: r.title || r.name, loading: 'lazy' }));
      else card.appendChild(el('div', { class: 'no-poster', text: r.title || r.name || ('ID ' + r.id) }));
      card.appendChild(el('div', { class: 'meta' }, [
        el('div', { class: 'title', text: r.title || r.name || ('ID ' + r.id) }),
        el('div', { class: 'sub', text: (r.release_date || r.first_air_date || '').slice(0, 4) || '' })
      ]));
      grid.appendChild(card);
    });
    row.appendChild(grid);
    catalogEl.appendChild(row);
  } catch (e) {
    status.remove();
    catalogEl.appendChild(el('p', { class: 'loading-more', text: 'Erro na busca: ' + e.message }));
  }
}

// ---------- Modais / Configurações ----------

function closeModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

document.addEventListener('click', e => {
  if (e.target.matches('[data-close]')) closeModals();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });

const settingsModal = document.getElementById('settingsModal');
const tmdbKeyInput = document.getElementById('tmdbKeyInput');
const settingsStatus = document.getElementById('settingsStatus');

document.getElementById('settingsBtn').addEventListener('click', () => {
  tmdbKeyInput.value = tmdbKey();
  settingsStatus.textContent = '';
  settingsStatus.className = 'status';
  settingsModal.classList.remove('hidden');
});

document.getElementById('saveKey').addEventListener('click', async () => {
  const v = tmdbKeyInput.value.trim();
  if (!v) { settingsStatus.textContent = 'Cole uma chave válida.'; settingsStatus.className = 'status err'; return; }
  setTmdbKey(v);
  settingsStatus.textContent = 'Chave salva! Verificando…';
  settingsStatus.className = 'status ok';
  await checkTmdb();
  setTimeout(() => { closeModals(); loadCatalog(currentTab); }, 300);
});

document.getElementById('clearKey').addEventListener('click', () => {
  clearTmdbKey();
  tmdbKeyInput.value = '';
  settingsStatus.textContent = 'Chave removida.';
  settingsStatus.className = 'status';
});

// Banner de chave
checkTmdb();
document.getElementById('bannerClose').addEventListener('click', () => {
  document.getElementById('keyBanner').classList.add('hidden');
});

// ---------- Eventos de navegação ----------

document.getElementById('tabs').addEventListener('click', e => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentTab = btn.dataset.type;
  loadCatalog(currentTab);
});

document.getElementById('searchForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = document.getElementById('searchInput').value.trim();
  if (q) runSearch(q);
  else loadCatalog(currentTab);
});

// ---------- Início ----------
loadCatalog(currentTab);

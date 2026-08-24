'use strict';

const SUPERFLIX_PLAYER = 'https://superflixapi.sbs';

const TAB_MAP = {
  filme:  { category: 'filme',  media: 'movie' },
  serie:  { category: 'serie',  media: 'tv' },
  anime:  { category: 'anime',  media: 'tv' },
  dorama: { category: 'dorama', media: 'tv' }
};

let currentTab = 'filme';
const catalogEl = document.getElementById('catalog');

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

  const featured = genres.slice(0, 6);
  for (const g of featured) {
    catalogEl.appendChild(renderRow(category, g));
  }
}

function renderRow(category, genre) {
  const row = el('section', { class: 'row' });
  row.appendChild(el('h2', { class: 'row-title', html: `${esc(genre.name)} <small>(${genre.items_count || 0})</small>` }));

  const grid = el('div', { class: 'grid' });
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
  const card = el('div', { class: 'card id-card', onclick: () => openDetail(media, id) });
  card.appendChild(el('div', { class: 'play-badge', html: '&#9654;' }));
  card.appendChild(el('div', { class: 'meta' }, [
    el('div', { class: 'title', text: 'ID ' + id }),
    el('div', { class: 'sub', text: 'Clique para assistir' })
  ]));
  return card;
}

// ---------- Login SuperFlixAPI ----------
// A SuperFlixAPI protege o player com uma verificação (Cloudflare/Turnstile).
// Abrir o login em outra aba grava o cookie de sessão e pode liberar o player.
document.getElementById('sflixLogin').addEventListener('click', () => {
  window.open('https://superflixapi.sbs/login', '_blank', 'noopener');
});

// ---------- Detalhe / Player ----------

const detailModal = document.getElementById('detailModal');
const detailBody = document.getElementById('detailBody');

function playerNote() {
  return el('p', {
    class: 'hint',
    html: 'Player da <b>SuperFlixAPI</b>. Se aparecer uma verificação (Cloudflare), ' +
          '<a href="https://superflixapi.sbs/login" target="_blank" rel="noopener">faça login na SuperFlixAPI</a> ' +
          'em outra aba e recarregue esta página.'
  });
}

async function openDetail(media, id) {
  detailBody.innerHTML = '<div class="loading-more">Carregando…</div>';
  detailModal.classList.remove('hidden');

  const infoCol = el('div', { class: 'detail-info' });
  const playerWrap = el('div', { class: 'player-wrap' });
  detailBody.innerHTML = '';
  detailBody.append(infoCol, playerWrap);

  infoCol.appendChild(el('h1', { text: 'ID ' + id }));
  infoCol.appendChild(playerNote());
  playerWrap.appendChild(buildPlayerFrame(media === 'movie' ? `${SUPERFLIX_PLAYER}/filme/${id}` : `${SUPERFLIX_PLAYER}/serie/${id}`));
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

// ---------- Busca (via SuperFlixAPI) ----------

async function runSearch(query) {
  catalogEl.innerHTML = '';
  const status = el('p', { class: 'loading-more', text: 'Buscando por "' + esc(query) + '"…' });
  catalogEl.appendChild(status);
  try {
    const ids = await sfSearch(query);
    status.remove();
    const results = Array.isArray(ids) ? ids : [];
    if (results.length === 0) {
      catalogEl.appendChild(el('p', { class: 'loading-more', text: 'Nenhum resultado.' }));
      return;
    }
    const row = el('section', { class: 'row' });
    row.appendChild(el('h2', { class: 'row-title', text: 'Resultados (' + results.length + ')' }));
    const grid = el('div', { class: 'grid' });
    results.slice(0, 60).forEach(id => grid.appendChild(renderCard(currentTab, id)));
    row.appendChild(grid);
    catalogEl.appendChild(row);
  } catch (e) {
    status.remove();
    catalogEl.appendChild(el('p', { class: 'loading-more', text: 'Erro na busca: ' + e.message }));
  }
}

// ---------- Modais ----------

function closeModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

document.addEventListener('click', e => {
  if (e.target.matches('[data-close]')) closeModals();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });

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

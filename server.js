'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const SUPERFLIX_HOST = 'superflixapi.sbs';
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

// Proxy para a SuperFlixAPI (a API não envia cabeçalhos CORS, então
// precisamos repassar as requisições pelo nosso backend).
function proxySuperflix(req, res, pathname, queryString) {
  const targetPath = pathname.replace(/^\/api\/superflix/, '') || '/';
  const target = targetPath + (queryString ? '?' + queryString : '');

  const options = {
    hostname: SUPERFLIX_HOST,
    path: target,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Lukflix/1.0)',
      'Accept': '*/*'
    }
  };

  const request = https.request(options, (response) => {
    res.writeHead(response.statusCode, {
      'Content-Type': response.headers['content-type'] || 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    });
    response.pipe(res);
  });

  request.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Falha ao conectar com a SuperFlixAPI', detail: err.message }));
  });

  request.setTimeout(30000, () => {
    request.destroy();
    res.writeHead(504, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Tempo esgotado (SuperFlixAPI)' }));
  });

  request.end();
}

// Proxy para o TMDB. A chave fica no servidor (process.env.TMDB_API_KEY),
// então o front-end funciona sem precisar colar a chave no navegador.
function proxyTmdb(req, res, pathname, queryString) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'TMDB_API_KEY não configurada no servidor' }));
  }
  const targetPath = pathname.replace(/^\/api\/tmdb/, '') || '/';
  const prefix = queryString ? '?' + queryString + '&' : '?';
  const target = '/3' + targetPath + prefix + 'api_key=' + encodeURIComponent(apiKey);

  const options = {
    hostname: 'api.themoviedb.org',
    path: target,
    method: 'GET',
    headers: { 'User-Agent': 'Lukflix/1.0', 'Accept': 'application/json' }
  };

  const request = https.request(options, (response) => {
    res.writeHead(response.statusCode, {
      'Content-Type': response.headers['content-type'] || 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    });
    response.pipe(res);
  });

  request.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Falha ao conectar com o TMDB', detail: err.message }));
  });

  request.setTimeout(30000, () => {
    request.destroy();
    res.writeHead(504, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Tempo esgotado (TMDB)' }));
  });

  request.end();
}

function serveStatic(req, res, pathname) {
  let relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let filePath = path.normalize(path.join(PUBLIC_DIR, relative));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Acesso negado');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Página não encontrada');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (pathname.startsWith('/api/superflix')) {
    return proxySuperflix(req, res, pathname, parsed.search ? parsed.search.slice(1) : '');
  }

  if (pathname.startsWith('/api/tmdb')) {
    return proxyTmdb(req, res, pathname, parsed.search ? parsed.search.slice(1) : '');
  }

  if (pathname.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Endpoint inexistente' }));
  }

  return serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log('Lukflix rodando em http://localhost:' + PORT);
});

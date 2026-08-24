# Lukflix

Aplicação web de streaming integrada com a **SuperFlixAPI** (filmes, séries, animes e doramas) e com metadados (pôsteres, sinopse, avaliações) vindos do **TMDB**.

> ⚠️ Projeto apenas para fins educacionais. O Lukflix não hospeda nenhum conteúdo — ele apenas consome APIs públicas de terceiros.

## Como funciona

- **SuperFlixAPI** (`superflixapi.sbs`): fornece as listas de catálogo (IDs do TMDB) e o player embutido via `<iframe>`. Como a API não envia cabeçalhos CORS, o backend (`server.js`) faz proxy das requisições de lista.
- **TMDB** (`api.themoviedb.org`): fornece pôsteres, títulos, sinopse e temporadas. É chamado diretamente do navegador (suporta CORS). Você precisa de uma chave gratuita.

## Pré-requisitos

- Node.js 18+ (nenhuma dependência externa — usa apenas módulos nativos).
- Uma chave gratuita da API do TMDB: https://www.themoviedb.org/settings/api

## Executando localmente

```bash
npm start
# ou
node server.js
```

Acesse http://localhost:3000

1. Clique no ícone **⚙️** (configurações) no canto superior direito.
2. Cole sua chave do TMDB e salve.
3. Navegue pelas abas **Filmes / Séries / Animes / Doramas**, busque e clique em um título para assistir.

Sem a chave do TMDB o catálogo ainda funciona (os cards mostram o ID e o player abre), mas sem pôsteres nem sinopse.

## Estrutura

```
server.js              # Servidor Node (proxy da SuperFlixAPI + arquivos estáticos)
public/
  index.html           # Interface
  css/style.css
  js/config.js         # Configurações e chave TMDB (localStorage)
  js/api.js            # Helpers de requisição (SuperFlix + TMDB)
  js/app.js            # Lógica da UI (catálogo, busca, player)
```

## Endpoints do backend

- `GET /api/superflix/lista?...` — repassa qualquer chamada da SuperFlixAPI (ex.: `/api/superflix/lista?category=animes&format=json`).
- Demais rotas servem os arquivos estáticos de `public/`.

## Deploy

Por ser um app Node sem dependências, pode ser hospedado em Render, Railway, Fly.io, etc.
Defina a variável de ambiente `PORT` se o host exigir.

## Licença

MIT

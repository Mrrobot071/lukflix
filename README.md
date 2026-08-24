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

A chave do TMDB pode ser configurada de dois jeitos:

1. **No servidor (recomendado):** crie um arquivo `.env` com `TMDB_API_KEY=sua_chave`.
   Assim o front-end funciona sem precisar colar a chave no navegador.
2. **No navegador:** clique no ícone **⚙️** e cole a chave (vai para o localStorage).

Navegue pelas abas **Filmes / Séries / Animes / Doramas**, busque e clique em um título para assistir.

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

Por ser um app Node sem dependências, pode ser hospedado em qualquer PaaS.
Defina a variável de ambiente `PORT` se o host exigir.

### Deploy com 1 clique (Render, gratuito, sem cartão)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Mrrobot071/lukflix)

Clique no botão, conecte sua conta GitHub e o Render sobe o site automaticamente.
Também há um `render.yaml` e um `Procfile` prontos para Railway/Heroku.

> Observação: a SuperFlixAPI não envia cabeçalhos CORS, por isso o backend
> faz o proxy das listas. Um site puramente estático (ex.: GitHub Pages) só
> funciona se houver um proxy CORS acessível — o `server.js` já entrega isso.

## Licença

MIT

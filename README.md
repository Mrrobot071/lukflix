# Lukflix

Aplicação web de streaming integrada **apenas com a SuperFlixAPI** (filmes, séries, animes e doramas). Sem dependências externas além do próprio catálogo da SuperFlixAPI.

> ⚠️ Projeto apenas para fins educacionais. O Lukflix não hospeda nenhum conteúdo — ele apenas consome a SuperFlixAPI (terceiros).

## Como funciona

- **SuperFlixAPI** (`superflixapi.sbs`): fornece as listas de catálogo por gênero e a busca (retornam IDs do TMDB) e o player embutido via `<iframe>`. Como a API não envia cabeçalhos CORS, o backend (`server.js`) faz proxy de todas as requisições.
- **Sem TMDB**: o app não depende de nenhuma chave de API externa. Os cards exibem o ID e o player abre direto na SuperFlixAPI.

## Pré-requisitos

- Node.js 18+ (nenhuma dependência externa — usa apenas módulos nativos).

## Executando localmente

```bash
npm start
# ou
node server.js
```

Acesse http://localhost:3000

Navegue pelas abas **Filmes / Séries / Animes / Doramas**, busque um termo e clique em um card para abrir o player.

## Observação sobre o player

A SuperFlixAPI protege o player com uma verificação (Cloudflare/Turnstile). Se aparecer uma tela de "Validação segura", use o botão **🔑** para abrir o login da SuperFlixAPI em outra aba — isso costuma liberar o player nesta sessão.

## Estrutura

```
server.js              # Servidor Node (proxy da SuperFlixAPI + arquivos estáticos)
public/
  index.html           # Interface
  css/style.css
  js/config.js         # Configurações (proxy SuperFlixAPI)
  js/api.js            # Helpers de requisição (SuperFlixAPI)
  js/app.js            # Lógica da UI (catálogo, busca, player)
```

## Endpoints do backend

- `GET /api/superflix/lista?...` — repassa qualquer chamada da SuperFlixAPI (ex.: `/api/superflix/lista?category=filme&type=generos&format=json`).
- Demais rotas servem os arquivos estáticos de `public/`.

## Deploy

Por ser um app Node sem dependências, pode ser hospedado em qualquer PaaS (Render, Railway, Heroku). Defina a variável de ambiente `PORT` se o host exigir. O `render.yaml` e o `Procfile` já estão prontos.

## Licença

MIT

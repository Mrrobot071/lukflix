# Deploy automático (GitHub → Render)

O projeto faz auto-deploy no Render a cada `push` para `master`.

## Opção A — GitHub Actions (já incluso)

1. No Render, abra o serviço **lukflix** → Settings → **Deploy Hook** → crie um hook e copie a URL.
2. No GitHub, em `Mrrobot071/lukflix` → Settings → Secrets and variables → Actions → **New repository secret**:
   - Name: `RENDER_DEPLOY_HOOK`
   - Secret: a URL do hook copiada.
3. Pronto. Cada push dispara o workflow `.github/workflows/deploy.yml`, que faz o deploy.

## Opção B — Auto-deploy nativo do Render (mais simples)

1. No Render, crie o Web Service a partir deste repositório GitHub (`Mrrobot071/lukflix`).
2. O `render.yaml` já configura tudo (runtime node, `node server.js`, plano free).
3. Marque **Auto-Deploy** (ligado por padrão). Pronto — cada push faz deploy sozinho.

> Dica: use apenas uma das opções para evitar deploys duplicados.

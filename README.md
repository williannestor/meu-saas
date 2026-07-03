# MEUS-ARQUIVOS

Micro SaaS de atendimento WhatsApp com Evolution API, CRM e endpoints para n8n.

## O que este projeto faz
- Recebe mensagens do WhatsApp via Evolution API e sincroniza com o CRM.
- Mantém leads, conversas e estágios de funil com multi-tenancy leve.
- Oferece frontend simples para atendimento e gestão de pipeline.
- Expõe endpoints seguros para automações via n8n.
- Pode rodar 100% local com Docker: app + Postgres + Evolution API.

## Estrutura
```
server.js           # Servidor HTTP, rotas, auth, webhook, CORS, static
src/
  config/           # Variáveis e defaults centralizados
  middleware/        # CORS, headers, helpers de auth e logger
  repositories/     # Acesso JSON local e Supabase
  services/         # Regras de domínio e normalização
  controllers/      # Orquestração simples
  routes/           # Handlers HTTP e wiring por rota
  models/           # Factories de entidades com workspaceId
  db/               # Runner de migrations
  frontend/         # Helpers de DOM, estado e UI
migrations/         # Schemas e alterações versionadas para Postgres/Supabase
test/               # Testes de health/servidor
index.html          # Frontend principal
app.js              # Frontend app
scripts/            # Instaladores Bash e PowerShell para cliente
.env.example        # Variáveis obrigatórias e seguras
CLIENTE_README.md   # Guia do cliente
docker-compose.yml  # App + DB + Evolution API
Dockerfile          # Build do app
README.md           # Este arquivo
.gitignore          # Exclusões padronizadas
```

## Requisitos
- Node.js >= 18
- Docker e Docker Compose (recomendado para instalação cliente)
- Postgres/Supabase, se for usar banco real

## Configuração rápida
1. `cp .env.example .env`
2. Ajuste as variáveis em `.env`
3. `npm install`
4. Aplique o schema em `migrations` no Postgres
5. `npm start`
6. Acesse http://localhost:3000

## Variáveis
- `PORT`, `NODE_ENV`
- `APP_NAME`, `APP_URL`
- `APP_API_KEY`, `JWT_SECRET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `STORAGE`: `local` ou `supabase`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `EVOLUTION_API_URL`, `EVOLUTION_INSTANCE`, `EVOLUTION_API_KEY`
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`

## Docker
- Suba toda a stack local: `docker compose up --build`
- Inclui app, Postgres e Evolution API pronta para uso

## Instalação cliente
- Consulte `CLIENTE_README.md`
- Scripts disponíveis em `scripts/`:
  - `install-client.sh`
  - `install-client.ps1`
  - `package-template.sh`
  - `package-template.ps1`

## Testes
- `npm test`

## Segurança
- CORS por origem permitida
- Headers `X-XSS-Protection`, `X-Content-Type-Options`, `Referrer-Policy`
- Cookie de sessão com cookie `Secure` em produção, `HttpOnly`, `SameSite=Lax`
- Sem segredos hardcoded; todos em `.env`

## Notas
- Multi-tenancy simples via header `x-workspace-id`. Sem header, usa `"default"`.
- Persistência padrão em arquivo JSON local.
- Supabase é opcional; quando configurado, vira a fonte principal.
- Logger estruturado com `requestId` por requisição.

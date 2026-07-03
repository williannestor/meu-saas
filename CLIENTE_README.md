# CLIENTE_README.md
# MEUS-ARQUIVOS - Instalacao cliente

Copie, configure e rode.

## Opcao A: Docker (recomendado)

Requisitos: Docker e Docker Compose instalados.

1. Extraia o ZIP.
2. Preencha `.env` com:
   - `APP_NAME`
   - `APP_API_KEY`
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `EVOLUTION_API_KEY`
3. Rode: `docker compose up -d`
4. Acompanhe subida dos containers com `docker compose ps`
5. Acesse: `http://localhost:3000`

## Opcao B: Node local

Requisitos: Node.js >= 18.

1. Extraia o ZIP.
2. Copie `.env.example` para `.env`.
3. Preencha `.env`.
4. Instale dependencias: `npm install`
5. Rode: `npm start`
6. Acesse: `http://localhost:3000`

## Observacoes

- A Evolution API local roda na porta 8080 automaticamente no Docker.
- Para ambiente local sem Docker, instale a Evolution API separadamente e aponte `EVOLUTION_API_URL`.

# Instalacao no cliente

Fluxo 1: copiar projeto ja posteriormente sanitizado com a marca.
Fluxo 2: rodar `scripts/package-template.sh <pasta-destino> <marca>`.

Requisitos:
- Node.js >= 18
- 1 porta HTTP aberta, por padrao 3000/tcp
- Opcional: Supabase

Passos:
1. `cp .env.example .env`
2. Ajustar variaveis em `.env`
3. `npm install`
4. `npm start`
5. Abrir `http://<host>:3000`

Variaveis obrigatorias:
- `APP_API_KEY`
- `JWT_SECRET`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- `EVOLUTION_API_URL`
- `EVOLUTION_INSTANCE`
- `EVOLUTION_API_KEY`
- Opcional: `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`

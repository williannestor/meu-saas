# MEUS-ARQUIVOS - Pacote cliente

Copie, configure e rode. Sem complicacao.

## Inicio rapido

1. Extraia o ZIP em uma pasta limpa.
2. Copie `.env.example` para `.env`.
3. Preencha `.env` com:
   - `APP_NAME`
   - `PORT`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `EVOLUTION_API_KEY`
4. Instale dependencias:
   - Bash: `npm install`
   - PowerShell: `powershell -ExecutionPolicy Bypass -File .\scripts\install-client.ps1 -Destination . -Brand MARCA`
5. Rode: `npm start`
6. Acesse: `http://localhost:3000`

## Requisitos

- Node.js >= 18
- Porta 3000 livre

## Observacao

Inclui estrutura pronta para Supabase/Posters. Sem dados sensiveis.

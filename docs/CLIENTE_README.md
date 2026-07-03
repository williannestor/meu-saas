# MEUS-ARQUIVOS - Template cliente

Copie, configure e rode.

## Instalacao rapida

1. Extraia o ZIP em `C:\MEUS-ARQUIVOS` ou outro destino.
2. Renomeie `.env.example` para `.env`.
3. Edite `.env` com os dados do cliente: `APP_NAME`, `PORT`, `SUPABASE_URL`, `SUPABASE_KEY`, `EVOLUTION_API_KEY` etc.
4. Instale dependencias:
   - Bash/Git Bash: `npm install`
   - Windows puro: `powershell -ExecutionPolicy Bypass -File .\scripts\install-client.ps1 -Destination . -Brand MARCA`
5. Rode: `npm start`
6. Abra: `http://localhost:3000`

## Suporte

Forneca este template + o `.env` preenchido. Nenhum
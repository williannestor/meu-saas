#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-.}"
BRAND="${2:-}"

echo "[install] destino: ${APP_DIR}"
if [ -d "${APP_DIR}" ]; then
  read -r -p "Diretorio destino existe. Sobrescrever? [s/N] " _confirm
  if [[ "${_confirm}" != [sS] ]]; then
    echo "cancelado"; exit 1
  fi
  rm -rf "${APP_DIR}"
fi
mkdir -p "${APP_DIR}"
cp -R ./* "${APP_DIR}/"
cd "${APP_DIR}/"
if [ -n "${BRAND}" ]; then
  find . -type f \( -name "*.json" -o -name "*.md" -o -name "*.js" -o -name "*.html" \) ! -path "./node_modules/*" ! -path "./.git/*" -print0 | xargs -0 sed -i.tmp "s/MEUS-ARQUIVOS/${BRAND}/g"
  rm -f ./*.tmp
fi

echo "[install] package.json nome: $(node -p "require('./package.json').name")"
npm install --no-audit --no-fund

if [ -f ".env.example" ]; then
  cp -f .env.example .env
  echo "[install] .env criado"
fi

echo "[install] iniciando healthcheck..."
( npm start & ) >/tmp/meus-arquivos-start.log 2>&1
sleep 2
if curl -fsS http://127.0.0.1:3000/healthz >/dev/null; then
  echo "[install] healthcheck OK"; kill $! || true
else
  echo "[install] healthcheck FAILED"
  tail -n +1 /tmp/meus-arquivos-start.log || true
  kill $! || true
  exit 1
fi

cat << 'EOF'
Instalacao concluida.
Proximo:
 1) edite o .env com os dados do cliente
 2) `npm start`
EOF

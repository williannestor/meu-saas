#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-/tmp/meus-arquivos-client}"
BRAND="${2:-}"

if [ -z "${BRAND}" ]; then
  echo "uso: $0 <caminho-destino> <marca-do-cliente>"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

bash "${ROOT}/scripts/install-client.sh" "${APP_DIR}" "${BRAND}"

echo "[template] criando pacote..."
tar -czf "${ROOT}/dist/meus-arquivos-template.tar.gz" -C "${ROOT}" .
echo "[template] criado em: dist/meus-arquivos-template.tar.gz"

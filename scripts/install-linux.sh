#!/usr/bin/env bash
set -euo pipefail

REPO="${SONG_TRANSLATOR_REPO:-seu-usuario/song-translator}"
PACKAGE_URL="${SONG_TRANSLATOR_PACKAGE_URL:-https://github.com/${REPO}/releases/latest/download/song-translator.tgz}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20+ e necessario antes de instalar." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm e necessario antes de instalar." >&2
  exit 1
fi

npm install -g "$PACKAGE_URL"
song-translator

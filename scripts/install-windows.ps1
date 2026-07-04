$ErrorActionPreference = "Stop"

$Repo = if ($env:SONG_TRANSLATOR_REPO) { $env:SONG_TRANSLATOR_REPO } else { "seu-usuario/song-translator" }
$PackageUrl = if ($env:SONG_TRANSLATOR_PACKAGE_URL) { $env:SONG_TRANSLATOR_PACKAGE_URL } else { "https://github.com/$Repo/releases/latest/download/song-translator.tgz" }

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js 20+ e necessario antes de instalar."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "npm e necessario antes de instalar."
}

npm install -g $PackageUrl
song-translator

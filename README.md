# Song Translator

CLI em React/Ink para extrair letras japonesas, gerar uma versao em romaji e traduzir para portugues brasileiro usando a API da OpenAI. Ao final, o programa cria dois PDFs com fonte grande e layout centralizado, pensado para impressao.

## Recursos

- Interface CLI amigavel feita com React (Ink) e prompts interativos.
- Configuracao de chave OpenAI salva em `~/.song-translator/.env`.
- Opcao para atualizar a CLI instalada usando a ultima release do GitHub.
- Extracao de letras do Uta-Net por ID ou URL, por exemplo `386588` ou `https://www.uta-net.com/song/386588/`.
- Entrada manual de letra, titulo e artista.
- Romanizacao Hepburn otimizada para japones.
- Geracao de dois PDFs: `*-romaji.pdf` e `*-portugues.pdf`.

## Instalacao sem registry npm

O pacote e publicado pelo GitHub Actions como asset da release chamado `song-translator.tgz`. Os instaladores baixam sempre a ultima release por padrao.

Por padrao, os scripts usam o repositorio `gustavohiroaki/song-translator`. Para forks, defina a variavel `SONG_TRANSLATOR_REPO` ao instalar.

### Windows

1. Instale Node.js 24 ou superior.
2. Abra o PowerShell e rode:

```powershell
$env:SONG_TRANSLATOR_REPO="gustavohiroaki/song-translator"
iwr -useb https://raw.githubusercontent.com/gustavohiroaki/song-translator/main/scripts/install-windows.ps1 | iex
```

### Linux

1. Instale Node.js 24 ou superior.
2. Rode:

```bash
export SONG_TRANSLATOR_REPO="gustavohiroaki/song-translator"
curl -fsSL https://raw.githubusercontent.com/gustavohiroaki/song-translator/main/scripts/install-linux.sh | bash
```

### Instalacao manual pela release

```bash
npm install -g https://github.com/gustavohiroaki/song-translator/releases/latest/download/song-translator.tgz
song-translator
```

## Publicacao de release pelo CI

O workflow `.github/workflows/release.yml` roda em tags `v*` ou manualmente. Ele instala dependencias, executa `npm run build`, gera um tarball com `npm pack`, renomeia o asset para `song-translator.tgz` e publica/atualiza a GitHub Release.

Para publicar uma versao:

```bash
npm version patch
git push --follow-tags
```

Ou crie uma tag manualmente:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Desenvolvimento local

```bash
npm install
npm run build
npm run dev
```

## Uso

Rode:

```bash
song-translator
```

No primeiro uso, a CLI perguntara a chave da OpenAI e armazenara em `~/.song-translator/.env`. No menu principal voce pode atualizar essa chave, traduzir uma musica ou tentar atualizar a CLI instalada usando a ultima release do GitHub.

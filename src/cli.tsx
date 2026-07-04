#!/usr/bin/env node
import {input, password, select, confirm} from '@inquirer/prompts';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {getConfigPath, getOpenAiKey, saveOpenAiKey} from './config.js';
import {fetchUtaNetSong, normalizeLyricsInput} from './utaNet.js';
import {translateSong} from './openaiTranslator.js';
import {generatePdfs, getDefaultOutputDir} from './pdf.js';
import type {SongInput} from './types.js';

async function configureKey(force = false) {
  const current = await getOpenAiKey();
  if (current && !force) return current;
  const key = await password({message: current ? 'Nova chave da OpenAI' : 'Chave da OpenAI', mask: '*', validate: (v: string) => v.trim().startsWith('sk-') || 'Informe uma chave OpenAI valida.'});
  await saveOpenAiKey(key);
  console.log(`Chave salva em ${getConfigPath()}`);
  return key;
}

function getInstallPackageUrl() {
  const repo = process.env.SONG_TRANSLATOR_REPO ?? 'gustavohiroaki/song-translator';
  return process.env.SONG_TRANSLATOR_PACKAGE_URL ?? `https://github.com/${repo}/releases/latest/download/song-translator.tgz`;
}

function updateCli() {
  const packageUrl = getInstallPackageUrl();
  console.log(`Atualizando a CLI via release: ${packageUrl}`);
  execFileSync('npm', ['install', '-g', packageUrl], {stdio: 'inherit'});
}

function openTemporaryEditor(initialContent = '') {
  const tempDir = mkdtempSync(join(tmpdir(), 'song-translator-'));
  const tempFile = join(tempDir, 'lyrics.txt');
  const template = [
    '# Cole a letra abaixo.',
    '# Linhas iniciadas com # serao ignoradas.',
    '',
    initialContent,
  ].join('\n');
  writeFileSync(tempFile, template, 'utf8');

  const editor = process.env.VISUAL || process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'vi');
  const result = spawnSync(editor, [tempFile], {stdio: 'inherit'});
  if (result.error) {
    rmSync(tempDir, {recursive: true, force: true});
    throw new Error(`Nao foi possivel abrir o editor temporario com "${editor}".`);
  }
  if (typeof result.status === 'number' && result.status !== 0) {
    rmSync(tempDir, {recursive: true, force: true});
    throw new Error(`O editor temporario foi encerrado com codigo ${result.status}.`);
  }

  const content = readFileSync(tempFile, 'utf8')
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n')
    .trim();
  rmSync(tempDir, {recursive: true, force: true});
  return content;
}

async function collectSong(): Promise<SongInput> {
  const mode = await select({message: 'Como deseja informar a musica?', choices: [
    {name: 'Extrair do Uta-Net por ID ou URL', value: 'uta'},
    {name: 'Abrir editor temporario para colar a letra', value: 'manual'},
  ]});
  if (mode === 'uta') {
    const id = await input({message: 'ID ou URL do Uta-Net', default: '386588', validate: (v: string) => v.trim().length > 0 || 'Informe o ID ou URL.'});
    return fetchUtaNetSong(id);
  }
  const title = await input({message: 'Titulo da musica', validate: (v: string) => v.trim().length > 0 || 'Informe o titulo.'});
  const artist = await input({message: 'Artista (opcional)'});
  console.log('Abrindo editor temporario para a letra.');
  const lyrics = normalizeLyricsInput(openTemporaryEditor());
  if (!lyrics) throw new Error('Letra manual vazia.');
  return {title, artist, lyrics};
}

async function main() {
  console.log('Song Translator CLI');
  console.log('Japones → Romaji + Portugues em PDF');
  const action = await select({message: 'O que deseja fazer?', choices: [
    {name: 'Traduzir musica e gerar PDFs', value: 'translate'},
    {name: 'Configurar/atualizar chave OpenAI', value: 'config'},
    {name: 'Atualizar a CLI instalada', value: 'update'},
  ]});
  if (action === 'config') { await configureKey(true); return; }
  if (action === 'update') { updateCli(); return; }
  const apiKey = await configureKey(false);
  const song = await collectSong();
  console.log(`Traduzindo "${song.title}"...`);
  const result = await translateSong(song, apiKey);
  const outputDir = await input({message: 'Pasta de saida', default: getDefaultOutputDir()});
  const paths = await generatePdfs(result, outputDir);
  console.log(`PDF romaji: ${paths.romajiPath}`);
  console.log(`PDF portugues: ${paths.portuguesePath}`);
  if (await confirm({message: 'Deseja tentar atualizar a CLI agora?', default: false})) updateCli();
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

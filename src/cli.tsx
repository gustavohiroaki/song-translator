#!/usr/bin/env node
import React from 'react';
import {render, Box, Text} from 'ink';
import Gradient from 'ink-gradient';
import {input, password, select, confirm} from '@inquirer/prompts';
import {execFileSync} from 'node:child_process';
import {getConfigPath, getOpenAiKey, saveOpenAiKey} from './config.js';
import {fetchUtaNetSong} from './utaNet.js';
import {translateSong} from './openaiTranslator.js';
import {generatePdfs} from './pdf.js';
import type {SongInput} from './types.js';

function Header() {
  return <Box flexDirection="column" marginBottom={1}>
    <Gradient name="summer"><Text bold>Song Translator CLI</Text></Gradient>
    <Text>Japones → Romaji + Portugues em PDF</Text>
  </Box>;
}

async function configureKey(force = false) {
  const current = await getOpenAiKey();
  if (current && !force) return current;
  const key = await password({message: current ? 'Nova chave da OpenAI' : 'Chave da OpenAI', mask: '*', validate: (v: string) => v.trim().startsWith('sk-') || 'Informe uma chave OpenAI valida.'});
  await saveOpenAiKey(key);
  console.log(`Chave salva em ${getConfigPath()}`);
  return key;
}

function getInstallPackageUrl() {
  const repo = process.env.SONG_TRANSLATOR_REPO ?? 'seu-usuario/song-translator';
  return process.env.SONG_TRANSLATOR_PACKAGE_URL ?? `https://github.com/${repo}/releases/latest/download/song-translator.tgz`;
}

function updateCli() {
  const packageUrl = getInstallPackageUrl();
  console.log(`Atualizando a CLI via release: ${packageUrl}`);
  execFileSync('npm', ['install', '-g', packageUrl], {stdio: 'inherit'});
}

async function collectSong(): Promise<SongInput> {
  const mode = await select({message: 'Como deseja informar a musica?', choices: [
    {name: 'Extrair do Uta-Net por ID ou URL', value: 'uta'},
    {name: 'Colar letra manualmente', value: 'manual'},
  ]});
  if (mode === 'uta') {
    const id = await input({message: 'ID ou URL do Uta-Net', default: '386588', validate: (v: string) => v.trim().length > 0 || 'Informe o ID ou URL.'});
    return fetchUtaNetSong(id);
  }
  const title = await input({message: 'Titulo da musica', validate: (v: string) => v.trim().length > 0 || 'Informe o titulo.'});
  const artist = await input({message: 'Artista (opcional)'});
  console.log('Cole a letra. Finalize com uma linha contendo apenas EOF.');
  const chunks: string[] = [];
  for await (const chunk of process.stdin) {
    const text = String(chunk);
    if (text.includes('\nEOF')) { chunks.push(text.split('\nEOF')[0]); break; }
    chunks.push(text);
  }
  const lyrics = chunks.join('').trim();
  if (!lyrics) throw new Error('Letra manual vazia.');
  return {title, artist, lyrics};
}

async function main() {
  render(<Header />).unmount();
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
  const outputDir = await input({message: 'Pasta de saida', default: 'output'});
  const paths = await generatePdfs(result, outputDir);
  console.log(`PDF romaji: ${paths.romajiPath}`);
  console.log(`PDF portugues: ${paths.portuguesePath}`);
  if (await confirm({message: 'Deseja tentar atualizar a CLI agora?', default: false})) updateCli();
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

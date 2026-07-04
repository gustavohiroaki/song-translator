import OpenAI from 'openai';
import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import type {SongInput, TranslationResult} from './types.js';

let kuroshiro: any;
let kuroshiroReady = false;
async function romanize(text: string) {
  kuroshiro ??= new Kuroshiro();
  if (!kuroshiroReady) {
    await kuroshiro.init(new KuromojiAnalyzer());
    kuroshiroReady = true;
  }
  return kuroshiro.convert(text, {to: 'romaji', mode: 'spaced', romajiSystem: 'hepburn'});
}

export async function translateSong(song: SongInput, apiKey: string): Promise<TranslationResult> {
  const client = new OpenAI({apiKey});
  const lines = song.lyrics.split(/\r?\n/);
  const nonEmpty = lines.filter(line => line.trim().length > 0);
  const romajiNonEmpty = await Promise.all(nonEmpty.map(line => romanize(line)));
  const prompt = `Traduza do japones para portugues brasileiro uma letra de musica.\nMantenha exatamente uma traducao por linha, preservando a ordem e a quantidade de linhas nao vazias.\nUse linguagem natural, poetica e adequada para impressao.\nResponda somente JSON valido no formato {"titlePt":"...","titleRomaji":"...","artist":"...","lines":["..."]}.\nTitulo: ${song.title}\nArtista: ${song.artist ?? ''}\nLinhas japonesas:\n${JSON.stringify(nonEmpty)}`;
  const completion = await client.chat.completions.create({model: 'gpt-4o-mini', temperature: 0.3, messages: [{role: 'user', content: prompt}], response_format: {type: 'json_object'}});
  const parsed = JSON.parse(completion.choices[0]?.message.content ?? '{}') as {titlePt?: string; titleRomaji?: string; artist?: string; lines?: string[]};
  const ptNonEmpty = Array.isArray(parsed.lines) ? parsed.lines : [];
  let i = 0;
  let j = 0;
  return {
    titlePt: parsed.titlePt || song.title,
    titleRomaji: parsed.titleRomaji || await romanize(song.title),
    artist: parsed.artist || song.artist || '',
    romajiLines: lines.map(line => line.trim() ? (romajiNonEmpty[i++] ?? '') : ''),
    portugueseLines: lines.map(line => line.trim() ? (ptNonEmpty[j++] ?? line) : ''),
  };
}

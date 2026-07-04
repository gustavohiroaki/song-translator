import * as cheerio from 'cheerio';
import type {SongInput} from './types.js';

export function buildUtaNetUrl(idOrUrl: string) {
  if (/^https?:\/\//i.test(idOrUrl)) return idOrUrl;
  return `https://www.uta-net.com/song/${idOrUrl.replace(/\D/g, '')}/`;
}

function buildHeaders(url: string, cookie?: string) {
  return {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'accept-language': 'ja,en-US;q=0.9,en;q=0.8,pt-BR;q=0.7,pt;q=0.6',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'upgrade-insecure-requests': '1',
    'referer': 'https://www.uta-net.com/',
    ...(cookie ? {cookie} : {}),
  };
}

function extractCookies(response: Response) {
  const getSetCookie = (response.headers as Headers & {getSetCookie?: () => string[]}).getSetCookie;
  const cookies = typeof getSetCookie === 'function'
    ? getSetCookie.call(response.headers)
    : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie') as string] : []);
  return cookies
    .map((value) => value.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

function firstText($: cheerio.CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const text = $(selector).first().text().trim();
    if (text) return text;
  }
  return '';
}

function normalizeLyricsFromHtml(html: string) {
  return cheerio.load(`<div>${html.replace(/<br\s*\/?\s*>/gi, '\n')}</div>`)('div').text()
    .split('\n')
    .map((line: string) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function fetchUtaNetSong(idOrUrl: string): Promise<SongInput> {
  const url = buildUtaNetUrl(idOrUrl);
  let response = await fetch(url, {headers: buildHeaders(url)});
  if (response.status === 403) {
    const cookie = extractCookies(response);
    if (cookie) {
      response = await fetch(url, {headers: buildHeaders(url, cookie)});
    }
  }
  if (!response.ok) throw new Error(`Nao foi possivel acessar Uta-Net (${response.status})`);
  const html = await response.text();
  const $ = cheerio.load(html);

  const title = firstText($, [
    'h2',
    'h3 + div h2',
    'div[class*="song"] h2',
    'div[class*="detail"] h2',
  ]) || $('title').text().split('|')[0].trim();

  const artist = firstText($, [
    'h3 a span',
    '[itemprop="byArtist"]',
    '.artist_name',
    'h3',
  ]);

  const lyricHtml = [
    '#kashi_area',
    'div#kashi_area',
    'div[class*="kashi"]',
    'div[class*="lyric"]',
    'div[class*="lyrics"]',
  ]
    .map((selector) => $(selector).first().html())
    .find((value) => Boolean(value));

  if (!lyricHtml) throw new Error('Letra nao encontrada no HTML do Uta-Net.');
  const lyrics = normalizeLyricsFromHtml(lyricHtml);
  return {title, artist, lyrics, source: url};
}

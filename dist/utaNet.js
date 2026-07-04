import * as cheerio from 'cheerio';
export function buildUtaNetUrl(idOrUrl) {
    if (/^https?:\/\//i.test(idOrUrl))
        return idOrUrl;
    return `https://www.uta-net.com/song/${idOrUrl.replace(/\D/g, '')}/`;
}
export function normalizeLyricsFromHtml(html) {
    return cheerio.load(`<div>${html.replace(/<br\s*\/?\s*>/gi, '\n')}</div>`)('div').text()
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
export function normalizeLyricsInput(input) {
    const trimmed = input.trim();
    if (/<[a-z!/][^>]*>/i.test(trimmed))
        return normalizeLyricsFromHtml(trimmed);
    return trimmed;
}
export async function fetchUtaNetSong(idOrUrl) {
    const url = buildUtaNetUrl(idOrUrl);
    const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 song-translator-cli' } });
    if (!response.ok)
        throw new Error(`Nao foi possivel acessar Uta-Net (${response.status})`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('h2').first().text().trim() || $('title').text().split('|')[0].trim();
    const artist = $('[itemprop="byArtist"], .artist_name, h3').first().text().trim();
    const lyricHtml = $('#kashi_area').html();
    if (!lyricHtml)
        throw new Error('Letra nao encontrada no HTML do Uta-Net.');
    const lyrics = normalizeLyricsFromHtml(lyricHtml);
    return { title, artist, lyrics, source: url };
}

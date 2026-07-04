import OpenAI from 'openai';
import type {SongInput, TranslationResult} from './types.js';

export async function translateSong(song: SongInput, apiKey: string): Promise<TranslationResult> {
  const client = new OpenAI({apiKey});
  const lines = song.lyrics.split(/\r?\n/);
  const nonEmpty = lines.filter(line => line.trim().length > 0);
  const prompt = `Voce vai processar a letra japonesa de uma musica para impressao.

Regras:
- O texto de entrada ja foi extraido de HTML quando necessario. Ignore qualquer vestigio de markup, entidades HTML ou lixo textual residual se aparecer.
- Gere romaji e traducao para portugues brasileiro usando exatamente a mesma ordem e a mesma quantidade de linhas nao vazias recebidas.
- Nao junte linhas, nao separe linhas e nao invente texto ausente.
- Use romaji em sistema Hepburn, legivel e natural.
- Use traducao natural, poetica e adequada para impressao.
- Se algum trecho estiver corrompido, faca a melhor reconstrucao prudente a partir do contexto.
- Responda somente JSON valido no formato {"titlePt":"...","titleRomaji":"...","artist":"...","romajiLines":["..."],"portugueseLines":["..."]}.

Titulo: ${song.title}
Artista: ${song.artist ?? ''}
Linhas japonesas:
${JSON.stringify(nonEmpty)}`;
  const completion = await client.chat.completions.create({model: 'gpt-4o-mini', temperature: 0.3, messages: [{role: 'user', content: prompt}], response_format: {type: 'json_object'}});
  const parsed = JSON.parse(completion.choices[0]?.message.content ?? '{}') as {
    titlePt?: string;
    titleRomaji?: string;
    artist?: string;
    romajiLines?: string[];
    portugueseLines?: string[];
  };
  const romajiNonEmpty = Array.isArray(parsed.romajiLines) ? parsed.romajiLines : [];
  const ptNonEmpty = Array.isArray(parsed.portugueseLines) ? parsed.portugueseLines : [];
  let i = 0;
  let j = 0;
  return {
    titlePt: parsed.titlePt || song.title,
    titleRomaji: parsed.titleRomaji || song.title,
    artist: parsed.artist || song.artist || '',
    romajiLines: lines.map(line => line.trim() ? (romajiNonEmpty[i++] ?? '') : ''),
    portugueseLines: lines.map(line => line.trim() ? (ptNonEmpty[j++] ?? line) : ''),
  };
}

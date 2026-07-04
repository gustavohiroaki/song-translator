import PDFDocument from 'pdfkit';
import {createWriteStream} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import type {TranslationResult} from './types.js';

function safeName(value: string) { return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'musica'; }

async function writePdf(filePath: string, title: string, artist: string, lines: string[]) {
  await mkdir(path.dirname(filePath), {recursive: true});
  const doc = new PDFDocument({size: 'A4', margin: 54});
  doc.pipe(createWriteStream(filePath));
  doc.font('Helvetica').fontSize(24).text(title, {align: 'center'});
  if (artist) doc.moveDown(0.3).fontSize(16).text(artist, {align: 'center'});
  doc.moveDown(2);
  doc.fontSize(16);
  for (const line of lines) {
    if (!line.trim()) { doc.moveDown(1); continue; }
    doc.text(line, {align: 'center', lineGap: 8});
    doc.moveDown(0.5);
  }
  doc.end();
  await new Promise<void>((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
  });
}

export async function generatePdfs(result: TranslationResult, outputDir = 'output') {
  const base = safeName(result.titleRomaji || result.titlePt);
  const romajiPath = path.resolve(outputDir, `${base}-romaji.pdf`);
  const portuguesePath = path.resolve(outputDir, `${base}-portugues.pdf`);
  await writePdf(romajiPath, result.titleRomaji, result.artist, result.romajiLines);
  await writePdf(portuguesePath, result.titlePt, result.artist, result.portugueseLines);
  return {romajiPath, portuguesePath};
}

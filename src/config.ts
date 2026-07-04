import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';
import {config as loadDotenv} from 'dotenv';

const appDir = path.join(homedir(), '.song-translator');
const envPath = path.join(appDir, '.env');

export async function ensureConfigDir() { await mkdir(appDir, {recursive: true}); }
export function getConfigPath() { return envPath; }

export async function getOpenAiKey() {
  loadDotenv({path: envPath, quiet: true});
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  try {
    const env = await readFile(envPath, 'utf8');
    return env.match(/^OPENAI_API_KEY=(.*)$/m)?.[1]?.trim();
  } catch { return undefined; }
}

export async function saveOpenAiKey(key: string) {
  await ensureConfigDir();
  await writeFile(envPath, `OPENAI_API_KEY=${key.trim()}\n`, {mode: 0o600});
  process.env.OPENAI_API_KEY = key.trim();
}

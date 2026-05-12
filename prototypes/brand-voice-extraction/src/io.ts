import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Project root, derived from this file's location. All paths in this
 * module are relative to the prototype root so the scripts work from any
 * CWD.
 */
export const PROTOTYPE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Read every .txt file in samples/<company>/. Returns the file contents
 * in stable filename order — same input order = same prompt = comparable
 * runs.
 */
export function readSamples(company: string): { filename: string; text: string }[] {
  const dir = join(PROTOTYPE_ROOT, 'samples', company);
  if (!existsSync(dir)) {
    throw new Error(
      `samples/${company}/ does not exist. Create it and drop .txt files inside before running.`,
    );
  }
  const files = readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.txt'))
    .sort();

  if (files.length === 0) {
    throw new Error(
      `No .txt files found in samples/${company}/. Drop 10–15 real Japanese press releases (plain text) into that folder.`,
    );
  }

  return files.map((filename) => ({
    filename,
    text: readFileSync(join(dir, filename), 'utf-8'),
  }));
}

/**
 * Format: 2026-05-11T1430-<tag>. JST-ish local time (Date.toISOString slice).
 * The tag is required so a glance at the folder name says what changed
 * since the last run ("baseline-prompt", "added-falsifiability-rule",
 * "company-a-only", etc.).
 */
export function buildRunFolderName(tag: string): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const stamp =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}${pad(now.getMinutes())}`;
  const safeTag = tag.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `${stamp}-${safeTag}`;
}

/**
 * Ensure outputs/runs/<folder>/ exists and return its absolute path.
 */
export function ensureRunFolder(folderName: string): string {
  const path = join(PROTOTYPE_ROOT, 'outputs', 'runs', folderName);
  mkdirSync(path, { recursive: true });
  return path;
}

export function writeJson(runFolder: string, filename: string, data: unknown): void {
  writeFileSync(join(runFolder, filename), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function writeText(runFolder: string, filename: string, content: string): void {
  writeFileSync(join(runFolder, filename), content, 'utf-8');
}

export function readBrief(briefPath: string): unknown {
  const abs = resolve(briefPath);
  return JSON.parse(readFileSync(abs, 'utf-8'));
}

export function readProfile(profilePath: string): unknown {
  const abs = resolve(profilePath);
  return JSON.parse(readFileSync(abs, 'utf-8'));
}

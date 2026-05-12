/**
 * Procurement helper for Phase 0.
 *
 * Reads `samples/<slug>/manifest.json`, fetches each listed press-release
 * URL with a browser User-Agent (some pharma sites 403 the default
 * Node UA), extracts the article body using a per-company selector
 * config, strips HTML chrome, and writes numbered .txt files into
 * `samples/<slug>/`.
 *
 * Run after editing a manifest:
 *   tsx src/fetch-samples.ts <slug>
 *
 * This is a one-shot procurement tool — once the sample files exist,
 * extract-voice.ts reads them and never touches this script. It's safe
 * to delete after Phase 0.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { PROTOTYPE_ROOT } from './io.js';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface SiteConfig {
  /** Matches the opening tag of the article container. */
  openTag: RegExp;
  /** Closing tag string (case-insensitive). */
  closeTag: string;
  /** Inline-class substrings whose enclosing div is dropped before tag-stripping. */
  dropClasses?: string[];
  /** Substrings; if found, the body is truncated AT the first occurrence (the marker and everything after is removed). */
  tailMarkers?: string[];
  /** Substrings; if found, the body is truncated UP TO and including the marker (marker + everything before is removed). Useful for stripping breadcrumb-like leading text. */
  headMarkers?: string[];
  /** Regex replacements applied AFTER tag-strip and whitespace-normalize. Used for orphan chrome tokens. */
  postReplace?: Array<{ pattern: RegExp; replacement: string }>;
}

const SITE_CONFIGS: Record<string, SiteConfig> = {
  'astrazeneca-jp': {
    openTag: /<article\b[^>]*>/i,
    closeTag: '</article>',
    tailMarkers: ['\ntags\n'],
  },
  chugai: {
    openTag: /<main\b[^>]*class="contents"[^>]*>/i,
    closeTag: '</main>',
    dropClasses: ['breadcrumb', 'newsDetailBtmPdf', 'newsDetailContact', 'ist-breadcrumb'],
    // Strip the universal legal disclaimer that prefixes every Chugai release —
    // it's identical site-wide page chrome and would otherwise dominate the
    // voice profile.
    headMarkers: ['プロモーションや広告、医学的なアドバイス等を目的とするものではありません。'],
    tailMarkers: ['ニュースリリースに戻る', 'お問い合わせ\n'],
  },
  'takeda-jp': {
    openTag: /<main\b[^>]*id="main-content"[^>]*>/i,
    closeTag: '</main>',
    postReplace: [
      // Repeated title-with-site-suffix from screen-reader h1
      { pattern: / \| 武田薬品/g, replacement: '' },
      // Orphan icon labels around the dateline
      { pattern: /\bCalendar\b\s*/g, replacement: '' },
      { pattern: /\bShare Share\b\s*/g, replacement: '' },
      { pattern: /\bShare\s+Share\s+Share\b/g, replacement: '' },
      // Inline "#" anchor prefix Tailwind theme adds before some headings
      { pattern: /(^|\n)#\s+/g, replacement: '$1' },
      // Markdown-style [text](url) — keep the text, drop the URL
      { pattern: /\[([^\]]+)\]\([^)]+\)/g, replacement: '$1' },
      // Collapse the title repetition that happens at the top (sr-only h1 + visible h2)
      { pattern: /^([^\n]{20,200})\s+\1(\s+\1)?/, replacement: '$1' },
    ],
  },
};

interface ManifestEntry {
  url: string;
  /** Optional date in YYYY-MM-DD; included in the output filename for human scanning. */
  date?: string;
  /** Optional one-line note about the release — not used by extraction, just for human review. */
  note?: string;
}

interface Manifest {
  slug: string;
  urls: ManifestEntry[];
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&reg;/g, '®')
    .replace(/&copy;/g, '©')
    .replace(/&trade;/g, '™')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function extractBody(html: string, config: SiteConfig): string {
  const openMatch = config.openTag.exec(html);
  if (!openMatch) throw new Error('Container open tag not found');
  const after = html.slice(openMatch.index + openMatch[0].length);
  const closeIdx = after.toLowerCase().indexOf(config.closeTag.toLowerCase());
  if (closeIdx === -1) throw new Error('Container close tag not found');
  let inner = after.slice(0, closeIdx);

  // Strip script/style entirely.
  inner = inner.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  inner = inner.replace(/<style\b[\s\S]*?<\/style>/gi, '');

  // Drop enclosing div/section/aside/nav blocks whose class matches a dropClasses substring.
  // Greedy-aware: we use [\s\S]*? plus a balanced-ish approximation. For our two sites the
  // dropped blocks don't nest, so non-greedy is fine.
  if (config.dropClasses?.length) {
    for (const cls of config.dropClasses) {
      const re = new RegExp(
        `<(div|section|aside|nav|ul|p)\\b[^>]*class="[^"]*${cls}[^"]*"[\\s\\S]*?</\\1>`,
        'gi',
      );
      inner = inner.replace(re, '');
    }
  }

  // Tag-strip.
  inner = inner.replace(/<[^>]+>/g, ' ');

  // Decode entities.
  inner = decodeEntities(inner);

  // Whitespace normalize.
  inner = inner
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Apply head/tail trimming.
  if (config.headMarkers?.length) {
    for (const marker of config.headMarkers) {
      const idx = inner.indexOf(marker);
      if (idx !== -1) inner = inner.slice(idx + marker.length).trimStart();
    }
  }
  if (config.tailMarkers?.length) {
    for (const marker of config.tailMarkers) {
      const idx = inner.indexOf(marker);
      if (idx !== -1) inner = inner.slice(0, idx).trimEnd();
    }
  }

  // Apply postReplace last — these handle orphan chrome tokens that survived the structural strip.
  if (config.postReplace?.length) {
    for (const { pattern, replacement } of config.postReplace) {
      inner = inner.replace(pattern, replacement);
    }
    // Re-collapse whitespace after replacements.
    inner = inner.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }

  return inner;
}

async function fetchOne(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: tsx src/fetch-samples.ts <slug>');
    process.exit(1);
  }
  const config = SITE_CONFIGS[slug];
  if (!config) {
    console.error(`No site config for slug "${slug}". Add one to SITE_CONFIGS in fetch-samples.ts.`);
    process.exit(1);
  }

  const samplesDir = join(PROTOTYPE_ROOT, 'samples', slug);
  const manifestPath = join(samplesDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error(
      `No manifest at ${manifestPath}. Create it with shape { slug, urls: [{ url, date?, note? }] }.`,
    );
    process.exit(1);
  }
  mkdirSync(samplesDir, { recursive: true });

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;
  if (manifest.slug !== slug) {
    console.error(`Manifest slug "${manifest.slug}" doesn't match CLI slug "${slug}"`);
    process.exit(1);
  }
  if (!Array.isArray(manifest.urls) || manifest.urls.length === 0) {
    console.error('Manifest has no URLs');
    process.exit(1);
  }

  console.log(`[fetch] ${slug}: ${manifest.urls.length} URLs`);

  let ok = 0;
  let failed = 0;
  for (let i = 0; i < manifest.urls.length; i++) {
    const entry = manifest.urls[i]!;
    const n = pad2(i + 1);
    const datePart = entry.date ? `-${entry.date.replace(/-/g, '')}` : '';
    const filename = `${n}${datePart}.txt`;
    const outPath = join(samplesDir, filename);
    try {
      const html = await fetchOne(entry.url);
      const body = extractBody(html, config);
      if (body.length < 200) {
        console.warn(
          `[fetch] ${n} ${entry.url}: extracted body is only ${body.length} chars — selector may be wrong`,
        );
      }
      writeFileSync(outPath, body + '\n', 'utf-8');
      ok++;
      console.log(`[fetch] ${n} OK (${body.length} chars) → ${filename}`);
    } catch (err) {
      failed++;
      console.error(`[fetch] ${n} FAIL ${entry.url}: ${(err as Error).message}`);
    }
    // Be polite — small delay between requests.
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`[fetch] done: ${ok} ok, ${failed} failed`);
  if (failed > 0) process.exit(2);
}

main().catch((err) => {
  console.error('[fetch] error:', err);
  process.exit(1);
});

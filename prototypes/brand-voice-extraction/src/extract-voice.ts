/**
 * Phase 0 extraction CLI.
 *
 * Usage:
 *   tsx src/extract-voice.ts <company> [--tag <tag>]
 *
 * Examples:
 *   tsx src/extract-voice.ts company-a --tag baseline
 *   tsx src/extract-voice.ts company-b --tag added-falsifiability
 *
 * Output goes to outputs/runs/<timestamp>-<tag>/<company>-profile.json
 * along with a prompt-snapshot.md recording the exact prompt + model
 * used. Re-running with the same tag in the same minute would collide;
 * the timestamp is minute-precision, so wait a minute or change the tag.
 */
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  BRAND_VOICE_EXTRACTION_SYSTEM,
  buildExtractionUserMessage,
  EXTRACTION_PROMPT_VERSION,
} from './prompts.js';
import { BrandVoiceProfileSchema } from './schema.js';
import {
  buildRunFolderName,
  ensureRunFolder,
  readSamples,
  writeJson,
  writeText,
} from './io.js';

const PINNED_MODEL = 'claude-sonnet-4-6';

function parseArgs(argv: string[]): { company: string; tag: string } {
  const positional: string[] = [];
  let tag = 'untagged';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--tag') {
      tag = argv[++i] ?? tag;
    } else if (a && !a.startsWith('--')) {
      positional.push(a);
    }
  }
  const company = positional[0];
  if (!company) {
    console.error('Usage: tsx src/extract-voice.ts <company> [--tag <tag>]');
    process.exit(1);
  }
  return { company, tag };
}

async function main() {
  const { company, tag } = parseArgs(process.argv.slice(2));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY missing. Copy .env.example to .env and set the key.');
    process.exit(1);
  }

  const samples = readSamples(company);
  console.log(`[extract] ${company}: ${samples.length} samples loaded`);

  const client = new Anthropic({ apiKey, maxRetries: 6 });

  const userMessage = buildExtractionUserMessage(samples.map((s) => s.text));

  const started = Date.now();
  const response = await client.messages.create({
    model: PINNED_MODEL,
    max_tokens: 4096,
    system: BRAND_VOICE_EXTRACTION_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  });
  const elapsedMs = Date.now() - started;

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text block in model response');
  }
  const rawText = textBlock.text.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    const folder = ensureRunFolder(buildRunFolderName(`${tag}-PARSE_FAIL`));
    writeText(folder, `${company}-raw.txt`, rawText);
    console.error(
      `[extract] JSON parse failed. Raw output saved to ${folder}. Inspect and iterate the prompt.`,
    );
    process.exit(2);
  }

  const validated = BrandVoiceProfileSchema.safeParse(parsed);
  if (!validated.success) {
    const folder = ensureRunFolder(buildRunFolderName(`${tag}-SCHEMA_FAIL`));
    writeJson(folder, `${company}-raw.json`, parsed);
    writeText(
      folder,
      `${company}-schema-errors.txt`,
      validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'),
    );
    console.error(`[extract] Schema validation failed. Raw + errors saved to ${folder}.`);
    process.exit(3);
  }

  const folder = ensureRunFolder(buildRunFolderName(tag));
  writeJson(folder, `${company}-profile.json`, validated.data);
  writeJson(folder, `${company}-meta.json`, {
    company,
    tag,
    model: PINNED_MODEL,
    prompt_version: EXTRACTION_PROMPT_VERSION,
    sample_count: samples.length,
    sample_filenames: samples.map((s) => s.filename),
    elapsed_ms: elapsedMs,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    stop_reason: response.stop_reason,
    timestamp: new Date().toISOString(),
  });
  writeText(
    folder,
    'prompt-snapshot.md',
    `# Prompt snapshot — ${tag}\n\n` +
      `Model: \`${PINNED_MODEL}\`\n` +
      `Prompt version: \`${EXTRACTION_PROMPT_VERSION}\`\n\n` +
      `## System\n\n\`\`\`\n${BRAND_VOICE_EXTRACTION_SYSTEM}\n\`\`\`\n`,
  );

  console.log(`[extract] OK → ${folder}/${company}-profile.json`);
  console.log(
    `[extract] tokens in=${response.usage.input_tokens} out=${response.usage.output_tokens}, ${elapsedMs}ms`,
  );
}

main().catch((err) => {
  console.error('[extract] error:', err);
  process.exit(1);
});

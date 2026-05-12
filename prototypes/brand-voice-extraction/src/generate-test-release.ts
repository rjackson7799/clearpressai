/**
 * Phase 0 generation CLI — the blind test.
 *
 * Takes an extracted profile and a brief (built from a real release that
 * was NOT in the training samples), produces a single test release, and
 * writes it next to the profile so they can be diffed side-by-side
 * against the real held-out release.
 *
 * Usage:
 *   tsx src/generate-test-release.ts <company> <profile-path> <brief-path> [--tag <tag>]
 *
 * Example:
 *   tsx src/generate-test-release.ts company-a \
 *     outputs/runs/2026-05-11T1430-baseline/company-a-profile.json \
 *     test-briefs/company-a-recent.json
 */
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  buildTestGenerationSystem,
  buildTestGenerationUserMessage,
  TEST_GENERATION_PROMPT_VERSION,
} from './prompts.js';
import { BrandVoiceProfileSchema, PhaseZeroBriefSchema } from './schema.js';
import {
  buildRunFolderName,
  ensureRunFolder,
  readBrief,
  readProfile,
  writeJson,
  writeText,
} from './io.js';

const PINNED_MODEL = 'claude-sonnet-4-6';

function parseArgs(argv: string[]): {
  company: string;
  profilePath: string;
  briefPath: string;
  tag: string;
} {
  const positional: string[] = [];
  let tag = 'gen';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--tag') {
      tag = argv[++i] ?? tag;
    } else if (a && !a.startsWith('--')) {
      positional.push(a);
    }
  }
  const [company, profilePath, briefPath] = positional;
  if (!company || !profilePath || !briefPath) {
    console.error(
      'Usage: tsx src/generate-test-release.ts <company> <profile-path> <brief-path> [--tag <tag>]',
    );
    process.exit(1);
  }
  return { company, profilePath, briefPath, tag };
}

async function main() {
  const { company, profilePath, briefPath, tag } = parseArgs(process.argv.slice(2));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY missing. Copy .env.example to .env and set the key.');
    process.exit(1);
  }

  const profileResult = BrandVoiceProfileSchema.safeParse(readProfile(profilePath));
  if (!profileResult.success) {
    console.error(`[generate] Profile at ${profilePath} failed schema validation:`);
    console.error(profileResult.error.issues);
    process.exit(2);
  }
  const profile = profileResult.data;

  const briefResult = PhaseZeroBriefSchema.safeParse(readBrief(briefPath));
  if (!briefResult.success) {
    console.error(`[generate] Brief at ${briefPath} failed schema validation:`);
    console.error(briefResult.error.issues);
    process.exit(3);
  }
  const brief = briefResult.data;

  const client = new Anthropic({ apiKey, maxRetries: 6 });

  const system = buildTestGenerationSystem(profile, brief.content_type, 'ja');
  const userMessage = buildTestGenerationUserMessage(brief);

  const started = Date.now();
  const response = await client.messages.create({
    model: PINNED_MODEL,
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: userMessage }],
  });
  const elapsedMs = Date.now() - started;

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text block in model response');
  }
  const generated = textBlock.text;

  const folder = ensureRunFolder(buildRunFolderName(`${company}-${tag}`));
  writeText(folder, `${company}-generated.txt`, generated);
  writeJson(folder, `${company}-meta.json`, {
    company,
    tag,
    model: PINNED_MODEL,
    prompt_version: TEST_GENERATION_PROMPT_VERSION,
    profile_path: profilePath,
    brief_path: briefPath,
    content_type: brief.content_type,
    elapsed_ms: elapsedMs,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    char_count: generated.length,
    timestamp: new Date().toISOString(),
  });
  writeText(
    folder,
    'prompt-snapshot.md',
    `# Generation prompt snapshot — ${tag}\n\n` +
      `Model: \`${PINNED_MODEL}\`\n` +
      `Prompt version: \`${TEST_GENERATION_PROMPT_VERSION}\`\n\n` +
      `## System\n\n\`\`\`\n${system}\n\`\`\`\n\n` +
      `## User\n\n\`\`\`\n${userMessage}\n\`\`\`\n`,
  );

  console.log(`[generate] OK → ${folder}/${company}-generated.txt`);
  console.log(
    `[generate] tokens in=${response.usage.input_tokens} out=${response.usage.output_tokens}, ${elapsedMs}ms, ${generated.length} chars`,
  );
}

main().catch((err) => {
  console.error('[generate] error:', err);
  process.exit(1);
});

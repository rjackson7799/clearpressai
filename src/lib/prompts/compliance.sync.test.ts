import { describe, it, expect } from 'vitest';
import vitePromptSrc from './compliance.ts?raw';
import edgePromptSrc from '../../../supabase/functions/compliance-check/_prompt.ts?raw';
import { CLAUDE_MODELS } from './compliance';

function extractDriftRegion(src: string, name: string): string {
  const re = new RegExp(
    `// drift:start ${name}\\r?\\n([\\s\\S]*?)\\r?\\n// drift:end ${name}`,
  );
  const match = src.match(re);
  if (!match) {
    throw new Error(`Could not locate drift region "${name}" in source`);
  }
  return match[1];
}

function extractStringLiteral(src: string, name: string): string {
  const re = new RegExp(`${name}\\s*=\\s*'([^']+)'`);
  const match = src.match(re);
  if (!match) throw new Error(`Could not locate ${name} in source`);
  return match[1];
}

const DRIFT_REGIONS = [
  'COMPLIANCE_SYSTEM',
  'buildComplianceUserMessage',
  'FORBIDDEN_ABSOLUTE_TERMS',
  'REQUIRED_BOILERPLATE_PATTERNS',
  'CLINICAL_REFERENCE_PATTERNS',
  'runDeterministicChecks',
] as const;

describe('Compliance prompt sync (src vs supabase/functions)', () => {
  for (const region of DRIFT_REGIONS) {
    it(`${region} drift region is byte-identical across both files`, () => {
      const vite = extractDriftRegion(vitePromptSrc, region);
      const edge = extractDriftRegion(edgePromptSrc, region);
      expect(edge).toBe(vite);
    });
  }

  it('COMPLIANCE_PROMPT_VERSION matches across both files', () => {
    expect(extractStringLiteral(edgePromptSrc, 'COMPLIANCE_PROMPT_VERSION')).toBe(
      extractStringLiteral(vitePromptSrc, 'COMPLIANCE_PROMPT_VERSION'),
    );
  });

  it('CLAUDE_MODELS.compliance_check matches the Deno mirror', () => {
    const edgeRe = /compliance_check:\s*'([^']+)'/;
    const edgeModel = edgePromptSrc.match(edgeRe)?.[1];
    expect(edgeModel).toBeDefined();
    expect(edgeModel).toBe(CLAUDE_MODELS.compliance_check);
  });
});

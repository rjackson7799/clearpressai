import { describe, it, expect } from 'vitest';
import { complianceLevel, COMPLIANCE_LEVELS } from '@/lib/compliance-level';

describe('compliance-level', () => {
  it('pre_approval is strict', () => {
    const level = complianceLevel('pre_approval');
    expect(level.tone).toBe('strict');
    expect(level.titleEn).toMatch(/Strict/);
    expect(level.bodyEn).toMatch(/No efficacy or safety claims/i);
  });

  it('in_trial is caution', () => {
    expect(complianceLevel('in_trial').tone).toBe('caution');
  });

  it('approved is standard', () => {
    expect(complianceLevel('approved').tone).toBe('standard');
  });

  it('covers every lifecycle status', () => {
    expect(Object.keys(COMPLIANCE_LEVELS).sort()).toEqual([
      'approved',
      'in_trial',
      'pre_approval',
    ]);
  });
});

import { describe, it, expect } from 'vitest';
import { COMPLIANCE_SYSTEM } from './compliance';

describe('COMPLIANCE_SYSTEM lifecycle posture wiring', () => {
  it('pre_approval treats efficacy claims as a blocker', () => {
    const out = COMPLIANCE_SYSTEM({ lifecycle: 'pre_approval' });
    expect(out).toContain('REGULATORY POSTURE');
    expect(out).toMatch(/PRE-APPROVAL/);
    expect(out).toMatch(/as a blocker/i);
  });

  it('approved omits the pre-approval strict posture', () => {
    const out = COMPLIANCE_SYSTEM({ lifecycle: 'approved' });
    expect(out).toMatch(/APPROVED \(承認済\)/);
    expect(out).not.toMatch(/PRE-APPROVAL/);
    expect(out).not.toMatch(/as a blocker/i);
  });

  it('in_trial requires statistical context', () => {
    const out = COMPLIANCE_SYSTEM({ lifecycle: 'in_trial' });
    expect(out).toMatch(/IN-TRIAL/);
    expect(out).toMatch(/statistical context/i);
  });
});

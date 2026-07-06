import { describe, it, expect } from 'vitest';
import { computeOnboardingSteps } from '@/lib/onboarding';

const EMPTY = {
  hasClient: false,
  hasSamples: false,
  hasProject: false,
  hasApproved: false,
  hasDelivered: false,
  firstClientId: null,
};

describe('computeOnboardingSteps', () => {
  it('returns five steps in lifecycle order', () => {
    const { steps } = computeOnboardingSteps(EMPTY);
    expect(steps.map((s) => s.key)).toEqual([
      'client',
      'samples',
      'project',
      'approve',
      'deliver',
    ]);
  });

  it('all-empty: nothing done, first step active, not allDone', () => {
    const { steps, activeIndex, allDone } = computeOnboardingSteps(EMPTY);
    expect(steps.every((s) => !s.done)).toBe(true);
    expect(activeIndex).toBe(0);
    expect(allDone).toBe(false);
  });

  it('partial progress: ticks completed steps and advances activeIndex', () => {
    const { steps, activeIndex, allDone } = computeOnboardingSteps({
      ...EMPTY,
      hasClient: true,
      hasSamples: true,
    });
    expect(steps[0].done).toBe(true);
    expect(steps[1].done).toBe(true);
    expect(steps[2].done).toBe(false);
    expect(activeIndex).toBe(2);
    expect(allDone).toBe(false);
  });

  it('detects approve step from variants_approved signal', () => {
    const { steps } = computeOnboardingSteps({
      ...EMPTY,
      hasClient: true,
      hasSamples: true,
      hasProject: true,
      hasApproved: true,
    });
    expect(steps.find((s) => s.key === 'approve')?.done).toBe(true);
  });

  it('detects deliver step from delivered/feedback status', () => {
    const { steps } = computeOnboardingSteps({
      ...EMPTY,
      hasDelivered: true,
    });
    expect(steps.find((s) => s.key === 'deliver')?.done).toBe(true);
  });

  it('all-done: allDone true, activeIndex -1', () => {
    const { activeIndex, allDone } = computeOnboardingSteps({
      hasClient: true,
      hasSamples: true,
      hasProject: true,
      hasApproved: true,
      hasDelivered: true,
      firstClientId: 'c1',
    });
    expect(allDone).toBe(true);
    expect(activeIndex).toBe(-1);
  });

  it('samples step links to the first client when one exists, else /clients', () => {
    expect(
      computeOnboardingSteps({ ...EMPTY, firstClientId: 'abc' }).steps[1].to,
    ).toBe('/clients/abc');
    expect(computeOnboardingSteps(EMPTY).steps[1].to).toBe('/clients');
  });
});

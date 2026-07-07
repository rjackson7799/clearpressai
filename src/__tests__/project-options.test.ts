import { describe, it, expect } from 'vitest';
import {
  TARGET_AUDIENCES,
  TARGET_AUDIENCE_VALUES,
  DRUG_LIFECYCLE_STATUSES,
  DRUG_LIFECYCLE_VALUES,
  DISTRIBUTION_CHANNELS,
  DISTRIBUTION_CHANNEL_VALUES,
  LENGTH_TIERS,
  LENGTH_TIER_VALUES,
  LENGTH_TIER_PRESET_CHARS,
} from '@/lib/project-options';

describe('project-options', () => {
  it('value tuples mirror their option arrays', () => {
    expect([...TARGET_AUDIENCE_VALUES]).toEqual(
      TARGET_AUDIENCES.map((o) => o.value),
    );
    expect([...DRUG_LIFECYCLE_VALUES]).toEqual(
      DRUG_LIFECYCLE_STATUSES.map((o) => o.value),
    );
    expect([...DISTRIBUTION_CHANNEL_VALUES]).toEqual(
      DISTRIBUTION_CHANNELS.map((o) => o.value),
    );
    expect([...LENGTH_TIER_VALUES]).toEqual(LENGTH_TIERS.map((o) => o.value));
  });

  it('every length tier has a positive preset char value', () => {
    for (const tier of LENGTH_TIERS) {
      expect(LENGTH_TIER_PRESET_CHARS[tier.value]).toBeGreaterThan(0);
    }
  });

  it('every option carries non-empty ja and en labels', () => {
    for (const arr of [
      TARGET_AUDIENCES,
      DRUG_LIFECYCLE_STATUSES,
      DISTRIBUTION_CHANNELS,
      LENGTH_TIERS,
    ]) {
      for (const o of arr) {
        expect(o.ja.length).toBeGreaterThan(0);
        expect(o.en.length).toBeGreaterThan(0);
      }
    }
  });
});

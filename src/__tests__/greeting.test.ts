import { describe, it, expect } from 'vitest';
import { greetingFor } from '@/lib/greeting';

describe('greetingFor', () => {
  it('morning before noon', () => {
    expect(greetingFor(0).en).toBe('Good morning');
    expect(greetingFor(11).en).toBe('Good morning');
    expect(greetingFor(5).ja).toBe('おはようございます');
  });

  it('afternoon from noon to 17:59', () => {
    expect(greetingFor(12).en).toBe('Good afternoon');
    expect(greetingFor(17).en).toBe('Good afternoon');
    expect(greetingFor(14).ja).toBe('こんにちは');
  });

  it('evening from 18:00', () => {
    expect(greetingFor(18).en).toBe('Good evening');
    expect(greetingFor(23).en).toBe('Good evening');
    expect(greetingFor(21).ja).toBe('こんばんは');
  });
});

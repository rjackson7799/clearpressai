import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/locales/i18n';
import { FeedbackChipGroup } from '@/components/feedback/FeedbackChipGroup';
import type { ChipPreset } from '@/components/feedback/feedback-chip-presets';

// Force JA so the preset badges render their JA labels (also the persisted
// value) and the localized placeholder is deterministic.
beforeEach(async () => {
  await i18n.changeLanguage('ja');
});

const PRESETS: readonly ChipPreset[] = [
  { id: 'a', ja: 'A日本語', en: 'A English' },
  { id: 'b', ja: 'B日本語', en: 'B English' },
  { id: 'c', ja: 'C日本語', en: 'C English' },
];

function Harness({ initial = [], max = 6 }: { initial?: string[]; max?: number }) {
  const [value, setValue] = useState<string[]>(initial);
  return (
    <div>
      <FeedbackChipGroup
        presets={PRESETS}
        value={value}
        onChange={setValue}
        max={max}
        maxLength={50}
      />
      <div data-testid="value">{value.join('|')}</div>
    </div>
  );
}

describe('FeedbackChipGroup', () => {
  // Preset chips render as role=button on the surrounding Badge — scope to
  // that so the assertion isn't ambiguous with the harness's debug div.
  function getPresetBadge(text: string): HTMLElement {
    const buttons = screen.getAllByRole('button');
    const match = buttons.find((b) => b.textContent?.includes(text));
    if (!match) throw new Error(`No preset badge containing "${text}"`);
    return match;
  }

  it('toggles a preset on by clicking', () => {
    render(<Harness />);
    fireEvent.click(getPresetBadge('A日本語'));
    expect(screen.getByTestId('value')).toHaveTextContent('A日本語');
  });

  it('toggles a preset off when clicked twice', () => {
    render(<Harness initial={['A日本語']} />);
    fireEvent.click(getPresetBadge('A日本語'));
    expect(screen.getByTestId('value')).toHaveTextContent('');
  });

  it('adds a custom chip via the Add button', () => {
    render(<Harness />);
    const input = screen.getByPlaceholderText(/他のキーワードを追加/);
    fireEvent.change(input, { target: { value: 'custom-x' } });
    const buttons = screen.getAllByRole('button');
    const addButton = buttons.find(
      (b) => b.querySelector('svg') && (b as HTMLButtonElement).type === 'button',
    );
    fireEvent.click(addButton!);
    expect(screen.getByTestId('value')).toHaveTextContent('custom-x');
  });

  it('adds a custom chip on Enter', () => {
    render(<Harness />);
    const input = screen.getByPlaceholderText(/他のキーワードを追加/);
    fireEvent.change(input, { target: { value: 'via-enter' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('value')).toHaveTextContent('via-enter');
  });

  it('respects the max bound and rejects additional adds', () => {
    render(<Harness max={2} initial={['A日本語', 'B日本語']} />);
    // The input is disabled when full
    const input = screen.getByPlaceholderText(/他のキーワードを追加/) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    // Preset C should not toggle on because the group is full
    fireEvent.click(getPresetBadge('C日本語'));
    expect(screen.getByTestId('value')).toHaveTextContent('A日本語|B日本語');
  });

  it('renders a remove button on a custom chip and removes it', () => {
    render(<Harness initial={['custom-y']} />);
    const removeButton = screen.getByLabelText('Remove custom-y');
    fireEvent.click(removeButton);
    expect(screen.getByTestId('value')).toHaveTextContent('');
  });

  it('shows the n / max counter', () => {
    render(<Harness initial={['A日本語']} max={6} />);
    expect(screen.getByText('1 / 6')).toBeInTheDocument();
  });
});

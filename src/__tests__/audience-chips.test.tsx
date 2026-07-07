import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/locales/i18n';
import { AudienceChips } from '@/components/project/AudienceChips';
import type { TargetAudience } from '@/types/domain';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

function Harness({ initial }: { initial: TargetAudience }) {
  const [value, setValue] = useState<TargetAudience>(initial);
  return (
    <div>
      <AudienceChips value={value} onChange={setValue} />
      <div data-testid="value">{value}</div>
    </div>
  );
}

describe('AudienceChips', () => {
  it('marks the selected chip aria-checked', () => {
    render(<Harness initial="news_media" />);
    expect(screen.getByRole('radio', { name: 'News media' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('single-selects on click (radio semantics)', () => {
    render(<Harness initial="news_media" />);
    fireEvent.click(screen.getByRole('radio', { name: 'HCP' }));
    expect(screen.getByTestId('value').textContent).toBe('hcp');
    expect(screen.getByRole('radio', { name: 'HCP' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: 'News media' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });
});

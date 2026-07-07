import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Stepper } from '@/components/ui/stepper';

describe('Stepper', () => {
  it('disables the + button at max', () => {
    render(<Stepper value={3} min={1} max={3} onValueChange={vi.fn()} />);
    expect(screen.getByLabelText('increase')).toBeDisabled();
  });

  it('disables the − button at min', () => {
    render(<Stepper value={1} min={1} max={3} onValueChange={vi.fn()} />);
    expect(screen.getByLabelText('decrease')).toBeDisabled();
  });

  it('increments within bounds', () => {
    const onChange = vi.fn();
    render(<Stepper value={2} min={1} max={3} onValueChange={onChange} />);
    fireEvent.click(screen.getByLabelText('increase'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('decrements within bounds', () => {
    const onChange = vi.fn();
    render(<Stepper value={2} min={1} max={3} onValueChange={onChange} />);
    fireEvent.click(screen.getByLabelText('decrease'));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

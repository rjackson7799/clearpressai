/**
 * Time-of-day greeting for the dashboard hero. Pure — takes the local hour
 * (0–23) so callers thread in a single `now` computed once at the page level
 * (the eslint `react-hooks/purity` rule forbids `new Date()` in render).
 */
export function greetingFor(hour: number): { ja: string; en: string } {
  if (hour < 12) return { ja: 'おはようございます', en: 'Good morning' };
  if (hour < 18) return { ja: 'こんにちは', en: 'Good afternoon' };
  return { ja: 'こんばんは', en: 'Good evening' };
}

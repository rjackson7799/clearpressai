import { describe, it, expect } from 'vitest';
import {
  applyFeedbackToBody,
  FEEDBACK_PLACEHOLDER,
} from '@/lib/delivery-template';

// Producer-seam coverage: send-delivery + process-scheduled-sends build the
// feedback URL with buildFeedbackUrl and hand it to applyFeedbackToBody. This
// proves the URL reaches the email unchanged (no re-wrapping / trimming), so
// the magic-link hardening actually determines the emitted link.
describe('applyFeedbackToBody', () => {
  const url =
    'https://www.clearpressai.com/f/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ';

  it('substitutes {{FEEDBACK_LINK}} with the URL unchanged (html + text)', () => {
    const body = {
      html: `<p>Hi</p>${FEEDBACK_PLACEHOLDER}`,
      text: `Hi\n${FEEDBACK_PLACEHOLDER}`,
    };
    const out = applyFeedbackToBody(body, url);
    expect(out.html).toBe(`<p>Hi</p>${url}`);
    expect(out.text).toBe(`Hi\n${url}`);
    expect(out.html).not.toContain(FEEDBACK_PLACEHOLDER);
    expect(out.text).not.toContain(FEEDBACK_PLACEHOLDER);
  });

  it('replaces every occurrence of the placeholder', () => {
    const body = {
      html: `${FEEDBACK_PLACEHOLDER} and ${FEEDBACK_PLACEHOLDER}`,
      text: `${FEEDBACK_PLACEHOLDER} and ${FEEDBACK_PLACEHOLDER}`,
    };
    const out = applyFeedbackToBody(body, url);
    expect(out.html).toBe(`${url} and ${url}`);
    expect(out.text).toBe(`${url} and ${url}`);
  });

  it('appends a footer containing the URL verbatim when no placeholder present', () => {
    const out = applyFeedbackToBody({ html: '<p>Hi</p>', text: 'Hi' }, url);
    expect(out.html).toContain(`<a href="${url}">${url}</a>`);
    expect(out.text).toContain(url);
  });
});

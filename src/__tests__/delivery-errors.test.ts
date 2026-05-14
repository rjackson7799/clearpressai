import { describe, it, expect } from 'vitest';
import { explainDeliveryError } from '@/lib/delivery-errors';

describe('explainDeliveryError', () => {
  it('maps audit_not_finalized to its bilingual pair', () => {
    const result = explainDeliveryError('audit_not_finalized');
    expect(result).not.toBeNull();
    expect(result!.ja).toContain('監査');
    expect(result!.en.toLowerCase()).toContain('audit');
  });

  it('maps variant_not_approved', () => {
    const result = explainDeliveryError('variant_not_approved');
    expect(result?.en.toLowerCase()).toContain('approve');
  });

  it('matches a substring (FunctionsHttpError wraps the raw code in a longer message)', () => {
    // Surfaced via supabase-js's FunctionsHttpError context — the message
    // sometimes has prefix/suffix noise. The lookup uses includes() so a
    // substring hit still resolves.
    expect(
      explainDeliveryError('Error: scheduled_in_past'),
    ).not.toBeNull();
  });

  it('returns null on an unknown code so the raw string surfaces in the Alert', () => {
    expect(explainDeliveryError('totally_made_up_gate')).toBeNull();
  });

  it('covers every P0004 code raised by Phase 5 RPCs', () => {
    // Quick guard so a future RPC addition without a map entry shows up as
    // a test failure rather than silent "unknown_gate" UX.
    const codes = [
      'not_authenticated',
      'project_not_found',
      'content_item_not_in_project',
      'variant_count_out_of_range',
      'variant_ids_duplicated',
      'variant_not_in_content_item',
      'variant_not_approved',
      'variant_updated_after_approval',
      'recommended_not_attached',
      'audit_not_finalized',
      'audit_stale_vs_variants',
      'recipient_email_invalid',
      'cc_or_bcc_email_invalid',
      'invalid_attachment_format',
      'scheduled_in_past',
      'app_config_missing',
      'delivery_not_found',
      'delivery_not_pending',
    ];
    for (const code of codes) {
      expect(explainDeliveryError(code), `missing entry for ${code}`).not.toBeNull();
    }
  });
});

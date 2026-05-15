import { describe, it, expect } from 'vitest';
import tsSrc from '../lib/types/delivery.ts?raw';
import denoSrc from '../../supabase/functions/_shared/types-delivery.ts?raw';
import {
  ComposerInputSchema,
  DeliverySnapshotSchema,
} from '../lib/types/delivery';

function extractDriftRegion(src: string, name: string): string {
  const re = new RegExp(
    `// drift:start ${name}\\r?\\n([\\s\\S]*?)\\r?\\n// drift:end ${name}`,
  );
  const match = src.match(re);
  if (!match) {
    throw new Error(`Could not locate drift region "${name}" in source`);
  }
  return match[1];
}

describe('delivery-snapshot drift (TS mirror vs Deno _shared/types-delivery)', () => {
  it('DELIVERY_TYPES region is byte-identical across both files', () => {
    const ts = extractDriftRegion(tsSrc, 'DELIVERY_TYPES');
    const deno = extractDriftRegion(denoSrc, 'DELIVERY_TYPES');
    expect(deno).toBe(ts);
  });
});

describe('DeliverySnapshotSchema (zod shape)', () => {
  const fixture = {
    project: { id: '11111111-1111-4111-8111-111111111111', name: 'Q1 Press' },
    content_item: {
      id: '22222222-2222-4222-8222-222222222222',
      content_sub_type: 'partner_ack' as const,
    },
    variants: [
      {
        id: '33333333-3333-4333-8333-333333333333',
        variant_label: 'Concise',
        variant_index: 1,
        body_html: '<p>x</p>',
        body_text: 'x',
        variation_directive: 'Be concise.',
        char_count: 100,
      },
    ],
    recommended_variant_id: '33333333-3333-4333-8333-333333333333',
    audit_report: {
      id: '44444444-4444-4444-8444-444444444444',
      version_major: 1,
      version_minor: 0,
      finalized_at: '2026-05-13T10:00:00.000Z',
      signature_hash: 'deadbeef',
    },
    sender: {
      from_name: 'ClearPress',
      from_email: 'noreply@example.com',
      reply_to_email: 'ryan@example.com',
      sent_by_email_snapshot: 'ryan@example.com',
    },
    recipient: {
      email: 'client@example.com',
      name: 'Client Co',
      cc_emails: [],
      bcc_emails_effective: ['legal@example.com'],
    },
    scheduling_warnings: [],
  };

  it('accepts a well-formed snapshot', () => {
    expect(() => DeliverySnapshotSchema.parse(fixture)).not.toThrow();
  });

  it('rejects an empty variants array (min 1)', () => {
    expect(() =>
      DeliverySnapshotSchema.parse({ ...fixture, variants: [] }),
    ).toThrow();
  });

  it('rejects more than 3 variants', () => {
    const four = [1, 2, 3, 4].map((i) => ({
      ...fixture.variants[0],
      variant_index: ((i - 1) % 3) + 1,
    }));
    expect(() =>
      DeliverySnapshotSchema.parse({ ...fixture, variants: four }),
    ).toThrow();
  });

  it('rejects invalid email in sender', () => {
    expect(() =>
      DeliverySnapshotSchema.parse({
        ...fixture,
        sender: { ...fixture.sender, from_email: 'not-an-email' },
      }),
    ).toThrow();
  });
});

describe('ComposerInputSchema (zod shape)', () => {
  it('accepts a minimal valid input', () => {
    const minimal = {
      project_id: '11111111-1111-4111-8111-111111111111',
      content_item_id: '22222222-2222-4222-8222-222222222222',
      variant_ids: ['33333333-3333-4333-8333-333333333333'],
      recipient_email: 'client@example.com',
      subject: 'Press release',
      body_html: '<p>hello</p>',
      attachment_format: 'pdf' as const,
    };
    expect(() => ComposerInputSchema.parse(minimal)).not.toThrow();
  });

  it('rejects invalid attachment_format', () => {
    expect(() =>
      ComposerInputSchema.parse({
        project_id: '11111111-1111-4111-8111-111111111111',
        content_item_id: '22222222-2222-4222-8222-222222222222',
        variant_ids: ['33333333-3333-4333-8333-333333333333'],
        recipient_email: 'client@example.com',
        subject: 'x',
        body_html: 'x',
        attachment_format: 'rtf',
      }),
    ).toThrow();
  });

  it('rejects subject longer than 200 chars', () => {
    expect(() =>
      ComposerInputSchema.parse({
        project_id: '11111111-1111-4111-8111-111111111111',
        content_item_id: '22222222-2222-4222-8222-222222222222',
        variant_ids: ['33333333-3333-4333-8333-333333333333'],
        recipient_email: 'client@example.com',
        subject: 'x'.repeat(201),
        body_html: 'x',
        attachment_format: 'pdf',
      }),
    ).toThrow();
  });
});


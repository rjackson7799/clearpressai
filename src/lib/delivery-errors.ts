// P0004 error codes raised by Phase 5 RPCs (create_delivery, mark_delivery_*,
// record_scheduled_attempt_failure, get_firm_config_public). The codes come
// through useCreateDelivery's FunctionsHttpError unwrap and the composer
// surfaces them in a destructive Alert via BilingualLabel — same pattern as
// Phase 4's SignAuditDialog GATE_MESSAGES.
//
// Server-side codes are authoritative; if a new gate is added in a future
// migration without an entry here, the raw code string falls through to the
// Alert. That's intentional — better to show 'unknown_gate_xyz' than nothing.

const GATE_MESSAGES: Record<string, { ja: string; en: string }> = {
  not_authenticated: {
    ja: '認証が必要です。再ログインしてください。',
    en: 'Not authenticated. Please sign in again.',
  },
  project_not_found: {
    ja: 'プロジェクトが見つかりません。',
    en: 'Project not found.',
  },
  content_item_not_in_project: {
    ja: '選択されたコンテンツアイテムがプロジェクトに属していません。',
    en: 'The selected content item does not belong to this project.',
  },
  variant_count_out_of_range: {
    ja: '案は1〜3件選択してください。',
    en: 'Select between 1 and 3 variants.',
  },
  variant_ids_duplicated: {
    ja: '同じ案が複数回選択されています。',
    en: 'The same variant is selected more than once.',
  },
  variant_not_in_content_item: {
    ja: '選択した案のすべてが同じコンテンツアイテムに属している必要があります。',
    en: 'All selected variants must belong to the same content item.',
  },
  variant_not_approved: {
    ja: '未承認の案が含まれています。レビュー画面で承認してください。',
    en: 'One or more selected variants are not approved. Approve them on the review page first.',
  },
  variant_updated_after_approval: {
    ja: '承認後に編集された案があります。再承認するか、選択を外してください。',
    en: 'One or more variants were edited after approval. Re-approve or deselect.',
  },
  recommended_not_attached: {
    ja: '推奨案は添付されている案の中から選択してください。',
    en: 'The recommended variant must be one of the attached variants.',
  },
  audit_not_finalized: {
    ja: '監査レポートが署名済みではありません。監査ページから署名してください。',
    en: 'Audit report is not signed. Sign the latest audit report first.',
  },
  audit_stale_vs_variants: {
    ja: '監査確定後に編集された案があります。改訂版の監査レポートを作成してください。',
    en: 'Variants were edited after the audit was finalized. Create a new revision of the audit report.',
  },
  recipient_email_invalid: {
    ja: '宛先メールアドレスの形式が正しくありません。',
    en: 'Recipient email is not well-formed.',
  },
  cc_or_bcc_email_invalid: {
    ja: 'CC/BCCに無効なメールアドレスが含まれています。',
    en: 'CC or BCC contains an invalid email address.',
  },
  invalid_attachment_format: {
    ja: '添付形式が不正です。',
    en: 'Invalid attachment format.',
  },
  scheduled_in_past: {
    ja: '予約送信時刻が過去になっています。未来の時刻を指定してください。',
    en: 'Scheduled time is in the past. Pick a future time.',
  },
  app_config_missing: {
    ja: 'サーバー設定が不完全です。管理者にお問い合わせください。',
    en: 'Server configuration is incomplete. Contact the administrator.',
  },
  delivery_not_found: {
    ja: '配信が見つかりません。',
    en: 'Delivery not found.',
  },
  delivery_not_pending: {
    ja: 'この配信はすでに送信または失敗状態です。',
    en: 'This delivery is no longer pending (already sent or failed).',
  },
};

export function explainDeliveryError(
  message: string,
): { ja: string; en: string } | null {
  for (const key of Object.keys(GATE_MESSAGES)) {
    if (message.includes(key)) return GATE_MESSAGES[key];
  }
  return null;
}

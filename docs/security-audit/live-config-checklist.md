# ClearPress AI — Phase 0 [live] verification checklist

These items can't be confirmed from the repo — they depend on cloud configuration,
provider posture, or external legal terms. Run/confirm each, then the corresponding
claim in [`SECURITY-OVERVIEW.md`](../SECURITY-OVERVIEW.md) can move from "softened/flagged"
to "asserted." Cloud project: `hsdqvlnzorjzxfaqijns`. Owner: you (Ryan).

Status legend: ☐ to do · ☑ confirmed · ⚠ confirmed-but-needs-change.

---

## 0.2 — Auth perimeter & enrollment  (the real boundary, given uniform RLS)

`config.toml` (local stack) is well-hardened; **the cloud dashboard is authoritative and
may differ.** Confirm at Supabase Dashboard → Authentication → (Providers / Settings):

- ☐ **Public signups disabled.** (`config.toml` has `enable_signup = false`; confirm cloud
  matches — Auth → Providers → Email → "Enable signups" OFF / invite-only.)
- ☐ **Anonymous sign-ins disabled.** (cloud mirror of `enable_anonymous_sign_ins = false`.)
- ☐ **Email confirmation required** before sign-in (`enable_confirmations = true`).
- ☐ **Password min length 12** active in cloud (`minimum_password_length = 12`). Decide
  whether to also require complexity (`password_requirements` is currently `""`).
- ☐ **Session / JWT expiry = 7 days** + refresh-token rotation ON in cloud.
- ☐ **OTP / magic-link / reset expiry** sane (`otp_expiry = 3600` locally).
- ☐ **Offboarding procedure exists**: how a departed staff member's access is revoked
  (delete the `auth.users` row / disable). Document it — auditors ask.
- ☐ **MFA**: currently NOT enabled. Decide if it's in-scope; if not, it stays a roadmap
  item and the doc must not imply MFA.

## 0.7 — Live configuration verification

- ☐ **Deployed Edge Function JWT modes** match intent: `feedback-load`, `feedback-submit`
  are `--no-verify-jwt` (by design); ALL others JWT-gated. Confirm in Dashboard → Edge
  Functions (or `supabase functions list`).
- ☐ **Edge Function secrets set** (server-side only): `ANTHROPIC_API_KEY`,
  `AUDIT_SIGNING_SECRET`, `RESEND_API_KEY`, `PDFSHIFT_API_KEY`, `PUBLIC_FEEDBACK_URL_BASE`.
- ☐ **Prod client bundle carries no server secret.** Build the app and grep the output:
  `npm run build` then search `dist/` for `service_role`, `sk-ant`, `AUDIT_SIGNING`,
  `RESEND_API_KEY` → must be ZERO hits. (Only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
  are expected, which are public by design.)
- ☐ **Vault `service_role_key`** exists for the cron worker (if scheduled-send is live):
  `select count(*) from vault.decrypted_secrets where name='service_role_key';`
- ☐ **Auth SMTP** (Dashboard → Project Settings → Auth → SMTP) points at Resend; confirm.
- ☐ **Email deliverability / anti-spoofing on the sending domain** (`clearpressai.com`):
  SPF, DKIM, DMARC records published and Resend domain verified. (Check DNS + Resend
  dashboard.) Relevant because the product sends client-facing email.
- ☐ **TLS / HTTPS** enforced on the Vercel domain (custom domain has a valid cert,
  HTTP→HTTPS redirect). Confirm `https://www.clearpressai.com`.
- ☐ **Production logs** don't persist tokens / full message bodies / PII beyond what's
  needed; know the platform log-retention window (Supabase + Vercel).

## 0.9 — Backup, restore, retention

- ☐ **Supabase backup / PITR posture** for the project's plan tier (Dashboard → Database →
  Backups). Know the RPO/retention (e.g. daily backups vs PITR window).
- ☐ **Restore tested or at least documented** (even a paper runbook).
- ☐ **Data-deletion / retention policy** decided. Today retention is effectively indefinite
  (TSD Appendix A Q5). State a policy or say "retained for the life of the engagement."
- ☐ **Audit/report retention** intentionally differs from ordinary project data? (Pharma
  recordkeeping may warrant longer.) Decide + document.

## 0.11 — Third-party legal/security facts (verify LIVE before publishing)

Each subprocessor claim in the doc's table must be backed by the provider's current trust
page / terms. Confirm and paste the source URL next to each:

- ☐ **Anthropic** — commercial API **does not train on inputs/outputs by default**;
  zero-data-retention available on request. (Anthropic Commercial Terms / Privacy +
  Trust Center.) ← gates the doc's "AI does not train on your data" line.
- ☐ **Supabase** — SOC 2 Type II; Tokyo (`ap-northeast-1`) region for this project;
  encryption at rest. (Supabase Trust/Security page.)
- ☐ **Vercel** — SOC 2 Type II; note compute/log regions (US/global edge) for the
  cross-border list.
- ☐ **Resend** — security/compliance posture (SOC 2 status); sending region.
- ☐ **pdfshift** — security posture + region; what content it receives (rendered HTML).
- ☐ **DPAs / subprocessor agreements**: is a Data Processing Agreement signed (or available
  to sign) with Anthropic, Supabase, Resend, Vercel, pdfshift? Affects what the doc can say
  about contractual data handling. APPI (Japan) cross-border transfer may need this.

---

## Decisions the doc needs from you (non-technical)

- ☐ Security/contact email to print in the doc (placeholder: `security@clearpressai.com`).
- ☐ Data-retention policy statement (see 0.9).
- ☐ **Japanese-language version** of the overview needed? (Client is a JP pharma firm —
  likely yes eventually. Plan: English first, JA fast-follow.)
- ☐ Whether to ship the two **optional remediations** (see findings.md): the audit
  append-only migration + the RPC REVOKE-hardening migration. Shipping them lets the doc
  make stronger claims ("DB-enforced append-only," "least-privilege RPC grants").

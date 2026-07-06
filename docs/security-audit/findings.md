# ClearPress AI — Phase 0 Security Audit Findings

Internal working document (NOT customer-facing). Backs the claims in
[`docs/SECURITY-OVERVIEW.md`](../SECURITY-OVERVIEW.md). Date: 2026-06-24.
Scope: code + IaC config in this repo. Items tagged **[live]** require running
against the cloud project (`hsdqvlnzorjzxfaqijns`) — see
[`live-config-checklist.md`](./live-config-checklist.md) and
[`privilege-tests.sql`](./privilege-tests.sql).

Severity scale: **HIGH** (open hole, fix before claiming) · **MED** (real, scoped) ·
**LOW** (defense-in-depth / hygiene) · **INFO** (no action, documents a good control).

---

## Executive summary

The codebase is in solid shape for a v1 internal tool. Secret hygiene, input
sanitization, token entropy, file-upload privacy, and the audit-signing design are all
sound. The findings worth acting on before publishing a security statement are:

1. **Audit trail is tamper-EVIDENT, not tamper-PROOF (MED→claim-blocking).** Uniform RLS
   lets any authenticated firm user UPDATE/DELETE audit rows directly. Phrase the doc
   carefully OR ship the optional append-only migration.
2. **SECURITY DEFINER grant hardening is inconsistent (LOW, mostly defense-in-depth).**
   Only Phase 6 functions `REVOKE` from PUBLIC; earlier ones rely on internal auth
   gates. Two helper/util functions lack both a REVOKE and an internal gate → low-sev
   residual, pending the live privilege test.
3. **No application-level rate limiting on public feedback endpoints (MED).** Token
   entropy is strong, but scraping / valid-token spam / LLM-cost abuse have no app-level
   throttle. Don't claim rate limiting in the doc.
4. **Wildcard CORS on all Edge Functions (LOW).** Fine for anonymous token endpoints;
   document the decision; optionally tighten for JWT-gated ones.
5. **Dependency advisories (LOW).** `npm audit` = high-sev react-router CSRF + moderate
   DoS issues; `npm audit fix` available.

Nothing here is a confirmed critical breach. The audit-trail wording and the rate-limit
claim are the two items that directly gate what the statement may say.

---

## 0.1 DB privilege & RLS behavior — **MED (claim-blocking for "immutable")**

**Confirmed in code.** [0001_initial_schema.sql:262-277](../../supabase/migrations/0001_initial_schema.sql#L262-L277):
every table, including `audit_signatures` and `audit_trail_events`, carries
`create policy firm_users_full_access ... for all using (auth.role() = 'authenticated')`.
`for all` = SELECT + INSERT + UPDATE + DELETE. So any authenticated firm user can delete
or replace audit rows directly via PostgREST.

- HMAC signatures ([_shared/canonical.ts](../../supabase/functions/_shared/canonical.ts))
  make *content alteration* of a signed report **detectable** — but only if the signature
  row survives. Deletion or wholesale row replacement is **not prevented**.
- "Append-only" is application convention, not a DB constraint (confirmed: no
  trigger/policy denies UPDATE/DELETE on the audit tables).

**Doc consequence:** say **"tamper-evident via cryptographic signatures,"** never
"immutable" / "cannot be altered," unless the remediation below ships.

**Optional remediation (flagged — needs user OK):** a migration that REVOKEs
UPDATE/DELETE on `audit_trail_events` + `audit_signatures` from `authenticated` and
denies them via a restrictive policy (`for update/delete using (false)`), realizing the
Phase 4/5/6 "append-only in v2" carry-forward. Then the doc may claim DB-enforced
append-only.

**[live] test:** [`privilege-tests.sql`](./privilege-tests.sql) §A proves whether an
`authenticated` session can DELETE an audit row today.

---

## 0.3 SECURITY DEFINER grant hardening — **LOW (defense-in-depth) + small genuine residuals**

**Method:** in Postgres a new function grants `EXECUTE` to `PUBLIC` by default; Supabase's
`anon`/`authenticated` are members of PUBLIC, so a function not explicitly `REVOKE`d is
callable by `anon` via `/rest/v1/rpc/<fn>` unless an internal gate stops it. Phase 6
(0009) does the right thing; earlier migrations do not.

**Important correction to first-pass automated findings:** two functions were
mis-flagged as `SECURITY DEFINER` HIGH risks. They are actually **`SECURITY INVOKER`**, so
RLS applies with the caller's role and `anon` is blocked by `firm_users_full_access`:
- `regenerate_variant` — [0004:55](../../supabase/migrations/0004_phase3_schema.sql#L55),
  [0010:47](../../supabase/migrations/0010_phase7_live_audit_atomicity.sql#L47).
- `record_compliance_check` — [0010:130](../../supabase/migrations/0010_phase7_live_audit_atomicity.sql#L130).

**Most DEFINER RPCs are mitigated by an early internal auth gate** that raises before any
mutation, so even an `anon` invocation is a harmless no-op:
- `auth.uid() is null → raise 'not_authenticated'`: `approve_variant`, `apply_fix`,
  `acknowledge_finding`, `record_manual_review_started`, `assemble_audit_report`,
  `revise_audit_report`, `finalize_audit_report`, `create_delivery`,
  `mark_delivery_sent_user`, `get_firm_config_public`
  ([0008:630](../../supabase/migrations/0008_phase5_delivery.sql#L630)).
- `auth.role() <> 'service_role' → raise 'not_service_role'`: `mark_delivery_sent_system`
  ([0008:473](../../supabase/migrations/0008_phase5_delivery.sql#L473)),
  `record_scheduled_attempt_failure`.

These are **LOW / defense-in-depth**: residual is only that the functions are *invocable*
(a raised exception, no escalation, no mutation). Best practice is to apply the Phase 6
REVOKE pattern uniformly.

**Genuine residual exposures (DEFINER · RLS-bypassing · no internal gate · PUBLIC-default
callable) — both LOW severity, both require knowing a UUID, both gated on the live test:**
- `mark_delivery_failed` —
  [0008:576-610](../../supabase/migrations/0008_phase5_delivery.sql#L576-L610): no auth
  check; an `anon` caller with a known delivery UUID could flip a `draft`/`scheduled`
  delivery to `failed` (disruption, not data theft).
- `_latest_finalized_audit_report` —
  [0008:78-97](../../supabase/migrations/0008_phase5_delivery.sql#L78-L97): DEFINER,
  `stable`, **no GRANT statement → PUBLIC default**, no gate; could return a finalized
  audit report row by project UUID (info disclosure). `_build_audit_snapshot` (0005) is a
  similar helper — confirm in the live test.

**Optional remediation (flagged):** apply the Phase 6 pattern —
`REVOKE ALL ON FUNCTION ... FROM public, anon` — to all DEFINER functions, and add an
internal auth gate to `mark_delivery_failed`. Lets the doc claim least-privilege RPC grants.

**[live] test:** [`privilege-tests.sql`](./privilege-tests.sql) §B calls the two residual
functions as `anon` and confirms whether PostgREST actually exposes them.

---

## 0.4 / 0.6 Edge Function inventory + public-endpoint abuse — **MED**

Per-function auth/CORS/logging table (all verified in code):

| Function | Auth mode | Service-role client | CORS | Sensitive logging |
|---|---|---|---|---|
| compliance-check | JWT | no | `*` | none |
| extract-voice | JWT | no | `*` | none |
| generate-variants | JWT | no | `*` | none |
| send-delivery | JWT | no | `*` | none |
| sign-audit-report | JWT | no | `*` | secret never logged |
| verify-audit-signature | JWT | no | `*` | secret never logged |
| retrigger-feedback-delta | JWT | yes | `*` | token prefix only; err truncated |
| process-scheduled-sends | service-role JWT (Vault) + bearer match | yes | `*` | batch summary, no payload |
| feedback-load | anon (`--no-verify-jwt`) | yes | `*` | token prefix `slice(0,4)` only |
| feedback-submit | anon (`--no-verify-jwt`) | yes | `*` | token prefix only; err truncated |

**Good (INFO):** token logging is prefix-only; the public DTO in `feedback-load` excludes
internal emails/BCC/findings/names; `feedback-load` runs `sanitizeHtml()` over
`variants[].body_html` (with `plainTextToHtml` fallback) before returning to the public
page; subject/body sanitized server-side before Resend; idempotency keys on send.

**Findings:**
- **No application-level rate limiting (MED)** on `feedback-load` / `feedback-submit` /
  `retrigger-feedback-delta`. Only Supabase platform defaults apply. Exposed to scraping,
  valid-token spam, and LLM-cost abuse. → **Don't claim rate limiting in the doc;** put it
  on the roadmap. Note: `[auth.rate_limit]` in `config.toml` covers Auth endpoints (login,
  OTP) only — NOT these Edge Functions.
- **TSD §13.3 "5 submissions per token" is NOT implemented (INFO).** Instead the design is
  stricter — single-use via the `used_at` gate inside `submit_feedback` (`SELECT FOR
  UPDATE`). Functionally safer; the spec line is just stale. Idempotent replay returns the
  existing row, no duplicate LLM call.
- **No explicit request-body-size cap (LOW).** Mitigated by Zod bounds (free text ≤ 2000
  chars; chip arrays ≤ 6 × 50 chars). Practical payload < 10 KB. Acceptable.

## 0.5 CORS — **LOW**

`_shared/cors.ts` is wildcard `Access-Control-Allow-Origin: *`
([cors.ts:2](../../supabase/functions/_shared/cors.ts#L2)) for every function. Acceptable
for the anonymous token endpoints (feedback-load/submit are meant to be hit from a
client's browser on any origin). For JWT-gated functions it's looser than ideal — the JWT
is the real gate, but origin-restricting them is cheap hardening. **Action:** document the
decision; optional tightening for authenticated functions.

---

## 0.8 File-upload & storage privacy — **INFO (strong) + 1 LOW gap**

All verified:
- Bucket `brand-voice-samples` is **PRIVATE** (`public = false`) with **server-side**
  `file_size_limit = 10 MB` and a MIME allowlist (PDF/DOCX/TXT) on the bucket itself —
  [0002_storage_brand_voice_samples.sql:10-16](../../supabase/migrations/0002_storage_brand_voice_samples.sql#L10-L16).
  Client mirrors the same limits ([file-extraction.ts:4-40](../../src/lib/utils/file-extraction.ts#L4-L40)).
- **No `getPublicUrl` and no `createSignedUrl` anywhere** — raw files (copyrighted client
  press releases) are never exposed via URL. Storage paths use `crypto.randomUUID()`.
- **Only browser-extracted plain text reaches Anthropic**, never raw file bytes:
  `extract-voice` selects `content_text` from the DB
  ([extract-voice/index.ts](../../supabase/functions/extract-voice/index.ts)); no
  `storage.download()` exists. Extraction is client-side (`pdfjs-dist` / `mammoth`).
- Sample deletion removes the storage object explicitly
  ([useBrandVoiceSamples.ts](../../src/hooks/useBrandVoiceSamples.ts)).

**LOW gap:** deleting a *client* cascades the DB rows but does **not** remove their storage
objects → orphaned bytes accumulate. (Carry-forward; not a confidentiality issue since the
bucket is private.)

**Do NOT claim malware/AV scanning** — there is none.

---

## 0.10 Dependencies & secrets — **LOW**

- **Secret hygiene (INFO, clean):** no `.env`/`.env.local` tracked (`.gitignore` covers
  them); no server secrets referenced in `src/` (only a doc comment in
  `audit-signature.ts`); only placeholder keys (`sk-ant-xxx`) in docs/examples. Confirms
  no secret reaches the Vite client bundle.
- **`npm audit` (LOW): 10 advisories (3 low / 4 moderate / 3 high).** Notable: **react-router
  7.12–7.15 CSRF (high)** — a direct prod dependency — plus `js-yaml` and `qs` DoS
  (moderate). `npm audit fix` is available. **Action:** run `npm audit fix`, retest, before
  the doc claims a current dependency posture.

---

## Map: finding → doc treatment

| Finding | Doc treatment |
|---|---|
| 0.1 audit tables mutable | "tamper-evident," not "immutable"; roadmap item (or ship remediation) |
| 0.3 grant hardening + 2 residuals | not claimed as least-privilege unless remediation ships; roadmap |
| 0.4/0.6 no rate limiting | not claimed; roadmap |
| 0.5 wildcard CORS | documented decision; roadmap to tighten authenticated fns |
| 0.8 file privacy | claimed (private bucket, no public URLs, text-only to AI); no malware-scan claim |
| 0.10 deps | run `npm audit fix` first; then claim patched |
| MFA | not enabled → not claimed; roadmap |
| Data residency | primary DB/storage Japan; subprocessors cross-border (separate list) |

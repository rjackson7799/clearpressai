<!--
  DRAFT — verify before sending to a client.
  This draft only makes claims the Phase 0 code audit verified. A few claims are
  marked "pending confirmation" and depend on live checks in
  docs/security-audit/live-config-checklist.md (auth settings, encryption-at-rest
  wording, subprocessor certifications, backup tier, Anthropic terms).
  Resolve those, delete the bracketed notes and this banner, then share.
-->

# ClearPress AI — Security Overview

_Last updated: 2026-06-24_

ClearPress AI helps pharmaceutical PR firms draft compliance-aware content in a client's
brand voice, check it against 薬機法 / PMDA advertising rules, and deliver it for review.
We know the materials you share with us are sensitive and commercially valuable, and we
take protecting them seriously. This document summarizes how the service is built and
operated. We're happy to answer follow-up questions from your security team.

## Scope of data we handle

ClearPress processes your **PR and marketing materials** (brand-voice samples and
generated content), **business contact details** for the people who receive deliveries,
and the **compliance and audit records** the product produces. We do **not** process
patient data, clinical records, or any personal health information.

## Hosting & data residency

- The application front end is hosted on **Vercel**; our primary database and file
  storage run on **Supabase in the Tokyo, Japan region** — so your stored documents and
  records reside in Japan.
- To generate, format, and deliver content, limited data is processed by specialist
  providers that may operate **outside Japan** — see _Subprocessors_ below. We keep that
  list explicit rather than implying everything stays in one region.
- Data is encrypted **in transit** (TLS/HTTPS) and **at rest** by our infrastructure
  providers. _[Pending confirmation of provider at-rest wording.]_

## Authentication & access control

- Access requires an authenticated account. **Account creation is invite-only** — public
  sign-up is disabled, so only firm staff your administrator provisions can log in.
- Passwords require a **12-character minimum**, email addresses are **verified** before
  first use, and sessions use **rotating refresh tokens**. _[Pending confirmation that the
  cloud Auth settings match this configuration.]_
- **Every database table enforces row-level security**, so internal data is reachable
  only by an authenticated session. The one intentional exception is the client feedback
  link (see below), which uses a single-use token and exposes only that one review's
  content.
- This is a **single-firm deployment**: the environment serves your firm only, and all
  data is isolated to it.

## Your content & AI processing

- Content generation, brand-voice extraction, and compliance checking use **Anthropic's
  Claude API**. Only the **extracted text** of your documents is sent for processing — the
  **original uploaded files never leave our storage**.
- Under Anthropic's commercial API terms, **your content is not used to train AI models**.
  _[Pending confirmation against Anthropic's current commercial terms.]_
- The exact AI **model version** used for each action is recorded in the audit trail, as
  required for regulated recordkeeping.

## Audit trail & integrity

- The product maintains a chronological **audit trail** of key actions (content generated,
  compliance checked, signed off, delivered, feedback received), each attributed to a
  named actor and timestamp.
- Finalized audit reports are **cryptographically signed (HMAC-SHA-256)**, so any later
  alteration of a signed report's content is **detectable**, and the signature can be
  re-verified on demand.
- Each AI action records the **exact model-version string** used — supporting 薬機法 /
  PMDA traceability requirements.

## Application security

- **Secrets stay server-side.** API keys and the audit-signing secret are held only in our
  server environment and are never included in the browser application.
- **Input is sanitized at the server boundary.** Generated HTML and email content pass
  through an allowlist sanitizer before sending; email subjects are guarded against header
  injection.
- **Client feedback links** use **single-use, 256-bit random tokens that expire after 30
  days**, and reveal only the content needed for that one review — never internal staff
  details, recipient lists, or compliance findings.
- Inputs to our server functions are schema-validated with explicit length limits.

## File handling

- Uploaded brand-voice samples are stored in a **private** storage area with
  **server-enforced** file-type (PDF / DOCX / TXT) and **10 MB** size limits, and are
  **never exposed through public links**.
- Note: we do not currently perform malware/antivirus scanning on uploads; access is
  limited to authenticated firm staff.

## Subprocessors

The following providers process data on our behalf. _[Confirm each provider's current
certification and processing region before sending — see live-config-checklist.md §0.11.]_

| Provider  | Purpose                              | Data handled                         | Region (verify) | Posture (verify) |
|-----------|--------------------------------------|--------------------------------------|-----------------|------------------|
| Supabase  | Database, storage, auth, functions   | All stored data                      | Tokyo, Japan    | SOC 2 Type II    |
| Vercel    | Front-end hosting / edge             | App delivery; request logs           | US / global edge| SOC 2 Type II    |
| Anthropic | AI generation & compliance checking  | Extracted text, briefs, guidelines   | US              | SOC 2 Type II    |
| Resend    | Email delivery                       | Recipient address, subject, body     | US              | _verify_         |
| pdfshift  | PDF rendering of deliveries          | Rendered document HTML               | _verify_        | _verify_         |

We can provide or sign a **Data Processing Agreement** on request. _[Confirm DPA status.]_

## Reliability & data lifecycle

- The database is backed up by our managed infrastructure provider. _[Confirm backup /
  point-in-time-recovery tier and retention window.]_
- Retention: records are retained for the life of the engagement. _[Confirm/define a formal
  retention policy.]_

## Continuous improvement

We treat security as ongoing. Items actively on our hardening roadmap include:
database-level append-only enforcement of the audit trail, least-privilege tightening of
internal database functions, application-level rate limiting on public feedback links,
multi-factor authentication, and pursuing a formal third-party security attestation.
(Our infrastructure providers already maintain independent SOC 2 attestations.)

## Contact

Security questions or to report a concern: **security@clearpressai.com** _[Confirm address.]_

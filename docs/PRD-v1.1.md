# ClearPress AI — v1 Product Requirements Document (Stripped-Down MVP)

**Version**: 1.1
**Last Updated**: May 10, 2026
**Status**: Scope Definition — Updated post-mockup review
**Relationship to original PRD**: Supersedes the original PRD for v1 build scope only. The original PRD remains the reference target for v2.

---

## Changelog from v1.0 → v1.1

This revision integrates decisions surfaced during mockup review. No structural changes; targeted additions and clarifications only.

| Section | Change |
|---|---|
| §0 (new) | Added **Documentation Set** section referencing the mockup files as part of the v1 spec |
| §5.1 | Brand voice guidelines now have **multiple sources** (client feedback + internal annotations), not just feedback |
| §5.2 | Each variant carries **reading-time and character-count metadata** as standard fields |
| §5.3 | **Audit report versioning** model added (V1.0 → V1.1 on post-sign-off corrections) |
| §5.3 | **Exact model version strings** required in audit trail (not friendly names) |
| §5.3 | Schema must support **multiple sign-offs** even if v1 only uses single |
| §5.4 | **Scheduled send** added to scope (送信予約) |
| §5.4 | **Auto-generated variant comparison summary** added to delivery emails |
| §5.4 | **Pre-send checklist** pattern codified: auto-verified vs. human-confirmed items |
| §5.4 | **Sender identity model** clarified (firm email primary, ClearPress fallback) |
| §6 (new) | Added **Internal vs. External Visual Posture** as a design principle |
| §7 | Open decisions narrowed; mockup-resolved items removed |

---

## Table of Contents

0. [Documentation Set](#0-documentation-set)
1. [Why This Document Exists](#1-why-this-document-exists)
2. [What's In, What's Out](#2-whats-in-whats-out)
3. [User Personas](#3-user-personas)
4. [Core User Journey](#4-core-user-journey)
5. [Feature Specifications](#5-feature-specifications)
6. [Design Principles](#6-design-principles)
7. [Technical Scope](#7-technical-scope)
8. [Open Design Decisions](#8-open-design-decisions)
9. [Roadmap to v2](#9-roadmap-to-v2)
10. [Success Criteria](#10-success-criteria)

---

## 0. Documentation Set

The v1 specification is composed of multiple documents that must be read together. No single document is sufficient on its own.

```
/clearpress-ai
  /docs
    PRD.md                                 ← this document
    TSD.md                                 ← technical specification (to be written)
    DESIGN.md                              ← design system tokens, typography, components
    /mockups
      README.md                            ← index mapping mockups to PRD sections
      01-client-brand-voice.html
      01-client-brand-voice-empty.html
      02-new-content-request.html
      03-variant-review-side-by-side.html
      03-variant-review-single-view.html
      03-variant-review-history-tab.html
      04-audit-report.html
      05-delivery-composer.html
      06-feedback-page-mobile.html
      06-feedback-page-form-active.html
      06-feedback-page-confirmation.html
```

**How to use the mockups:**

- The HTML files are **visual reference**, not implementation reference. They were generated as prototypes (via claude.ai/design) and contain prototype-quality code: inline styles, hardcoded strings, missing accessibility attributes, no responsive breakpoints below demo size, no real state management.
- Developers should re-implement against the actual component library (React + Tailwind + shadcn/ui per DESIGN.md), using the mockups as "this is what it should look like and behave like" — not as code to start from.
- For edge cases or new pages not yet mocked, **reference existing patterns** in the mockup set rather than re-deriving design decisions.
- The `mockups/README.md` indexes each file with its PRD section, the state it represents, and any known gaps.

**Required mockup states still to be generated** (gaps in current set):

- Client brand voice page — empty state (no samples uploaded)
- Variant review — single-view (`個別表示`) mode
- Variant review — History tab active
- Feedback page — feedback form active with chips selected
- Feedback page — post-submit confirmation state
- Dashboard / project list (not yet mocked)
- Login / auth screens (not yet mocked)
- Settings (not yet mocked)

---

## 1. Why This Document Exists

The original ClearPress AI design specifies a multi-tenant B2B SaaS platform with three user roles, a mobile-first client portal, real-time collaboration with track-changes, and a 12–16 week build. That scope is sound — but it is a v2 product, not a v1.

**v1 is a single-user-class internal tool for PR firms.** It validates the core AI value (brand-voice extraction, compliance-aware generation, 3-version variation, feedback-driven voice improvement) before investing in client-facing infrastructure. Clients receive deliverables the way they already do today: by email, with finished documents attached.

### Validation goals for v1

- Does brand-voice extraction from uploaded past releases produce content the firm can ship with light editing?
- Does compliance checking against 薬機法 / PMDA catch issues that match what human reviewers find?
- Does the 3-version-with-feedback loop measurably improve brand-voice match over time, per client?
- Will at least 2–3 PR firms in Japan pay for this within 90 days of launch?

### What changes vs. the original PRD

| Original PRD | v1 PRD |
|---|---|
| 3 user roles (PR Admin, PR Staff, Client User) | 1 user role (Internal User at the PR firm) |
| Client portal with login | No client portal — clients receive deliverables via email |
| Real-time collaboration / track-changes | Tokenized magic-link feedback page (no login) |
| Mobile-first PWA for clients | Desktop responsive web app for firm staff only |
| Multi-tenant RLS | Single-firm-per-deployment, or simple org-scoped queries |
| 1 generated draft per request | 3 variants per request, with structured feedback loop |
| Static brand voice via prompt | Dynamic per-client brand voice that learns from feedback |
| 12–16 week build | ~3–4 week build (estimate, subject to scoping) |

---

## 2. What's In, What's Out

### In Scope (v1)

| Capability | Notes |
|---|---|
| Internal User accounts | Single role, no admin/staff hierarchy |
| Client records | Profile data, samples, project history. **No client login.** |
| Brand voice library per client | Upload past releases; extracted voice profile; guidelines doc with multiple sources |
| Project / brief creation | Free-text brief + structured fields |
| AI content generation — 3 variants per request | Default variation axis: tone (formal / balanced / accessible) |
| Compliance checking against 薬機法 / PMDA | Runs independently per variant |
| Internal compliance audit report | Per-variant, with severity-tagged issues, sign-off, audit trail, versioning |
| Internal review and edit | PR staff edits or regenerates any variant |
| Export to PDF / Word | Per variant or combined |
| Email delivery to client | Sent via Resend; **scheduled send (送信予約) supported**; firm-identity sender |
| Auto-generated variant comparison summary in delivery email | Generated from actual variant differences |
| Tokenized client feedback page | Public, no login, expires in 30 days, mobile-first |
| Brand voice continuous improvement | Chosen variants + feedback feed back into client's voice profile |
| Six content types | Press release, blog post, social media, internal memo, FAQ, executive statement |
| Bilingual UI | Japanese default, English toggle visible in header |

### Out of Scope (deferred to v2+)

| Capability | Why deferred |
|---|---|
| Client login / client portal | Email + magic link is sufficient to validate the model |
| Multi-tenant Row Level Security | Defer until multiple firms share one deployment |
| Real-time collaboration | Not needed for email-based delivery |
| Inline track-changes / suggestions | Replaced by structured feedback form |
| Mobile PWA | Firm staff are at desks; clients only need a feedback page |
| In-app notifications | Email notifications cover v1 needs |
| Multi-state approval workflow | Simplified to: draft → reviewed → delivered → feedback received |
| Streaming generation | Standard request/response is fine for v1 |
| Analytics dashboard | Defer until there's enough usage data to be worth analyzing |
| Additional industries | Pharmaceutical (Japan) only for v1 |
| Dual sign-off enforcement | Schema supports multiple sign-offs; v1 enforces single |

---

## 3. User Personas

### Internal User (PR Firm Staff)

The only user class in v1. All v1 users have identical permissions; role separation is added in v2 only if firms request it.

**Responsibilities:**
- Maintain client records and brand voice libraries
- Create projects from client briefs
- Generate, review, and edit AI-produced content
- Run compliance audits and resolve flagged issues
- Send deliverables to clients and incorporate feedback
- Export final approved content

**Tools they use today** (that v1 must beat or replace):
- Word / Google Docs for drafting
- Email for client back-and-forth
- Manual review against regulatory guidelines
- Personal knowledge of each client's voice

### Client (record only, not a user)

Clients exist as records in the system. They have profile data, brand voice samples, and project history, but **no account and no login**. Their interaction with the system is limited to:
1. Receiving emails containing draft variants and a feedback link
2. Optionally clicking the feedback link and submitting a structured response

---

## 4. Core User Journey

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CLIENT SETUP (one-time per client)                       │
│    Internal User creates client record                      │
│                                                             │
│ 2. BRAND VOICE SETUP (one-time, then ongoing)               │
│    Upload 5–20 past press releases / content samples        │
│    System extracts voice profile (tone, patterns, vocab,    │
│      avoid-list, signature phrases, length norms)           │
│    User reviews and edits the extracted profile             │
│    Guidelines doc seeded with extraction;                   │
│      grows from feedback + internal annotations             │
│                                                             │
│ 3. NEW CONTENT REQUEST                                      │
│    Select client + content type + urgency                   │
│    Enter brief (free text + structured fields)              │
│    Choose variation axis (default: tone)                    │
│                                                             │
│ 4. AI GENERATES 3 VARIANTS                                  │
│    All 3 use same brand voice + same brief                  │
│    Variants differ along chosen axis                        │
│    Each variant runs through compliance check independently │
│    Each variant carries metadata: char count, reading time  │
│                                                             │
│ 5. INTERNAL REVIEW                                          │
│    User views 3 variants side-by-side or single-view        │
│    Edits inline or regenerates any variant                  │
│    Reviews per-variant compliance audit report              │
│    Resolves blockers; accepts or annotates warnings         │
│    Approves variants individually                           │
│                                                             │
│ 6. AUDIT REPORT GENERATION & SIGN-OFF                       │
│    Formal audit report generated with full audit trail      │
│    Reviewer signs off (digital signature + hash)            │
│    Report versioned (V1.0); revisions create V1.1, V1.2…    │
│                                                             │
│ 7. DELIVERY TO CLIENT                                       │
│    User configures delivery (1, 2, or 3 variants)           │
│    System auto-generates comparison summary for email       │
│    System composes email; user edits as needed              │
│    Pre-send checklist: 3 auto-verified items + 1 manual     │
│    Send immediately OR schedule (送信予約)                  │
│    Email sent from firm's identity (with reply-to honored)  │
│                                                             │
│ 8. CLIENT FEEDBACK (via tokenized magic link)               │
│    Client opens link → no login required, mobile-first      │
│    Reads variants, selects preferred one                    │
│    Submits structured feedback                              │
│                                                             │
│ 9. BRAND VOICE UPDATE                                       │
│    Chosen variant added to client's approved-examples pool  │
│    Feedback distilled into voice-guideline delta            │
│    Future generations for this client incorporate updates   │
│                                                             │
│ 10. FINAL DELIVERABLE                                       │
│    User incorporates feedback, exports final version        │
│    Marks project complete                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Feature Specifications

### 5.1 Brand Voice Library

Stored per client.

**Components:**
- **Sample documents.** Uploaded past releases (PDF, DOCX, TXT). Minimum 5; recommended 10–20.
- **Extracted voice profile** — auto-generated, user-editable:
  - Tone keywords
  - Common sentence structures
  - Preferred vocabulary; forbidden words
  - Length norms per content type
  - Signature phrases and recurring company language
- **Voice guidelines doc.** Free-text guidelines that grow over time from **multiple sources**:
  - Client feedback (via the magic-link feedback page)
  - Internal manual annotations (e.g., "client mentioned on a call that…", "legal review correction", "department style guide note")
  - Each entry is timestamped and attributed to its source
- **Approved-examples pool.** Variants chosen by the client through the feedback loop. Used as in-context few-shot examples in future generations.

**Extraction pipeline** (runs on upload):
1. Parse documents to plain text
2. LLM analyzes corpus and outputs structured voice profile
3. User reviews + edits before saving

**Important constraint:** all voice learning is per-client, never cross-client. Each client's voice is private and isolated.

**Reference mockup:** `01-client-brand-voice.html`

### 5.2 Three-Version Generation

Every content request produces 3 variants by default.

**Variation axis** (configurable per request):
- **Default — tone:** Formal / Balanced / Accessible
- **Alternate — structural:** Lead-with-data / Lead-with-quote / Lead-with-announcement
- **Alternate — length:** Concise / Standard / Detailed

Each variant:
- Uses the same brand voice profile and brief
- Runs through the full compliance pipeline independently
- Receives its own compliance audit report
- Can be edited or regenerated independently
- Carries standard metadata: **character count**, **estimated reading time** (e.g., 約1分で読了), **compliance status**, **internal approval status**

**Cost note:** ~3× API cost per generation. Acceptable for v1; the variation is part of the value proposition. Mitigations: parallel generation, shared compliance prompts, caching brand voice context.

**Reference mockups:** `02-new-content-request.html`, `03-variant-review-side-by-side.html`

### 5.3 Compliance Audit Report

Internal-facing, per project (covering all 3 variants).

**Includes:**
- Per-variant findings, severity-tagged (blocker / warning / note)
- Quoted source text with proposed correction (before/after diff)
- Specific 薬機法 / PMDA citations for each flag
- Required disclosure checklist (ISI, clinical references, company boilerplate)
- Reviewer sign-off section with digital signature hash (SHA-256) and timestamp
- Full audit trail of all system and user actions on the project

**Audit trail must record:**
- Generation events with the **exact model version string** (e.g., `claude-sonnet-4-5-20251022`), not friendly names. This is a regulatory requirement, not a nice-to-have.
- Compliance check events with which regulation sources were applied
- Manual review start/end timestamps
- Each fix application (which suggestion, applied to which variant)
- Re-checks after fixes
- Sign-off events with signer identity and signature hash

**Versioning:**
- Initial audit report is **V1.0 確定 (Finalized)**
- Post-sign-off corrections produce **V1.1, V1.2, …** with full provenance from the prior version
- All versions retained; latest is canonical but prior versions remain accessible

**Sign-off model:**
- v1 enforces **single reviewer sign-off** (one signer per audit report)
- Schema **must support multiple sign-offs** (PR reviewer + compliance officer + legal counsel) for v2 dual/triple sign-off without migration

**Reference mockup:** `04-audit-report.html`

### 5.4 Client Delivery

Email-based, no portal.

**Email composition:**
- Composed in-app with rich text editor
- Subject and body auto-generated from template, fully editable
- **Auto-generated variant comparison summary** included in the body — generated by comparing the actual variants, not boilerplate. Each variant gets a 1-line description of how it differs (e.g., "案2 バランス: 見出しを動かし、データ要約を冒頭に").
- Recipient is the client contact; CC optional
- BCC internal team configurable per firm

**Sender identity model:**
- **Primary:** send from the Internal User's own email address (via OAuth integration with Gmail/Outlook). Replies land naturally in their inbox.
- **Fallback:** send from a ClearPress-managed address with reply-to set to the user, used only if OAuth not configured.
- The active sending identity is shown in the composer.

**Attachments:**
- PDF, Word, or both — configurable per delivery
- 1, 2, or 3 variants attached — configurable per delivery
- Default: all 3 attached as both PDF and Word

**Send timing:**
- **Immediate send** — default
- **Scheduled send (送信予約)** — pick a future date/time in JST. Respects:
  - Business hours warning (no scheduling 22:00–06:00 without confirmation)
  - Japanese holidays (`祝日`) flagged with warning
  - Embargo workflows (clinical conference times, market open/close)

**Pre-send checklist** — codified pattern: distinguish machine-verified from human-confirmed.
- **Auto-verified** (system pre-checks, no user action needed):
  - All variants internally reviewed
  - Compliance blockers resolved
  - Brand voice applied
- **Human-confirmed** (requires deliberate user click):
  - Subject and body final-checked
- Send button is **disabled** until the human-confirmed items are checked.

**Feedback magic link:**
- Tokenized URL, expires in 30 days (configurable)
- Scoped to one project, one delivery
- Public — no login required
- Mobile-friendly responsive page
- Auto-reminder configurable (default: send reminder at day 7 if no feedback received)

**Reference mockup:** `05-delivery-composer.html`

### 5.5 Feedback Page (public, tokenized)

What the client sees when they click the magic link.

**Layout:**
- Standalone page — does NOT use the internal app shell (no sidebar, no top bar)
- Firm branding at top (not ClearPress branding); the page should feel like it's from the PR firm
- Mobile-first; desktop is a constrained-width version of the same layout
- Project context: name, content type, date, response deadline
- Variants displayed as tabs (案1 / 案2 / 案3); each variant readable in full
- Reading-time estimate shown per variant
- Selection CTA per variant: `このバージョンを選択`
- Structured feedback form (expands on selection):
  - **良かった点** (What worked) — multi-select chips
  - **改善できる点** (What to improve) — multi-select chips
  - **その他コメント** (Free-text comments) — optional textarea
  - **どの案も再検討が必要** (None of these — needs rework) — optional escape hatch
- Submit → confirmation page

**Tonal direction:** the page must feel like a polite business email extension, not a software product. No "AI" or "generate" language exposed. Minimal chrome.

**Language toggle** present in header, defaulting to Japanese.

**Reference mockups:** `06-feedback-page-mobile.html`, `06-feedback-page-form-active.html`, `06-feedback-page-confirmation.html`

### 5.6 Brand Voice Improvement Loop

Triggered when client submits feedback.

**Steps:**
1. Store the chosen variant ID, structured feedback, free text, and timestamp
2. Add the chosen variant to the client's approved-examples pool, weighted higher than uploaded historical samples
3. Run a "voice-guideline delta" generation: an LLM call that summarizes the feedback into 1–3 guideline updates
4. Append the delta to the client's voice guidelines doc, with timestamp and source feedback ID
5. Future generations for this client include the updated approved-examples pool and the updated guidelines doc as part of the system prompt

**Roll-back:** if a generated voice-guideline delta is wrong or contradictory, the Internal User can edit or remove it from the guidelines doc.

---

## 6. Design Principles

(New section in v1.1 — codifies design conventions surfaced during mockup review.)

### 6.1 Internal vs. External Visual Posture

ClearPress AI has **two distinct visual postures** within a single coherent identity:

- **Internal pages** (used by firm staff): dense, information-rich, tool-like. Multiple panels, inline flags, keyboard-driven, power-user affordances.
- **External pages** (used by clients via magic links): sparse, document-like, respectful of the reader's time. Minimal chrome, generous whitespace, mobile-first.

Both share the same color palette, typography, and component vocabulary. Only the *density* and *posture* differ.

### 6.2 "You Have Enough to Proceed" Pattern

Across multiple pages (brand voice setup, brief input, etc.), the system shows users an explicit signal when they have enough input to move forward (`分析に十分`, `十分な内容です`). This pattern reduces new-user anxiety and should be applied consistently:
- Brand voice page: when sample count crosses minimum threshold
- Brief input: when free-text brief reaches sufficient length
- Anywhere else a user might wonder "is this enough?"

### 6.3 Bilingual Label Pattern

Throughout the internal app, key UI labels render bilingually: Japanese primary, English secondary in lighter weight. The language toggle in the header switches the *primary* language but does not hide the secondary. This pattern:
- Makes the app usable by non-Japanese stakeholders (foreign pharma execs, English-speaking team members) without disrupting Japanese users
- Should NOT be applied to body content (variant text, brief content, etc.) — only to UI labels

### 6.4 Document Feel for Compliance Artifacts

The audit report (and any future regulatory artifact) must feel like a formal document, not a SaaS screen. Conventions:
- Report ID with version
- Page count and watermarks (`関係者外秘`, `CONFIDENTIAL`)
- Stamp-style approval marks (`承認済` hanko-style)
- Cryptographic signature with hash visible
- Audit trail table

Screen view and PDF export should be visually nearly identical.

---

## 7. Technical Scope

### Reused from original architecture
- **Frontend:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- **State:** TanStack Query + React Context
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI:** Claude API (specific model version pinned and recorded in audit trail)
- **Email:** Resend (with Gmail/Outlook OAuth for firm-identity sending)
- **Editor:** Tiptap (for inline editing of variants)

### Simplified for v1
- **Single user role.** No client_users table; no role-based permissions logic
- **No real-time.** No Supabase Realtime subscriptions
- **No PWA.** Standard responsive web app
- **No notifications system.** Email only
- **Lightweight RLS.** Recommended at table level for safety, but no client-user access patterns to enforce

### New for v1
- **Brand voice extraction pipeline.** LLM-based, runs on document upload
- **Magic-link tokenization** for public feedback pages
- **Feedback storage and brand voice update job**
- **3-variant generation orchestration**
- **Auto-generated variant comparison summary** (for delivery emails)
- **Audit report versioning system**
- **Scheduled send infrastructure** (job queue or Supabase cron)
- **Sender identity OAuth integration** (Gmail/Outlook for firm-identity sending)

### Database changes vs. original schema

Most of the original schema is reusable. Key differences:
- `client_users` — **drop**
- `client_suggestions`, `approvals` — **drop**
- `brand_voice_profiles` — **add**
- `brand_voice_samples` — **add**
- `brand_voice_guidelines` — **add** (multi-source: feedback + internal annotations)
- `content_variants` — **add** (3 per content_item, each with metadata)
- `feedback_tokens` — **add**
- `client_feedback` — **add**
- `audit_reports` — **add** (with version chain)
- `audit_signatures` — **add** (schema supports multiple sign-offs)
- `audit_trail_events` — **add** (with model version strings logged)
- `scheduled_sends` — **add**

---

## 8. Open Design Decisions

Items resolved by mockup review are removed. Remaining open items:

| # | Decision | Recommendation |
|---|---|---|
| 1 | **Feedback gating** — should feedback be required before final export? | Optional but encouraged. Don't block firm workflows on client response time. |
| 2 | **Voice baseline source** — uploads vs. learned feedback weighting | Weighted blend: uploads define structure; feedback refines tone. Specific weights TBD in TSD. |
| 3 | **Cross-content-type voice transfer** — can press-release samples inform a blog brief? | Yes, with on-screen warning. |
| 4 | **Cost ceiling for 3-variant generation** | Set per-firm monthly token budget. Show usage in-app. Specific limits TBD post-pilot. |
| 5 | **If client never clicks the feedback link** | Send one polite reminder at day 7. After 30 days, token expires; record as "no feedback received." |
| 6 | **Verbatim feedback display to firm** | Show verbatim. Free-text comments are often the most useful learning signal. |
| 7 | **"Recommended" variant flag from firm to client** | TBD — does Aiko set a preferred variant before sending? Captures internal preference signal. |

---

## 9. Roadmap to v2

If v1 succeeds, v2 candidates in rough priority order:

1. **Client portal** — only if firms request it
2. **Multi-firm tenancy** — real RLS, organization isolation, billing
3. **Real-time collaboration / track-changes**
4. **Additional industries** — healthcare, finance, tech
5. **Translation engine** — JP↔EN with cultural adaptation
6. **Per-client fine-tuned models**
7. **Analytics dashboard**
8. **Mobile PWA**
9. **Dual sign-off enforcement** (schema is already in place from v1)
10. **Real-time compliance check during editing** (currently only post-generation)

---

## 10. Success Criteria

v1 is considered successful if, within 90 days of launch:

- **Adoption:** 2–3 PR firms onboarded as paying customers
- **Quality:** ≥70% of generated drafts ship with only light edits (firm self-reported)
- **Voice convergence:** average feedback iterations per client to reach "consistent voice match" is fewer than 5 (firm self-reported)
- **Feedback loop completion:** ≥50% of client deliveries return feedback through the magic link
- **Compliance accuracy:** automated compliance check catches ≥80% of issues that human reviewers later flag

---

## Appendix A: Build Estimate (rough)

| Phase | Duration | Scope |
|---|---|---|
| Foundation | ~1 week | Supabase setup, auth (firm-side only), schema migrations, basic UI shell |
| Brand voice | ~1 week | Upload pipeline, extraction, profile editor |
| Generation + compliance | ~1 week | 3-variant orchestration, compliance pipeline, internal review UI |
| Delivery + feedback | ~0.5–1 week | Email delivery, magic-link page, feedback storage, voice update loop, scheduled send |
| Audit report & sign-off | ~0.5 week | Formal audit report PDF generation, signature flow, version chain |
| Polish + QA | ~0.5 week | Bilingual UI, exports, edge cases |

**Total: ~4–5 weeks** for a focused build, vs. 12–16 weeks for the original scope.

The single largest source of estimate uncertainty is **brand voice extraction quality**. Prototype this before committing to full build (see TSD §brand_voice_extraction once written).

---

## Appendix B: Critical Path

The single load-bearing technical uncertainty in v1 is **whether the brand voice extraction produces specific, useful profiles** rather than generic "professional, clear, informative" placeholders. Recommendation: prototype this in isolation with 2–3 real client sample sets before writing the TSD and committing to the full build. A 2–3 day prompt-engineering sprint resolves this risk for the cost of a few days, not weeks.

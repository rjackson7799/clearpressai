# ClearPress AI — v1 Technical Specification Document

**Version**: 1.0
**Last Updated**: May 10, 2026
**Status**: v1 MVP Implementation Reference
**Companion documents**: `PRD-v1.1.md`, `DESIGN.md`, `docs/mockups/` (visual reference only)
**Replaces for v1 scope**: the v2 TSD at project root (which remains the v2 reference target)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure & Setup](#3-project-structure--setup)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [AI Integration](#6-ai-integration)
7. [Edge Function API](#7-edge-function-api)
8. [Magic-Link Feedback System](#8-magic-link-feedback-system)
9. [Email Delivery](#9-email-delivery)
10. [Audit Trail & Versioning](#10-audit-trail--versioning)
11. [Frontend Architecture](#11-frontend-architecture)
12. [PDF Export](#12-pdf-export)
13. [Security](#13-security)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment](#15-deployment)
16. [Implementation Sequence](#16-implementation-sequence)

---

## 1. System Overview

### 1.1 Architecture (v1)

```
┌─────────────────────────────────────────────────────────────┐
│                          CLIENTS                            │
│  ┌───────────────────────┐    ┌──────────────────────────┐  │
│  │  Internal Web App     │    │  Public Feedback Page    │  │
│  │  (PR firm staff)      │    │  (Client, no login)      │  │
│  │  Desktop responsive   │    │  Mobile-first responsive │  │
│  └──────────┬────────────┘    └────────────┬─────────────┘  │
└─────────────┼─────────────────────────────┼─────────────────┘
              │ HTTPS                       │ HTTPS (tokenized)
              ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE PLATFORM                      │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Auth    │ │ PostgreSQL │ │  Storage │ │   pg_cron    │  │
│  └──────────┘ └────────────┘ └──────────┘ └──────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Edge Functions (Deno)                  │    │
│  │  /extract-voice    /generate-variants               │    │
│  │  /compliance-check /apply-feedback                  │    │
│  │  /send-delivery    /process-scheduled-sends         │    │
│  │  /feedback-submit  /generate-audit-pdf              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│  ┌──────────────────────┐  ┌────────────────────────────┐   │
│  │  Anthropic Claude    │  │  Resend (Email)            │   │
│  │  - Brand voice       │  │  - Delivery to clients     │   │
│  │  - Variant gen       │  │  - Reminder emails         │   │
│  │  - Compliance check  │  │  - Internal notifications  │   │
│  │  - Guideline deltas  │  └────────────────────────────┘   │
│  └──────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Key v1 Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Tenancy model | Single-firm-per-deployment | Simplest path; multi-tenant deferred to v2 |
| Auth | Supabase Auth, single role | No client logins; firm staff only |
| RLS | Light (table-level, defensive) | No client_user access patterns to enforce |
| Realtime | None | Email-based delivery sufficient |
| AI | Claude API (model version pinned) | Better Japanese, longer context, structured output |
| PDF generation | Client-side via browser print | Avoids Deno PDF library complexity for v1 |
| Scheduled jobs | Supabase pg_cron | Native, no external queue needed |
| Email | Resend with managed sender | Gmail/Outlook OAuth deferred to v1.1 |
| File storage | Supabase Storage | Brand voice samples, generated PDFs |

---

## 2. Technology Stack

### 2.1 Frontend

| Component | Choice | Version |
|---|---|---|
| Framework | React | 18.3+ |
| Language | TypeScript | 5.5+ |
| Build tool | Vite | 5.4+ |
| Styling | Tailwind CSS | 3.4+ |
| Component library | shadcn/ui | latest |
| Forms | React Hook Form + Zod | latest |
| State (server) | TanStack Query | 5+ |
| State (client) | React Context + useState | — |
| Routing | React Router | 6+ |
| Rich text editor | Tiptap | 2+ |
| Date/time | date-fns | 3+ |
| Icons | Lucide React | latest |
| i18n | react-i18next | latest |

### 2.2 Backend

| Component | Choice |
|---|---|
| Database | Supabase PostgreSQL 15+ |
| Auth | Supabase Auth (GoTrue) |
| Storage | Supabase Storage |
| Edge functions | Supabase Edge Functions (Deno) |
| Scheduling | Supabase pg_cron extension |
| Email | Resend |
| AI | Anthropic Claude API |

### 2.3 Pinned versions for AI

Pin the specific Claude model in the codebase **as a constant**, not as a friendly name. This is a regulatory requirement for the audit trail.

```typescript
// src/config/ai.ts
export const CLAUDE_MODELS = {
  brand_voice_extraction: 'claude-sonnet-4-5-20251022',
  variant_generation: 'claude-sonnet-4-5-20251022',
  compliance_check: 'claude-sonnet-4-5-20251022',
  voice_guideline_delta: 'claude-haiku-4-5-20251001',
} as const;
```

Use the smaller Haiku model for cheap operations (guideline delta extraction). Use Sonnet for everything else.

---

## 3. Project Structure & Setup

### 3.1 Repository Layout

```
clearpress-ai/
├── docs/
│   ├── PRD-v1.1.md
│   ├── TSD-v1.md                  ← this document
│   ├── DESIGN.md
│   └── mockups/                    (visual reference; not used at build time)
├── src/
│   ├── components/
│   │   ├── ui/                     (shadcn/ui components)
│   │   ├── client/                 (client management)
│   │   ├── brand-voice/            (voice profile UI)
│   │   ├── project/                (project + brief input)
│   │   ├── review/                 (3-variant review)
│   │   ├── audit/                  (audit report UI)
│   │   ├── delivery/               (delivery composer)
│   │   ├── feedback/               (public feedback page)
│   │   └── shared/                 (layouts, nav, language toggle)
│   ├── pages/
│   ├── lib/
│   │   ├── supabase.ts             (Supabase client)
│   │   ├── claude.ts               (Claude API client wrapper)
│   │   ├── prompts/                (all prompt templates)
│   │   │   ├── brand-voice.ts
│   │   │   ├── variant-generation.ts
│   │   │   ├── compliance.ts
│   │   │   └── guideline-delta.ts
│   │   └── utils/
│   ├── types/
│   │   ├── database.ts             (generated from Supabase)
│   │   └── domain.ts               (domain types)
│   ├── hooks/
│   ├── locales/
│   │   ├── ja.json
│   │   └── en.json
│   └── config/
├── supabase/
│   ├── migrations/                 (SQL migrations, ordered)
│   ├── functions/                  (Edge Functions, one folder each)
│   │   ├── extract-voice/
│   │   ├── generate-variants/
│   │   ├── compliance-check/
│   │   ├── apply-feedback/
│   │   ├── send-delivery/
│   │   ├── process-scheduled-sends/
│   │   ├── feedback-submit/
│   │   └── generate-audit-pdf/
│   ├── seed.sql
│   └── config.toml
├── public/
├── .env.local                       (gitignored; see §3.3)
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

### 3.2 Initial Setup Commands

```bash
# Project initialization
npm create vite@latest clearpress-ai -- --template react-ts
cd clearpress-ai
npm install

# Core dependencies
npm install @supabase/supabase-js @anthropic-ai/sdk react-router-dom
npm install @tanstack/react-query react-hook-form zod @hookform/resolvers
npm install date-fns lucide-react react-i18next i18next
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder

# Dev dependencies
npm install -D tailwindcss postcss autoprefixer @types/node
npm install -D supabase

# Tailwind init
npx tailwindcss init -p

# shadcn/ui init
npx shadcn-ui@latest init

# Supabase init (creates supabase/ directory)
npx supabase init
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

### 3.3 Environment Variables

`.env.local` (never commit):

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Anthropic (used only in Edge Functions; set as Supabase secret)
ANTHROPIC_API_KEY=sk-ant-xxx

# Resend (set as Supabase secret)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourfirm.com
RESEND_FROM_NAME="Your Firm Name"

# App
VITE_APP_URL=http://localhost:5173
VITE_FEEDBACK_BASE_URL=http://localhost:5173/f
```

Edge Function secrets are set via:

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
npx supabase secrets set RESEND_API_KEY=re_xxx
```

---

## 4. Database Schema

### 4.1 Schema Overview

```
auth.users (Supabase managed)
    │
    ▼
users (firm staff profile)
    │
    ▼
clients ──────► brand_voice_profiles
    │                  │
    │                  ├──► brand_voice_samples
    │                  └──► brand_voice_guidelines
    ▼
projects ──────► content_items
                    │
                    ├──► content_variants (3 per item)
                    │       └──► compliance_findings
                    │
                    ├──► audit_reports (versioned)
                    │       └──► audit_signatures
                    │       └──► audit_trail_events
                    │
                    └──► deliveries
                            │
                            ├──► scheduled_sends
                            └──► feedback_tokens
                                    │
                                    └──► client_feedback
```

### 4.2 Tables (SQL)

```sql
-- =========================================
-- Migration: 0001_initial_schema.sql
-- =========================================

-- ====== USERS ======
-- Firm staff profile, joined to auth.users
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  full_name_kana text,
  role text not null default 'internal_user', -- only role in v1
  language_pref text not null default 'ja' check (language_pref in ('ja', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ====== CLIENTS ======
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,                          -- e.g., 田中製薬株式会社
  name_en text,                                -- e.g., Tanaka Pharmaceutical Co., Ltd.
  industry text not null default 'pharmaceutical',
  primary_contact_name text,
  primary_contact_email text,
  notes text,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_clients_name on clients(name);

-- ====== BRAND VOICE ======
create table brand_voice_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  -- Structured profile extracted from samples
  tone_keywords jsonb not null default '[]',           -- ["権威的", "慎重", "データ重視"]
  stylistic_patterns text,                              -- 1-3 paragraphs of prose
  preferred_vocabulary jsonb not null default '[]',     -- ["示唆された", "臨床的意義"]
  words_to_avoid jsonb not null default '[]',           -- ["画期的", "革命的"]
  signature_phrases jsonb not null default '[]',
  length_norms jsonb not null default '{}',             -- {"press_release": "1000-1400字", ...}
  last_extracted_at timestamptz,
  user_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id)
);

create table brand_voice_samples (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  filename text not null,
  storage_path text not null,                  -- in Supabase Storage
  file_size_bytes int not null,
  content_text text,                            -- extracted plain text
  uploaded_by uuid not null references users(id),
  uploaded_at timestamptz not null default now()
);

create index idx_samples_client on brand_voice_samples(client_id);

create table brand_voice_guidelines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  guideline_text text not null,
  source_type text not null check (source_type in (
    'client_feedback',       -- generated from feedback magic-link submission
    'internal_annotation',   -- manually added by firm staff
    'extraction',            -- generated during initial brand voice extraction
    'legal_review'           -- noted from legal/compliance review
  )),
  source_reference text,                        -- e.g., "Feedback from project XYZ", "Yamada-san comment 5/3"
  source_feedback_id uuid,                      -- nullable; links to client_feedback if applicable
  created_by uuid references users(id),         -- nullable for auto-generated
  created_at timestamptz not null default now(),
  archived boolean not null default false
);

create index idx_guidelines_client on brand_voice_guidelines(client_id, archived);

-- ====== PROJECTS ======
create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  name text not null,
  status text not null default 'draft' check (status in (
    'draft', 'in_review', 'delivered', 'feedback_received', 'completed'
  )),
  urgency text not null default 'standard' check (urgency in (
    'standard', 'priority', 'urgent', 'crisis'
  )),
  deadline timestamptz,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_client on projects(client_id);
create index idx_projects_status on projects(status);

-- ====== CONTENT ITEMS & VARIANTS ======
create table content_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  content_type text not null check (content_type in (
    'press_release', 'blog_post', 'social_media',
    'internal_memo', 'faq', 'executive_statement'
  )),
  brief_free_text text not null,
  brief_key_messages jsonb not null default '[]',     -- ["52週投与で...", ...]
  brief_quotes jsonb not null default '[]',           -- [{name, title, quote}, ...]
  brief_data_points jsonb not null default '[]',
  brief_constraints text,
  variation_axis text not null default 'tone' check (variation_axis in (
    'tone', 'structure', 'length'
  )),
  language text not null default 'ja' check (language in ('ja', 'en')),
  created_at timestamptz not null default now()
);

create table content_variants (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  variant_label text not null,                         -- e.g., "フォーマル", "バランス", "アクセシブル"
  variant_index int not null check (variant_index between 1 and 3),
  body_text text not null,
  body_html text,                                       -- rendered version for display
  char_count int not null default 0,
  reading_time_seconds int not null default 0,
  internal_approved boolean not null default false,
  internal_approved_by uuid references users(id),
  internal_approved_at timestamptz,
  model_used text not null,                             -- e.g., "claude-sonnet-4-5-20251022"
  generation_params jsonb,                              -- temperature, max_tokens, system prompt hash
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(content_item_id, variant_index)
);

create index idx_variants_item on content_variants(content_item_id);

create table compliance_findings (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references content_variants(id) on delete cascade,
  severity text not null check (severity in ('blocker', 'warning', 'note')),
  source_text text not null,                            -- the quoted phrase
  paragraph_index int,
  explanation text not null,
  regulation_reference text not null,                   -- "薬機法 第66条"
  suggested_correction text,
  resolution_status text not null default 'unresolved' check (resolution_status in (
    'unresolved', 'fixed', 'acknowledged'
  )),
  resolved_by uuid references users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_findings_variant on compliance_findings(variant_id);

-- ====== AUDIT REPORTS ======
create table audit_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  report_id_display text not null,                      -- e.g., "AUD-2026-1112-0048"
  version text not null default '1.0',                  -- semver-style; 1.1, 1.2 for revisions
  previous_version_id uuid references audit_reports(id),
  status text not null default 'draft' check (status in (
    'draft', 'finalized', 'revised'
  )),
  reviewer_comments text,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);

create index idx_audit_project on audit_reports(project_id);

create table audit_signatures (
  -- Schema supports multiple signatures per audit report (v2 dual sign-off);
  -- v1 enforces single via application logic.
  id uuid primary key default gen_random_uuid(),
  audit_report_id uuid not null references audit_reports(id) on delete cascade,
  signer_id uuid not null references users(id),
  signer_name_snapshot text not null,                   -- captures name at sign-time
  signer_role_snapshot text not null,
  signature_hash text not null,                         -- SHA-256 of canonical report content
  signed_at timestamptz not null default now()
);

create table audit_trail_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  audit_report_id uuid references audit_reports(id),   -- nullable; trail predates report
  event_type text not null check (event_type in (
    'variant_generated', 'compliance_checked', 'manual_review_started',
    'fix_applied', 'compliance_rechecked', 'sign_off',
    'delivery_sent', 'feedback_received', 'voice_updated'
  )),
  actor_type text not null check (actor_type in ('system', 'user')),
  actor_id uuid,                                        -- null for system events
  actor_name_snapshot text,                             -- denormalized for audit immutability
  details jsonb not null default '{}',                  -- event-specific data
  model_used text,                                      -- captured for AI events only
  occurred_at timestamptz not null default now()
);

create index idx_audit_trail_project on audit_trail_events(project_id, occurred_at);

-- ====== DELIVERY ======
create table deliveries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  recipient_email text not null,
  recipient_name text,
  cc_emails jsonb not null default '[]',
  bcc_emails jsonb not null default '[]',
  subject text not null,
  body_html text not null,
  body_text text,
  variant_ids_attached jsonb not null default '[]',     -- list of variant UUIDs
  attachment_format text not null default 'both' check (attachment_format in (
    'pdf', 'word', 'both'
  )),
  status text not null default 'draft' check (status in (
    'draft', 'scheduled', 'sent', 'failed'
  )),
  sent_at timestamptz,
  sent_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table scheduled_sends (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  scheduled_for timestamptz not null,
  processed boolean not null default false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_scheduled_processing on scheduled_sends(scheduled_for, processed)
  where processed = false;

-- ====== FEEDBACK ======
create table feedback_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,                           -- URL-safe random
  delivery_id uuid not null references deliveries(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_tokens_token on feedback_tokens(token);
create index idx_tokens_expires on feedback_tokens(expires_at) where used_at is null;

create table client_feedback (
  id uuid primary key default gen_random_uuid(),
  feedback_token_id uuid not null references feedback_tokens(id),
  chosen_variant_id uuid not null references content_variants(id),
  what_worked jsonb not null default '[]',              -- multi-select chips
  what_could_improve jsonb not null default '[]',
  needs_rework boolean not null default false,          -- "none of these" option
  free_text_comment text,
  submitted_at timestamptz not null default now()
);

-- ====== ROW LEVEL SECURITY ======
-- Light, defensive RLS — full RLS deferred to v2 multi-tenant migration

alter table users enable row level security;
alter table clients enable row level security;
alter table brand_voice_profiles enable row level security;
alter table brand_voice_samples enable row level security;
alter table brand_voice_guidelines enable row level security;
alter table projects enable row level security;
alter table content_items enable row level security;
alter table content_variants enable row level security;
alter table compliance_findings enable row level security;
alter table audit_reports enable row level security;
alter table audit_signatures enable row level security;
alter table audit_trail_events enable row level security;
alter table deliveries enable row level security;
alter table scheduled_sends enable row level security;
alter table feedback_tokens enable row level security;
alter table client_feedback enable row level security;

-- v1 policy: authenticated firm users have full access to all firm data
-- (Single-firm-per-deployment; refine in v2)
create policy "firm_users_full_access" on clients
  for all using (auth.role() = 'authenticated');

-- Repeat for each table. (One-line policy each; pattern is identical.)

-- Feedback page reads via anonymous JWT with token validation in Edge Function
-- (Not directly accessible via Supabase client.)
```

### 4.3 Useful Database Views

```sql
-- View: project_summary
-- Used in dashboards and lists
create view project_summary as
select
  p.id,
  p.name,
  p.status,
  p.urgency,
  p.deadline,
  c.name as client_name,
  ci.content_type,
  count(distinct cv.id) filter (where cv.internal_approved) as variants_approved,
  count(distinct cv.id) as variants_total,
  max(cv.created_at) as last_generated_at
from projects p
left join clients c on c.id = p.client_id
left join content_items ci on ci.project_id = p.id
left join content_variants cv on cv.content_item_id = ci.id
group by p.id, c.name, ci.content_type;
```

---

## 5. Authentication & Authorization

### 5.1 Auth Approach

- **Provider:** Supabase Auth (GoTrue)
- **Methods enabled in v1:** Email + password, magic link via email
- **Methods deferred:** OAuth (Google/Microsoft), MFA
- **Session length:** 7 days
- **Password policy:** minimum 12 characters

### 5.2 User Provisioning

v1 does not have self-service signup (this is a B2B tool, not a SaaS landing page). User provisioning happens via:

1. Admin (initial superuser) creates the Supabase project
2. Admin invites firm staff via Supabase Dashboard → Authentication → Users → Invite User
3. Invited users receive email with magic link to set password
4. On first login, the `users` table row is created via Edge Function trigger

### 5.3 Authorization Model

Single role in v1: `internal_user`. All authenticated firm staff have identical permissions.

RLS policies (see §4.2) enforce that:
- Only authenticated users can access firm data
- Feedback tokens are validated server-side in Edge Functions, never via direct table access

---

## 6. AI Integration

This is the most novel section of the v1 build. Implementation should be prototyped before being wired into the full app — see §16 (Implementation Sequence) for the recommended order.

### 6.1 Brand Voice Extraction

**Purpose:** Given 5–20 past press releases from one client, produce a structured voice profile.

**Endpoint:** `POST /functions/v1/extract-voice`

**Input:**
```typescript
{
  client_id: string;          // for storing the result
  sample_ids: string[];       // brand_voice_samples to use
}
```

**Implementation:**

The Edge Function loads the content_text from each sample, concatenates them with separators, and calls Claude with the extraction prompt.

**Prompt structure** (stored at `src/lib/prompts/brand-voice.ts`):

```typescript
export const BRAND_VOICE_EXTRACTION_SYSTEM = `
You are a Japanese pharmaceutical PR analyst specializing in brand voice analysis. Your task is to analyze a corpus of press releases and related materials from a single pharmaceutical company, and extract a precise, actionable voice profile that captures HOW this company writes — not just generic pharma PR style.

Your analysis must distinguish this company's specific voice from generic pharmaceutical PR. If your extracted profile could equally describe any pharma company, you have failed. Aim for specificity.

Output strict JSON matching this schema (no markdown, no commentary):

{
  "tone_keywords": [string]  // 3-7 specific tone descriptors in Japanese.
                              // Avoid generic terms like "professional" or "clear".
                              // Prefer specific: "データ重視で慎重", "断定を避ける", "患者視点を強調".
  "stylistic_patterns": string,  // 2-4 sentences in Japanese describing typical sentence
                                  // structure, paragraph organization, opening conventions.
  "preferred_vocabulary": [string],  // 5-15 specific words/phrases this company uses often.
  "words_to_avoid": [string],        // 3-10 words/phrases this company conspicuously avoids,
                                      // OR that 薬機法 prohibits and might be tempting.
  "signature_phrases": [string],     // 3-6 distinctive phrases this company uses regularly.
                                      // Include quotation marks in Japanese style: 「...」
  "length_norms": {
    "press_release": string,         // e.g., "1,000-1,400字"
    "executive_statement": string,
    "blog_post": string
    // include only types observed in samples
  }
}

Constraints:
- All Japanese fields in Japanese; do not translate to English.
- For 薬機法 compliance: if the samples avoid words like 画期的, 革命的, 驚異的, 夢の薬, include them in words_to_avoid.
- If samples are insufficient to determine a field, return an empty array/string rather than guessing.
`;

export const BRAND_VOICE_EXTRACTION_USER_TEMPLATE = (samples: string[]) => `
Analyze the following ${samples.length} documents from a single pharmaceutical company and produce the voice profile.

---
${samples.map((s, i) => `[Document ${i + 1}]\n${s}`).join('\n\n---\n\n')}
---

Output JSON only.
`;
```

**Output handling:**

```typescript
// In Edge Function
const response = await anthropic.messages.create({
  model: CLAUDE_MODELS.brand_voice_extraction,
  max_tokens: 4096,
  system: BRAND_VOICE_EXTRACTION_SYSTEM,
  messages: [{ role: 'user', content: BRAND_VOICE_EXTRACTION_USER_TEMPLATE(samples) }],
});

const profileJson = JSON.parse(response.content[0].text);
// Validate against Zod schema, persist to brand_voice_profiles table
```

**Validation strategy (manual, during prototyping):**

Before integrating, validate the extraction by:

1. Running the extraction on 2-3 different companies' samples
2. Confirming the profiles are meaningfully different from each other
3. Generating a press release using one profile against a *new* brief
4. Comparing tone to a real recent press release from that company
5. Iterating the prompt until output is specific, not generic

This validation should happen as the first development task — see §16.

### 6.2 Three-Variant Generation

**Purpose:** Given a brief + voice profile, produce 3 variants in parallel.

**Endpoint:** `POST /functions/v1/generate-variants`

**Input:**
```typescript
{
  content_item_id: string;
}
```

The Edge Function loads the content_item with all its brief fields, loads the client's brand_voice_profile and brand_voice_guidelines, then fires 3 parallel Claude calls.

**Variation strategy:** instead of three separate prompts, use **one base prompt with a variation directive** appended.

```typescript
export const VARIANT_GENERATION_SYSTEM = (
  voiceProfile: BrandVoiceProfile,
  guidelines: string[],
  contentType: string,
  language: string
) => `
You are a Japanese pharmaceutical PR writer at a top Tokyo PR firm. You write for one specific client whose voice profile is below. Match this voice precisely.

CLIENT VOICE PROFILE:
- Tone: ${voiceProfile.tone_keywords.join(', ')}
- Stylistic patterns: ${voiceProfile.stylistic_patterns}
- Preferred vocabulary: ${voiceProfile.preferred_vocabulary.join(', ')}
- Words to avoid: ${voiceProfile.words_to_avoid.join(', ')}
- Signature phrases (use sparingly when natural): ${voiceProfile.signature_phrases.join(', ')}
- Expected length for ${contentType}: ${voiceProfile.length_norms[contentType] || 'standard'}

ADDITIONAL GUIDELINES (accumulated from feedback and internal review):
${guidelines.map(g => `- ${g}`).join('\n')}

REGULATORY CONSTRAINTS:
- Comply with 薬機法 (Pharmaceutical Affairs Law). Do not use 誇大表現 (exaggerated expressions).
- Forbidden absolute terms: 画期的, 革命的, 驚異的, 夢の, 奇跡, 確実な治療効果, etc.
- All efficacy claims must include statistical context (CI, p-value, sample size) where available.
- Always include required boilerplate: company info, press contact.

LANGUAGE: ${language === 'ja' ? 'Japanese' : 'English'}

Output the press release/content as plain text. No preamble, no explanation, no markdown headers — just the content as it would appear.
`;

export const VARIATION_DIRECTIVES = {
  tone: {
    1: { label: 'フォーマル', directive: 'Use the most formal register. Lead with company name and full credentials. Use 受動態 (passive voice) where natural for professional distance.' },
    2: { label: 'バランス', directive: 'Use a balanced register. Lead with the key finding or news. Use active voice. This is the standard pharmaceutical PR tone.' },
    3: { label: 'アクセシブル', directive: 'Use a more accessible register while remaining professional. Lead with patient impact. Explain technical terms briefly. Suitable for general media.' }
  },
  structure: {
    1: { label: 'データ先行', directive: 'Lead the announcement with the headline data point or statistic.' },
    2: { label: '引用先行', directive: 'Lead with an executive quote that frames the announcement.' },
    3: { label: '発表先行', directive: 'Lead with the announcement itself, then provide supporting detail.' }
  },
  length: {
    1: { label: '簡潔', directive: 'Write a concise version — roughly 60% of the standard length.' },
    2: { label: '標準', directive: 'Write at the standard length for this content type.' },
    3: { label: '詳細', directive: 'Write a detailed version — roughly 140% of the standard length, with additional context.' }
  }
};
```

**Orchestration:**

```typescript
// In generate-variants Edge Function
const variants = await Promise.all([1, 2, 3].map(async (index) => {
  const directive = VARIATION_DIRECTIVES[contentItem.variation_axis][index];

  const response = await anthropic.messages.create({
    model: CLAUDE_MODELS.variant_generation,
    max_tokens: 4096,
    system: VARIANT_GENERATION_SYSTEM(voiceProfile, guidelines, contentItem.content_type, contentItem.language),
    messages: [{
      role: 'user',
      content: `${buildBriefMessage(contentItem)}\n\n[Variation directive]\n${directive.directive}`
    }],
  });

  return {
    variant_index: index,
    variant_label: directive.label,
    body_text: response.content[0].text,
    char_count: response.content[0].text.length,
    reading_time_seconds: Math.ceil(response.content[0].text.length / 6),  // ~6 chars/sec
    model_used: CLAUDE_MODELS.variant_generation,
    generation_params: {
      max_tokens: 4096,
      variation_directive: directive.directive
    }
  };
}));

// Insert all 3 variants
await supabase.from('content_variants').insert(
  variants.map(v => ({ ...v, content_item_id: contentItem.id }))
);

// Record audit event
await recordAuditEvent('variant_generated', { count: 3, model: CLAUDE_MODELS.variant_generation });

// Trigger compliance check (next step)
await callComplianceCheck(variants.map(v => v.id));
```

### 6.3 Compliance Check

**Purpose:** Identify regulatory issues in each variant.

**Endpoint:** `POST /functions/v1/compliance-check`

**Input:**
```typescript
{
  variant_ids: string[];   // typically 3 (one per variant) but can be 1 on re-check
}
```

**Prompt structure:**

```typescript
export const COMPLIANCE_CHECK_SYSTEM = `
You are a Japanese pharmaceutical regulatory compliance reviewer. Your job is to identify potential violations of:

- 薬機法 (Pharmaceutical Affairs Law) — especially Article 66 (誇大表現 prohibition)
- 医薬品等適正広告基準 (Standards for Proper Advertising of Pharmaceuticals)
- PMDA広告ガイドライン (PMDA Advertising Guidelines)

For each issue, output a finding with:
- severity: "blocker" (clear violation), "warning" (potential issue), "note" (minor stylistic)
- source_text: the exact phrase from the content (verbatim, do not paraphrase)
- paragraph_index: 1-indexed paragraph number where the issue appears
- explanation: 1-2 sentences in Japanese explaining the concern
- regulation_reference: the specific regulation, e.g., "薬機法 第66条"
- suggested_correction: a rewrite in Japanese that resolves the issue

Output strict JSON: { "findings": [...] }

If no issues are found, return { "findings": [] }.

Be precise. Do not flag content that complies. Do not flag absence of disclosures unless they are clearly missing (PR materials may legitimately omit ISI in some contexts).
`;

export const COMPLIANCE_CHECK_USER = (variant_text: string) => `
Review the following press release for regulatory compliance:

---
${variant_text}
---

Output JSON only.
`;
```

**Required disclosures check** (separate, deterministic — not LLM-based):

```typescript
function checkRequiredDisclosures(text: string): DisclosureResult {
  return {
    has_isi: /重要な安全性情報|ISI/.test(text),
    has_clinical_reference: /臨床試験|第[IVX]+相|clinical trial/.test(text),
    has_company_boilerplate: /<お問い合わせ|広報部|TEL|株式会社.*について/.test(text),
  };
}
```

### 6.4 Voice Guideline Delta Generation

**Purpose:** When client submits feedback, distill it into a guideline update.

**Endpoint:** Triggered internally by `/functions/v1/apply-feedback`

**Prompt:**

```typescript
export const VOICE_GUIDELINE_DELTA_SYSTEM = `
You are analyzing client feedback on a piece of PR content to extract durable, actionable voice guidelines that will improve future content for this client.

Given:
- The variant the client chose
- The variants they didn't choose
- Their structured feedback (what worked, what didn't)
- Their free-text comments

Produce 1-3 guideline statements in Japanese that:
- Are specific and actionable (not generic)
- Capture WHY this client preferred the chosen variant
- Would help guide future generations for THIS client
- Are phrased as positive directives, not negatives

Format: JSON array of guideline strings. Each guideline is 1-2 sentences in Japanese.

Example outputs:
["リード文では試験結果や数値データを最初に提示する。背景説明は2段落目以降に回す。"]
["「画期的」「革命的」「夢の」などの主観的形容詞は使用しない。事実と数値で語る。"]
["副作用・有害事象の情報は、リリース本文末尾に独立したセクションを設けて記載する。"]

Output JSON array only.
`;
```

Use Haiku for this call (it's lightweight and high-volume).

---

## 7. Edge Function API

All AI and external-service interactions live in Edge Functions. The frontend never calls Claude or Resend directly.

### 7.1 Function Inventory

| Function | Method | Purpose | Auth |
|---|---|---|---|
| `extract-voice` | POST | Run brand voice extraction | User JWT |
| `generate-variants` | POST | Generate 3 variants for a content_item | User JWT |
| `compliance-check` | POST | Check compliance for one or more variants | User JWT |
| `apply-feedback` | POST | Process feedback + update voice | Internal (called by feedback-submit) |
| `send-delivery` | POST | Send email immediately or schedule | User JWT |
| `process-scheduled-sends` | (pg_cron) | Cron job: process scheduled sends | Service role |
| `feedback-submit` | POST | Public endpoint: submit feedback | Token-based |
| `generate-audit-pdf` | POST | Generate signed audit report PDF | User JWT |

### 7.2 Standard Function Structure

```typescript
// supabase/functions/generate-variants/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!
});

serve(async (req) => {
  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });

    // Parse + validate input with Zod
    const body = await req.json();
    const { content_item_id } = inputSchema.parse(body);

    // Business logic
    const result = await generateVariants(content_item_id);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('generate-variants error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

### 7.3 Error Handling

All Edge Functions return:

```typescript
// Success
{ data: { ... }, error: null }

// Failure
{ data: null, error: { code: string, message: string, details?: any } }
```

Standard error codes:
- `validation_error` — input failed Zod validation
- `not_found` — referenced resource doesn't exist
- `ai_error` — Claude API failure (with retry logic before surfacing)
- `external_service_error` — Resend or other external failure
- `permission_denied` — auth/RLS rejection
- `internal_error` — unexpected

---

## 8. Magic-Link Feedback System

### 8.1 Token Generation

When a delivery is sent (or scheduled), a feedback token is generated:

```typescript
function generateFeedbackToken(): string {
  // 32 bytes of randomness, URL-safe base64
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64UrlEncode(bytes);
}

// Insert
await supabase.from('feedback_tokens').insert({
  token: generateFeedbackToken(),
  delivery_id: delivery.id,
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
});
```

The URL format is: `https://yourdomain.com/f/{token}`.

### 8.2 Feedback Page Routing

The frontend route `/f/:token` is **public** — no auth required. It:

1. Calls `GET /functions/v1/feedback-load?token={token}` to load the variants and project context
2. The Edge Function validates the token (exists, not expired, not used), then returns the variants and project metadata
3. The frontend renders the feedback page
4. On submit, calls `POST /functions/v1/feedback-submit` with the token and form data

### 8.3 Anti-Abuse

- Rate limit: 5 submissions per token (in case of confused re-submits)
- Token expiry: 30 days, configurable per delivery
- Reminder: if not used after 7 days, system sends one reminder email (configurable)
- Single-use semantics: once feedback is submitted, the token is marked `used_at`; subsequent requests show a "feedback received" message

---

## 9. Email Delivery

### 9.1 Sender Identity (v1)

v1 sends from a managed sender via Resend:
- **From:** `{firm_name} <noreply@yourdomain.com>` (configurable per deployment)
- **Reply-To:** the Internal User's actual email (so client replies land naturally)

v1.1 will add Gmail/Outlook OAuth for true firm-identity sending.

### 9.2 Email Composition

The delivery composer builds:

```typescript
{
  to: client.primary_contact_email,
  reply_to: currentUser.email,
  subject: delivery.subject,           // user-edited
  html: delivery.body_html,            // user-edited
  attachments: [
    // PDF/Word exports of each selected variant
    ...selectedVariants.map(v => ({
      filename: `${project.name}_${v.variant_label}.pdf`,
      content: pdfBuffer
    }))
  ]
}
```

### 9.3 Variant Comparison Summary

The composer auto-generates a comparison summary by comparing the variants. Implementation:

```typescript
async function generateVariantComparisonSummary(variants: Variant[]): Promise<string> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODELS.voice_guideline_delta,  // use Haiku, cheap
    max_tokens: 512,
    system: `You are summarizing differences between 3 PR draft variants for an internal email. Output 3 lines in Japanese, one per variant, each ~15-25 characters, describing the distinguishing approach of that variant. Format: "案N {label}: {one-line description}". No commentary, just the 3 lines.`,
    messages: [{
      role: 'user',
      content: variants.map((v, i) => `[案${i+1} ${v.variant_label}]\n${v.body_text}`).join('\n\n')
    }]
  });
  return response.content[0].text;
}
```

### 9.4 Scheduled Sends

`scheduled_sends` table tracks pending deliveries. A pg_cron job runs every minute:

```sql
-- supabase/migrations/0002_scheduled_sends_cron.sql
select cron.schedule(
  'process-scheduled-sends',
  '* * * * *',  -- every minute
  $$
  select net.http_post(
    url := 'https://xxx.supabase.co/functions/v1/process-scheduled-sends',
    headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
  );
  $$
);
```

The Edge Function picks up unprocessed `scheduled_sends` where `scheduled_for <= now()`, sends them, marks processed.

---

## 10. Audit Trail & Versioning

### 10.1 Event Recording

Every meaningful action records an audit event:

```typescript
async function recordAuditEvent(params: {
  project_id: string;
  event_type: AuditEventType;
  actor_type: 'system' | 'user';
  actor_id?: string;
  details: Record<string, any>;
  model_used?: string;
}) {
  // Capture actor name snapshot for immutability
  let actor_name_snapshot = null;
  if (params.actor_id) {
    const user = await supabase.from('users').select('full_name, role').eq('id', params.actor_id).single();
    actor_name_snapshot = `${user.data.full_name} (${user.data.role})`;
  }

  await supabase.from('audit_trail_events').insert({
    ...params,
    actor_name_snapshot
  });
}
```

### 10.2 Audit Report Versioning

When a reviewer signs off, the audit report status moves from `draft` → `finalized` with version `1.0`.

If post-sign-off corrections are needed:
1. New audit report row created with `previous_version_id` pointing to the prior version
2. Version incremented (`1.1`, `1.2`, ...)
3. Prior version retained, accessible but no longer canonical
4. Audit trail events show the revision sequence

### 10.3 Digital Signature

```typescript
async function signAuditReport(audit_report_id: string, signer_id: string) {
  // 1. Compute canonical hash of audit report content
  const report = await loadAuditReport(audit_report_id);
  const canonical = JSON.stringify({
    project_id: report.project_id,
    version: report.version,
    variant_ids: report.variant_ids,
    findings: report.findings,
    disclosures: report.disclosures
  });
  const signature_hash = await sha256(canonical);

  // 2. Capture signer snapshot
  const user = await supabase.from('users').select('full_name, role').eq('id', signer_id).single();

  // 3. Insert signature
  await supabase.from('audit_signatures').insert({
    audit_report_id,
    signer_id,
    signer_name_snapshot: user.data.full_name,
    signer_role_snapshot: user.data.role,
    signature_hash
  });

  // 4. Mark report finalized
  await supabase.from('audit_reports').update({
    status: 'finalized',
    finalized_at: new Date().toISOString()
  }).eq('id', audit_report_id);

  // 5. Record audit event
  await recordAuditEvent({ event_type: 'sign_off', actor_id: signer_id, ... });
}
```

---

## 11. Frontend Architecture

### 11.1 Routing

```typescript
// src/App.tsx
<Routes>
  {/* Public — feedback page */}
  <Route path="/f/:token" element={<FeedbackPage />} />

  {/* Auth */}
  <Route path="/login" element={<LoginPage />} />

  {/* Authenticated firm-app routes */}
  <Route element={<AppShell />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/clients" element={<ClientsList />} />
    <Route path="/clients/:id" element={<ClientDetail />} />
    <Route path="/projects" element={<ProjectsList />} />
    <Route path="/projects/new" element={<NewProject />} />
    <Route path="/projects/:id/review" element={<VariantReview />} />
    <Route path="/projects/:id/audit" element={<AuditReport />} />
    <Route path="/projects/:id/deliver" element={<DeliveryComposer />} />
    <Route path="/settings" element={<Settings />} />
  </Route>
</Routes>
```

### 11.2 State Management

**Server state** (clients, projects, variants, etc.): TanStack Query.

```typescript
// src/hooks/useProject.ts
export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:clients(*), content_items(*, content_variants(*, compliance_findings(*)))')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
  });
}
```

**Mutations** trigger Edge Functions:

```typescript
export function useGenerateVariants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content_item_id: string) => {
      const { data, error } = await supabase.functions.invoke('generate-variants', {
        body: { content_item_id }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, content_item_id) => {
      queryClient.invalidateQueries({ queryKey: ['project'] });
    }
  });
}
```

**Client state** (UI-only — current variant focus, panel open/closed): React Context + useState.

### 11.3 i18n

```typescript
// src/locales/ja.json
{
  "common": {
    "save": "保存",
    "cancel": "キャンセル",
    "delete": "削除"
  },
  "brand_voice": {
    "title": "ブランドボイス",
    "sample_materials": "サンプル素材",
    "voice_profile": "ボイスプロファイル"
  }
  // ...
}
```

Bilingual label pattern (PRD §6.3): UI labels show Japanese primary, English secondary in lighter weight. Implemented as:

```tsx
<Label>
  <span className="text-foreground">{t('brand_voice.sample_materials')}</span>
  <span className="text-muted-foreground ml-2 text-sm">Sample Materials</span>
</Label>
```

### 11.4 Tiptap for Variant Editing

Each variant in the review page uses Tiptap with these extensions:
- StarterKit
- Placeholder
- Custom: ComplianceFlagDecoration — renders wavy underlines on flagged text

```tsx
const editor = useEditor({
  extensions: [
    StarterKit,
    ComplianceFlagDecoration.configure({
      findings: variant.compliance_findings,
      onFlagClick: (finding) => setActiveFinding(finding)
    })
  ],
  content: variant.body_html
});
```

---

## 12. PDF Export

### 12.1 Strategy

v1 uses **browser print-to-PDF** for both variant exports and audit reports. This avoids server-side PDF library complexity in Deno Edge Functions.

### 12.2 Implementation

```typescript
// src/lib/pdf/export.ts
export async function exportAuditReportAsPDF(audit_report_id: string) {
  // 1. Open dedicated print-only route in new window
  const w = window.open(`/print/audit-report/${audit_report_id}`, '_blank');

  // 2. Wait for content load
  w?.addEventListener('load', () => {
    // 3. Trigger browser print dialog (user saves as PDF)
    w.print();
  });
}
```

The `/print/audit-report/:id` route renders a print-optimized page with `@media print` CSS that hides chrome and styles the document like a formal report.

For automated PDF generation (e.g., to attach to emails), use a service like `pdfshift.io` or `browserless.io` called from a server-side Edge Function. Recommend evaluating both during implementation.

### 12.3 Word Export

Use the `docx` npm library directly in the browser:

```typescript
import { Document, Packer, Paragraph } from 'docx';

export async function exportVariantAsWord(variant: Variant) {
  const doc = new Document({
    sections: [{
      children: variant.body_text.split('\n').map(line => new Paragraph(line))
    }]
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${variant.variant_label}.docx`);
}
```

---

## 13. Security

### 13.1 Secrets Management

- All API keys stored as Supabase secrets (not env vars committed anywhere)
- `ANTHROPIC_API_KEY` accessible only from Edge Functions
- `RESEND_API_KEY` accessible only from Edge Functions
- Service role key never exposed to client

### 13.2 Content Security

- All user-generated content (briefs, comments, names) sanitized before render
- Tiptap renders content safely by default
- File uploads validated: max 10MB, allowlist of MIME types (PDF, DOCX, TXT)

### 13.3 Feedback Token Security

- 32 bytes of cryptographic randomness (256 bits of entropy)
- Stored server-side; never exposed in client logs
- Validated server-side on every request
- Expires after 30 days, single-use semantics enforced

### 13.4 Audit Trail Immutability

- audit_trail_events table is **append-only** by application convention (enforce with RLS in v2)
- Actor names snapshotted at event time (don't pull current name when displaying historical events)
- Digital signatures hash canonical content; tampering detectable

---

## 14. Testing Strategy

### 14.1 Layers

| Layer | Approach | Coverage Target |
|---|---|---|
| Unit (utils, prompts, types) | Vitest | 80% |
| Component | React Testing Library | Key flows only |
| Integration (Edge Functions) | Deno test against test DB | All functions |
| E2E | Playwright | Critical paths (login → generate → deliver) |
| AI output quality | Manual eval + golden files | Brand voice extraction, variant generation |

### 14.2 AI Output Testing

For brand voice extraction and variant generation, maintain a golden-file test set:

```
test/ai-fixtures/
  brand-voice/
    tanaka-pharma/
      samples/                       (10 real press releases)
      expected-profile.json          (hand-validated reference output)
  variants/
    test-brief-1/
      brief.json
      expected-tone-formal.txt       (reference acceptable output)
```

Run extraction/generation against fixtures during prompt iteration. Diff against expected output as guardrail when prompts change.

---

## 15. Deployment

### 15.1 Environments

| Env | Supabase Project | Frontend Host | Purpose |
|---|---|---|---|
| Local | Local Supabase | `vite dev` | Development |
| Staging | Staging Supabase | Vercel preview | Pre-production testing |
| Production | Production Supabase | Vercel | Live |

### 15.2 Frontend Deployment

Vercel with automatic deploys from `main` branch:

```bash
# Production deploy
git push origin main
# Vercel auto-deploys
```

### 15.3 Backend Deployment

```bash
# Database migrations
npx supabase db push --linked

# Edge Functions
npx supabase functions deploy --no-verify-jwt extract-voice
npx supabase functions deploy --no-verify-jwt generate-variants
# ... etc
```

`--no-verify-jwt` only for functions that need to be called without a user JWT (`feedback-submit`, `process-scheduled-sends`). All others require valid auth.

### 15.4 Monitoring

- Supabase Logs for Edge Function execution
- Supabase Reports for DB performance
- Sentry (optional, recommended) for frontend errors
- Email digest of audit trail errors → admin email daily

---

## 16. Implementation Sequence

This is the recommended order to build v1. Don't skip the early prototyping phase.

### Phase 0 — Brand Voice Extraction Prototype (2-3 days)

**Critical path.** Before building anything else, validate that brand voice extraction works on real data.

1. Set up minimal Edge Function (`extract-voice`) — no UI, no DB integration
2. Get 10-15 real press releases from a single Japanese pharma company (publicly available)
3. Implement the extraction prompt from §6.1
4. Run extraction; manually review output
5. Iterate prompt 5-10 times until output is specific, not generic
6. Validation test: extract voice from Company A, generate a press release using that voice for an announcement Company A hasn't actually made, compare to a real Company A release
7. **Decision gate:** if extraction output is consistently generic or unhelpful, halt and reconsider product approach before proceeding

### Phase 1 — Foundation (3-4 days)

1. Vite + React + TS + Tailwind + shadcn/ui scaffold
2. Supabase project, schema migrations (§4)
3. Auth flow (login, logout, password reset)
4. Basic app shell with sidebar nav
5. i18n setup (ja/en JSON files, language toggle)

### Phase 2 — Client & Brand Voice (4-5 days)

1. Clients CRUD (list, detail, edit)
2. Brand voice sample upload → Supabase Storage
3. File text extraction (PDF, DOCX, TXT) — use `pdf-parse` and `mammoth` in browser
4. Brand voice profile UI (display + edit)
5. Hook up `extract-voice` Edge Function from Phase 0 to UI
6. Brand voice guidelines doc (add internal annotations manually)

### Phase 3 — Content Generation (5-6 days)

1. New project / brief input form
2. 3-variant generation Edge Function (§6.2)
3. Variant review page with side-by-side layout
4. Tiptap editor integration for inline edits
5. Variant regeneration
6. Compliance check Edge Function (§6.3)
7. Inline compliance flags on Tiptap editor
8. Compliance side panel with fix application

### Phase 4 — Audit & Sign-Off (3-4 days)

1. Audit report data assembly (cross-variant findings, disclosures)
2. Audit report UI (the formal report view)
3. Digital signature flow
4. Audit trail event recording (instrument all prior steps with audit events)
5. Audit report PDF export (browser print)
6. Audit versioning (revisions create V1.1, V1.2, ...)

### Phase 5 — Delivery (3-4 days)

1. Delivery composer UI
2. Variant comparison summary auto-generation
3. Email send via Resend
4. Magic-link token generation
5. Scheduled send (pg_cron + Edge Function)
6. Send-time validation (business hours, Japanese holidays)

### Phase 6 — Feedback Loop (3-4 days)

1. Public feedback page (mobile-first)
2. Feedback submission Edge Function
3. Voice guideline delta generation
4. Brand voice profile update with chosen variant + new guideline
5. Reminder email job
6. Token expiration handling

### Phase 7 — Polish & QA (3-5 days)

1. Empty states, error states, loading states
2. Mobile responsive cleanup
3. Bilingual UI verification
4. E2E tests for critical paths
5. Manual QA pass with real PR samples
6. Performance check (variant generation under 60s)

**Total estimate: ~4.5–6 weeks of solo development.** Phase 0 (the prototype) is the only phase whose failure changes the plan; everything else is well-scoped implementation work.

---

## Appendix A: Open Implementation Questions

These are decisions to make during implementation, not now:

1. **Specific weighting of approved-examples in variant generation prompts.** Phase 0 prototyping will reveal whether 1 approved example weighted heavily is better than 5 weighted equally.
2. **Compliance check granularity.** Should the check run on full text or per-paragraph? Probably per-paragraph for better localization of findings, but verify during Phase 3.
3. **Variant regeneration with adjusted brief.** When regenerating a single variant, should the user be able to add a one-line adjustment ("make it shorter") without re-entering the full brief? Add in Phase 3 if time permits.
4. **Concurrent edit conflicts.** What happens if two firm users edit the same variant simultaneously? For v1, last-write-wins is acceptable. Add proper conflict detection in v1.1 if it becomes an issue.
5. **Storage retention.** How long do we keep brand voice samples? PDFs of audit reports? Indefinitely for v1; set policy in v1.1.

---

## Appendix B: External Service Costs (rough estimates)

Per active firm, per month, with moderate usage (50 projects/month):

| Service | Estimated cost |
|---|---|
| Supabase Pro | $25 |
| Anthropic Claude API | $40-80 (varies with content length) |
| Resend | $0-20 |
| Vercel | $0 (hobby plan sufficient for one firm) |
| **Total** | **~$65-125 per firm/month** |

Pricing model implications: charge per firm per month with token budget caps, or per-generation. v1 doesn't need a billing system; track usage manually for the first 2-3 customers and figure out pricing from real data.

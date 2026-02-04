# ClearPress AI - Development Handoff Document

**Last Updated**: January 30, 2025  
**Session**: Documentation Creation  
**Status**: Ready for Development

---

## 30-Second Summary

**ClearPress AI** is a multi-tenant B2B SaaS platform for PR firms serving Japanese pharmaceutical clients. It combines AI-powered content generation (via Claude API) with industry-specific compliance checking and a mobile-optimized client collaboration portal.

**Core Value**: Streamline PR workflows while ensuring regulatory compliance (薬機法, PMDA) and cultural appropriateness for the Japanese market.

**Tech Stack**: React + TypeScript + Tailwind + shadcn/ui | Supabase (Auth/DB/Storage/Realtime) | Claude API | Resend

---

## Document Map

| Document | Status | Description | Location |
|----------|--------|-------------|----------|
| **PRD.md** | ✅ Complete | Full product requirements, personas, user journeys, features | `/docs/PRD.md` |
| **TSD.md** | ✅ Complete | Technical specifications, architecture, system design | `/docs/TSD.md` |
| **DATABASE.md** | ✅ Complete | Complete schema, RLS policies, indexes, migrations | `/docs/DATABASE.md` |
| **API.md** | 🔄 Partial | API documentation (needs completion) | `/docs/API.md` |
| **PROMPTS.md** | ❌ Needed | AI prompt library for all content types | Not created |
| **CLAUDE.md** | ❌ Needed | AI coding assistant instructions | Not created |

---

## Key Product Decisions

### User Hierarchy (3 Tiers)
```
PR Admin (Full Access)
└── PR Staff (Assigned Projects)
    └── Client User (Invited Projects Only)
```

### Content Types (6 MVP Types)
1. Press Release (プレスリリース)
2. Blog Post (ブログ記事)
3. Social Media (ソーシャルメディア)
4. Internal Memo (社内文書)
5. FAQ
6. Executive Statement (経営者声明)

### Project Workflow
```
Client Request OR Admin Create
        ↓
   AI Brief Expansion
        ↓
   AI Content Generation
        ↓
   Internal Review (PR Staff)
        ↓
   Submit to Client
        ↓
   Client Review (Comments/Suggestions)
        ↓
   Approval/Revision Cycle
        ↓
   Export (PDF/Word/Text)
```

### Urgency Levels
| Level | Timeline | Visual |
|-------|----------|--------|
| Standard | 5-7 days | Gray |
| Priority | 2-3 days | Yellow |
| Urgent | 24-48 hours | Orange |
| Crisis | Same day | Red (pulsing) |

### Client Editing
- **YES** - Clients can edit in "Suggestion Mode"
- Changes tracked as suggestions (accept/reject by PR)
- Comments with inline positioning
- Quick response templates for common feedback

### Industry Modules
- Configuration-driven (YAML/MD files)
- No code deployment required to add industries
- MVP: Pharmaceutical (Japan)
- Future: Healthcare, Finance, Tech, etc.

---

## Technical Decisions

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite 5
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query (server) + Context (app)
- **Forms**: React Hook Form + Zod
- **Editor**: Tiptap (rich text)
- **Charts**: Recharts

### Backend (Supabase)
- **Auth**: Supabase Auth (email/password, invite-only)
- **Database**: PostgreSQL 15 with RLS
- **Real-time**: Supabase Realtime (Phoenix)
- **Storage**: Supabase Storage (S3-compatible)
- **Functions**: Edge Functions (Deno)
- **Region**: Asia (Tokyo) for data residency

### External Services
- **AI**: Claude API (claude-3-5-sonnet)
- **Email**: Resend

### Mobile Strategy
- **Client Portal**: App-simulated PWA (bottom nav, native-feel)
- **PR Portal**: Responsive desktop-first

---

## Database Schema Overview

### Core Tables
```
organizations     - PR firms (multi-tenant root)
users            - All users (PR + Client)
clients          - Client companies
industries       - Configurable industry modules
projects         - Campaigns/projects
content_items    - Individual deliverables
content_versions - Version history
comments         - Inline comments
client_suggestions - Tracked changes
approvals        - Approval records
files            - Uploaded files
notifications    - User notifications
audit_logs       - Audit trail
```

### Key Relationships
- Organization → has many → Users, Clients
- Client → has many → Projects, Client Users
- Client → many-to-many → Industries
- Project → has many → Content Items
- Content Item → has many → Versions, Comments, Suggestions

### RLS Strategy
- All tables use Row Level Security
- Helper functions: `get_user_organization_id()`, `is_pr_admin()`, `has_project_access()`
- PR Admin sees all org data
- PR Staff sees assigned projects
- Client Users see only their client's invited projects

---

## AI Integration Overview

### Edge Functions
| Function | Purpose |
|----------|---------|
| `/generate-content` | Generate content with AI |
| `/check-compliance` | Real-time compliance checking |
| `/adjust-tone` | Tone adjustment |
| `/expand-brief` | AI brief expansion |
| `/translate-content` | Translation |
| `/export-content` | PDF/DOCX export |

### Compliance Checking
- **Non-blocking**: Warnings and suggestions only
- **Real-time**: Check as user types (debounced)
- **Categories**: Regulatory claims, safety info, fair balance, substantiation, formatting
- **Score**: 0-100 with category breakdown

### Tone Options
1. フォーマル (Formal)
2. プロフェッショナル (Professional)
3. フレンドリー (Friendly)
4. 緊急 (Urgent)
5. カスタム (Custom from style profile)

---

## What's Built

### Documentation (Complete)
- ✅ Comprehensive PRD with personas, journeys, features
- ✅ Technical specification with architecture
- ✅ Database schema with RLS policies
- 🔄 Partial API documentation

### What's Ready
- Complete product requirements
- Database schema ready for migration
- Technical architecture defined
- UI/UX patterns specified

---

## What's Next

### Immediate (Documentation)
1. **Complete API.md** - Finish endpoint documentation
2. **Create PROMPTS.md** - All AI prompts for content generation, compliance, etc.
3. **Create CLAUDE.md** - Instructions for AI coding assistant

### Development Phase 1: Foundation (Weeks 1-4)
- [ ] Supabase project setup (Asia region)
- [ ] Database migrations
- [ ] Authentication flow
- [ ] Basic UI shell (layouts, navigation)
- [ ] User management

### Development Phase 2: Core Features (Weeks 5-8)
- [ ] Client management
- [ ] Project creation/management
- [ ] AI content generation
- [ ] Compliance checking
- [ ] Version history

### Development Phase 3: Collaboration (Weeks 9-12)
- [ ] Client portal
- [ ] Review interface
- [ ] Comments/suggestions
- [ ] Approval workflow
- [ ] Notifications

### Development Phase 4: Polish (Weeks 13-16)
- [ ] Export functionality
- [ ] Analytics dashboard
- [ ] Mobile optimization
- [ ] Testing & QA
- [ ] Launch preparation

---

## Documents to Create (Next Session)

### PROMPTS.md
Should include:
- System prompts for each content type
- Compliance checking prompts
- Tone adjustment prompts
- Translation prompts
- Brief expansion prompts
- Industry-specific variations (pharmaceutical)

### CLAUDE.md
Should include:
- Project overview
- Tech stack with versions
- Code conventions (naming, structure)
- Architectural decisions rationale
- Important file locations
- Do's and don'ts
- Common development tasks
- Testing approach

---

## Critical Reminders

### Japanese Market Requirements
- Primary language: Japanese (日本語)
- Secondary: English
- Date format: YYYY年MM月DD日
- Currency: JPY (¥)
- Data residency: Asia (Tokyo)

### Pharmaceutical Compliance (MVP Industry)
- 薬機法 (Pharmaceutical Affairs Law)
- PMDA advertising guidelines
- JPMA code of practice
- Required: ISI, clinical references, company boilerplate

### Security Priorities
- Multi-tenant data isolation (RLS)
- No cross-organization data leakage
- Audit logging for compliance
- APPI (Japan privacy law) compliance

---

## How to Continue

### Starting a New Session
Share this message:
```
I'm building ClearPress AI, a multi-tenant SaaS for PR firms serving Japanese pharmaceutical clients.

Please read the HANDOFF.md file I've attached to understand the context.

I need to complete:
1. API.md - Full API documentation
2. PROMPTS.md - AI prompt library
3. CLAUDE.md - AI coding assistant instructions

The completed docs (PRD.md, TSD.md, DATABASE.md) are in the project files.
```

### Key Files to Reference
- `/docs/PRD.md` - Product requirements
- `/docs/TSD.md` - Technical specifications
- `/docs/DATABASE.md` - Database schema
- This file (`HANDOFF.md`) - Context summary

---

## Quick Reference

### Content Types & Japanese Names
| Type | English | Japanese |
|------|---------|----------|
| press_release | Press Release | プレスリリース |
| blog_post | Blog Post | ブログ記事 |
| social_media | Social Media | ソーシャルメディア |
| internal_memo | Internal Memo | 社内文書 |
| faq | FAQ | FAQ |
| executive_statement | Executive Statement | 経営者声明 |

### Status Flows
**Project**: requested → in_progress → in_review → approved → completed → archived

**Content**: draft → submitted → in_review → needs_revision → approved

### User Roles
| Role | Portal | Permissions |
|------|--------|-------------|
| pr_admin | PR Portal | Full access, user management |
| pr_staff | PR Portal | Assigned projects, content creation |
| client_user | Client Portal | Invited projects, review/approve |

---

*This document serves as the bridge between planning and development sessions.*

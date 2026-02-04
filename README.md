# ClearPress AI

A multi-tenant B2B SaaS platform for PR firms serving Japanese pharmaceutical clients. Combines AI-powered content generation with industry-specific compliance checking and a mobile-optimized client collaboration portal.

## Overview

ClearPress AI streamlines PR workflows by:

- **AI Content Generation** — Generate press releases, blog posts, social media, and more using Claude API
- **Compliance Checking** — Real-time regulatory compliance validation for pharmaceutical communications (薬機法, PMDA)
- **Client Collaboration** — Mobile-first portal for client review, comments, and approvals
- **Multi-tenant Architecture** — Secure data isolation for PR firms managing multiple clients

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **State Management** | TanStack Query, React Context |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions) |
| **AI** | Claude API (Anthropic) |
| **Email** | Resend |
| **Editor** | Tiptap |

## Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase CLI
- Anthropic API key
- Resend API key

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/clearpress-ai.git
cd clearpress-ai
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# For Edge Functions (set in Supabase Dashboard)
# ANTHROPIC_API_KEY=sk-ant-...
# RESEND_API_KEY=re_...
```

### 4. Set up Supabase

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.ts
```

### 5. Start development server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
clearpress-ai/
├── src/
│   ├── app/                    # App entry, routes, providers
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── common/             # Shared components
│   │   ├── editor/             # Content editor
│   │   ├── projects/           # Project components
│   │   └── review/             # Client review UI
│   ├── pages/
│   │   ├── pr-portal/          # PR firm pages
│   │   ├── client-portal/      # Client pages
│   │   └── auth/               # Auth pages
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # API services
│   ├── lib/                    # Utilities, translations
│   └── types/                  # TypeScript types
├── supabase/
│   ├── migrations/             # Database migrations
│   ├── functions/              # Edge Functions
│   └── seed/                   # Seed data
├── docs/                       # Documentation
└── tests/                      # Test files
```

## Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](docs/PRD.md) | Product requirements, personas, user journeys |
| [TSD.md](docs/TSD.md) | Technical specifications, architecture |
| [DATABASE.md](docs/DATABASE.md) | Schema, RLS policies, migrations |
| [API.md](docs/API.md) | API endpoints, request/response formats |
| [PROMPTS.md](docs/PROMPTS.md) | AI prompt templates for content generation |
| [DESIGN.md](docs/DESIGN.md) | Design system, components, patterns |
| [CLAUDE.md](CLAUDE.md) | AI coding assistant instructions |
| [HANDOFF.md](docs/HANDOFF.md) | Project context and handoff notes |

## Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Testing
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
pnpm typecheck        # TypeScript check

# Supabase
pnpm db:push          # Push migrations
pnpm db:reset         # Reset database
pnpm db:types         # Generate types
pnpm functions:serve  # Serve Edge Functions locally
```

## Environment Variables

### Frontend (.env.local)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

### Edge Functions (Supabase Dashboard)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `RESEND_API_KEY` | Resend API key |

## User Roles

| Role | Portal | Access |
|------|--------|--------|
| `pr_admin` | PR Portal | Full organization access |
| `pr_staff` | PR Portal | Assigned projects only |
| `client_user` | Client Portal | Own client's projects only |

## Content Types

| Type | Japanese | Description |
|------|----------|-------------|
| `press_release` | プレスリリース | Official announcements |
| `blog_post` | ブログ記事 | Blog articles |
| `social_media` | ソーシャルメディア | Social posts |
| `internal_memo` | 社内文書 | Internal communications |
| `faq` | FAQ | Q&A content |
| `executive_statement` | 経営者声明 | Executive statements |

## Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

### Supabase

Edge Functions deploy automatically when pushed to the linked project:

```bash
supabase functions deploy
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes following the coding conventions in [CLAUDE.md](CLAUDE.md)
3. Write tests for new functionality
4. Submit a pull request

### Commit Convention

```
feat: add content generation
fix: resolve compliance score bug
docs: update API documentation
refactor: extract content service
test: add project creation tests
```

## License

Proprietary — All rights reserved.

---

**ClearPress AI** — AI-powered PR content platform for Japanese pharmaceutical communications.

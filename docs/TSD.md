# ClearPress AI - Technical Specification Document

**Version**: 1.0  
**Last Updated**: January 30, 2025  
**Status**: MVP Technical Design  
**Document Owner**: Engineering Team

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Database Design](#4-database-design)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [API Specifications](#6-api-specifications)
7. [AI Integration](#7-ai-integration)
8. [Real-time Features](#8-real-time-features)
9. [File Storage](#9-file-storage)
10. [Email System](#10-email-system)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Security Implementation](#12-security-implementation)
13. [Testing Strategy](#13-testing-strategy)
14. [Deployment & Infrastructure](#14-deployment--infrastructure)
15. [Development Guidelines](#15-development-guidelines)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   PR Portal     │  │  Client Portal  │  │  Mobile Client  │             │
│  │   (Desktop)     │  │  (Desktop)      │  │  (PWA-style)    │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
└───────────┼────────────────────┼────────────────────┼───────────────────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE PLATFORM                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Auth     │  │  Database   │  │   Storage   │  │  Realtime   │        │
│  │  (GoTrue)   │  │ (PostgreSQL)│  │    (S3)     │  │  (Phoenix)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                     Edge Functions (Deno)                        │        │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │        │
│  │  │ /generate    │ │ /compliance  │ │ /translate   │             │        │
│  │  └──────────────┘ └──────────────┘ └──────────────┘             │        │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │        │
│  │  │ /adjust-tone │ │ /export      │ │ /brief-expand│             │        │
│  │  └──────────────┘ └──────────────┘ └──────────────┘             │        │
│  └─────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐           │
│  │      Claude API             │  │         Resend              │           │
│  │      (Anthropic)            │  │    (Email Delivery)         │           │
│  │  - Content Generation       │  │  - Notifications            │           │
│  │  - Compliance Checking      │  │  - Invitations              │           │
│  │  - Tone Adjustment          │  │  - Alerts                   │           │
│  │  - Translation              │  │                             │           │
│  └─────────────────────────────┘  └─────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 System Characteristics

| Characteristic | Target |
|----------------|--------|
| Availability | 99.5% uptime |
| Response Time | < 500ms (95th percentile) |
| Concurrent Users | 100+ simultaneous |
| Data Retention | Indefinite (audit requirements) |
| Region | Asia (Tokyo) |

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | Latest | Component library |
| React Router | 6.x | Navigation |
| TanStack Query | 5.x | Server state management |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |
| Tiptap | 2.x | Rich text editor |
| Recharts | 2.x | Charts/analytics |
| Lucide React | Latest | Icons |
| date-fns | 3.x | Date utilities |

### 2.2 Backend (Supabase)

| Service | Purpose |
|---------|---------|
| Supabase Auth | Authentication, user management |
| PostgreSQL 15 | Primary database |
| Supabase Realtime | Live updates, notifications |
| Supabase Storage | File uploads |
| Edge Functions (Deno) | Server-side logic, AI integration |

### 2.3 External Services

| Service | Purpose |
|---------|---------|
| Claude API (Anthropic) | AI content generation, compliance |
| Resend | Transactional email |

---

## 3. Architecture

### 3.1 Frontend Directory Structure

```
src/
├── app/
│   ├── App.tsx                 # Root component
│   ├── routes.tsx              # Route definitions
│   └── providers.tsx           # Context providers wrapper
│
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── common/                 # Shared components (Header, Sidebar, BottomNav)
│   ├── auth/                   # Authentication components
│   ├── editor/                 # Content editor components
│   ├── projects/               # Project components
│   ├── clients/                # Client management
│   └── review/                 # Client review components
│
├── pages/
│   ├── pr-portal/              # PR firm pages
│   ├── client-portal/          # Client pages
│   └── auth/                   # Auth pages
│
├── hooks/                      # Custom React hooks
├── contexts/                   # React contexts
├── services/                   # API services
├── lib/                        # Utilities, translations, constants
├── types/                      # TypeScript types
└── styles/                     # Global styles
```

### 3.2 Backend Structure (Supabase)

```
supabase/
├── migrations/                 # Database migrations
├── functions/                  # Edge functions
│   ├── generate-content/
│   ├── check-compliance/
│   ├── adjust-tone/
│   ├── expand-brief/
│   ├── translate-content/
│   ├── export-pdf/
│   ├── export-docx/
│   └── send-notification/
├── seed/                       # Seed data and industry configs
└── config.toml                 # Supabase configuration
```

---

## 4. Database Design

### 4.1 Core Tables

```sql
-- Organizations (PR Firms - Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Industries (Configurable modules)
CREATE TABLE industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_ja VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    config JSONB NOT NULL,
    compliance_rules TEXT,
    prompts JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('pr_admin', 'pr_staff', 'client_user')),
    avatar_url TEXT,
    preferences JSONB DEFAULT '{"language": "ja", "theme": "system"}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients (Companies that PR firm serves)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    description TEXT,
    settings JSONB DEFAULT '{}',
    style_profile JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Industries (Many-to-many)
CREATE TABLE client_industries (
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
    PRIMARY KEY (client_id, industry_id)
);

-- Client Users
CREATE TABLE client_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (client_id, user_id)
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    name VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'requested',
    urgency VARCHAR(50) DEFAULT 'standard',
    target_date DATE,
    brief TEXT,
    expanded_brief JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Items (Deliverables within a project)
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    current_version_id UUID,
    settings JSONB DEFAULT '{}',
    locked_by UUID REFERENCES users(id),
    locked_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Versions
CREATE TABLE content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    compliance_score INTEGER,
    compliance_details JSONB,
    word_count INTEGER,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    note TEXT,
    is_milestone BOOLEAN DEFAULT false,
    UNIQUE (content_item_id, version_number)
);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_id UUID REFERENCES content_versions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    position JSONB,
    parent_id UUID REFERENCES comments(id),
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Suggestions
CREATE TABLE client_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES content_versions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    before_text TEXT NOT NULL,
    after_text TEXT NOT NULL,
    position JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approvals
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES content_versions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    feedback TEXT,
    quick_response_template VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    client_id UUID REFERENCES clients(id),
    project_id UUID REFERENCES projects(id),
    name VARCHAR(500) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    body TEXT,
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Authentication & Authorization

### 5.1 Authentication

Using Supabase Auth with email/password:

```typescript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Sign out
await supabase.auth.signOut();

// Get session
const { data: { session } } = await supabase.auth.getSession();
```

### 5.2 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ... (all tables)

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Example policy: Users can only see their organization's data
CREATE POLICY "org_isolation" ON clients
  FOR SELECT USING (organization_id = get_user_organization_id());

-- Client users can only see their assigned client
CREATE POLICY "client_users_own_client" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = clients.id AND cu.user_id = auth.uid()
    )
  );
```

---

## 6. API Specifications

### 6.1 Edge Functions

**Generate Content**: `POST /functions/v1/generate-content`

```typescript
// Request
interface GenerateContentRequest {
  content_type: string;
  client_id: string;
  project_id: string;
  settings: {
    language: string;
    tone: string;
    tone_intensity: number;
    target_audience: string[];
    required_elements: string[];
    compliance_level: string;
  };
  brief: string;
}

// Response
interface GenerateContentResponse {
  success: boolean;
  data?: {
    content: string;
    compliance_score: number;
    compliance_details: ComplianceDetails;
    word_count: number;
  };
  error?: ApiError;
}
```

**Check Compliance**: `POST /functions/v1/check-compliance`

```typescript
// Request
interface CheckComplianceRequest {
  content: string;
  content_type: string;
  industry_id: string;
  language: string;
}

// Response
interface CheckComplianceResponse {
  success: boolean;
  data?: {
    score: number;
    categories: Record<string, { score: number; issues: number }>;
    issues: ComplianceIssue[];
  };
}
```

**Other Edge Functions**:
- `/functions/v1/adjust-tone` - Adjust content tone
- `/functions/v1/expand-brief` - AI brief expansion
- `/functions/v1/translate-content` - Translate content
- `/functions/v1/export-content` - Export to PDF/DOCX
- `/functions/v1/send-notification` - Send notifications

---

## 7. AI Integration

### 7.1 Claude API Configuration

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Content generation
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  system: systemPrompt,
  messages: [{ role: 'user', content: brief }],
});
```

### 7.2 System Prompts

Content generation, compliance checking, and tone adjustment each have specialized system prompts that incorporate:
- Industry-specific rules and regulations
- Client style profiles
- Content type guidelines
- Target audience considerations

---

## 8. Real-time Features

### 8.1 Supabase Realtime

```typescript
// Subscribe to notifications
supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    handleNewNotification(payload.new);
  })
  .subscribe();

// Subscribe to project updates
supabase
  .channel(`project:${projectId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'content_items',
    filter: `project_id=eq.${projectId}`,
  }, (payload) => {
    handleContentUpdate(payload);
  })
  .subscribe();
```

---

## 9. File Storage

### 9.1 Storage Buckets

```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('client-files', 'client-files', false),
  ('exports', 'exports', false),
  ('avatars', 'avatars', true);
```

### 9.2 File Upload

```typescript
async function uploadFile(file: File, params: UploadParams) {
  const filePath = `${params.organizationId}/${params.clientId}/${file.name}`;
  
  const { error: uploadError } = await supabase.storage
    .from('client-files')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Create file record in database
  const { data, error } = await supabase
    .from('files')
    .insert({
      organization_id: params.organizationId,
      client_id: params.clientId,
      name: file.name,
      storage_path: filePath,
      mime_type: file.type,
      size_bytes: file.size,
      category: params.category,
    })
    .select()
    .single();

  return data;
}
```

---

## 10. Email System

### 10.1 Resend Integration

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  await resend.emails.send({
    from: 'noreply@clearpress.ai',
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
```

### 10.2 Email Templates

- Invitation email
- Draft ready for review
- Approval notification
- Deadline reminders

---

## 11. Frontend Architecture

### 11.1 State Management

Using TanStack Query for server state:

```typescript
// Query hook
function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectsApi.list(filters),
    staleTime: 30 * 1000,
  });
}

// Mutation hook
function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

### 11.2 Internationalization

```typescript
// translations.ts
export const translations = {
  ja: {
    common: { save: '保存', cancel: 'キャンセル' },
    projects: { title: 'プロジェクト' },
  },
  en: {
    common: { save: 'Save', cancel: 'Cancel' },
    projects: { title: 'Projects' },
  },
};

// Usage with hook
const { t } = useLanguage();
<button>{t('common.save')}</button>
```

---

## 12. Security Implementation

### 12.1 Input Validation

```typescript
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(1).max(500),
  client_id: z.string().uuid(),
  urgency: z.enum(['standard', 'priority', 'urgent', 'crisis']),
  brief: z.string().min(10).max(10000),
});
```

### 12.2 Audit Logging

```sql
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 13. Testing Strategy

### 13.1 Unit Tests (Vitest)

```typescript
describe('projectSchema', () => {
  it('validates valid project data', () => {
    const validData = { name: 'Test', client_id: 'uuid...', urgency: 'standard', brief: 'Test brief' };
    expect(() => projectSchema.parse(validData)).not.toThrow();
  });
});
```

### 13.2 E2E Tests (Playwright)

```typescript
test('creates project', async ({ page }) => {
  await page.goto('/pr/projects');
  await page.click('text=新規プロジェクト');
  await page.fill('[name="name"]', 'Test Project');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Test Project')).toBeVisible();
});
```

---

## 14. Deployment & Infrastructure

### 14.1 Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=anon-key

# External Services
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
```

### 14.2 CI/CD (GitHub Actions)

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
```

---

## 15. Development Guidelines

### 15.1 Code Style

- ESLint + Prettier configuration
- TypeScript strict mode
- Component naming: PascalCase
- File naming: kebab-case

### 15.2 Commit Conventions

```
feat: add content generation
fix: resolve compliance score bug
docs: update API documentation
```

### 15.3 Branch Strategy

```
main           # Production
├── develop    # Integration
│   ├── feature/...
│   └── fix/...
└── hotfix/    # Emergency fixes
```

---

## Quick Reference

### Database Tables

| Table | Description |
|-------|-------------|
| organizations | PR firms (tenants) |
| users | All users |
| clients | Client companies |
| industries | Industry modules |
| projects | Projects/campaigns |
| content_items | Deliverables |
| content_versions | Version history |
| comments | Inline comments |
| approvals | Approval records |
| files | Uploaded files |
| notifications | User notifications |
| audit_logs | Audit trail |

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| /generate-content | Generate AI content |
| /check-compliance | Check compliance |
| /adjust-tone | Adjust tone |
| /expand-brief | Expand brief |
| /translate-content | Translate |
| /export-content | Export PDF/DOCX |

---

*End of Document*

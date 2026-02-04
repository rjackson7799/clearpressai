# ClearPress AI - AI Coding Assistant Instructions

**Project**: ClearPress AI  
**Version**: 1.0  
**Last Updated**: January 30, 2025

---

## Project Overview

ClearPress AI is a multi-tenant B2B SaaS platform for PR firms serving Japanese pharmaceutical clients. It combines AI-powered content generation with industry-specific compliance checking and a mobile-optimized client collaboration portal.

### Core Value Proposition
- AI-powered content generation for PR materials
- Japanese pharmaceutical compliance checking (薬機法, PMDA)
- Multi-tenant architecture for PR firms
- Mobile-first client portal for review and approval

### Target Users
1. **PR Admin** - Agency owners managing staff and clients
2. **PR Staff** - Content creators generating and editing materials
3. **Client User** - Pharmaceutical company representatives reviewing and approving content

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | Latest | Component library |
| React Router | 6.x | Navigation |
| TanStack Query | 5.x | Server state |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |
| Tiptap | 2.x | Rich text editor |

### Backend (Supabase)
- Supabase Auth (authentication)
- PostgreSQL 15 with RLS (database)
- Supabase Realtime (live updates)
- Supabase Storage (files)
- Edge Functions - Deno (AI integration)

### External Services
- Claude API (Anthropic) - AI generation
- Resend - Email delivery

### Package Manager
Use `pnpm` for all package management.

---

## Project Structure

```
clearpress-ai/
├── src/
│   ├── app/                        # App entry, routes, providers
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── common/                 # Shared (Header, Sidebar, BottomNav)
│   │   ├── auth/                   # Auth components
│   │   ├── editor/                 # Content editor
│   │   ├── projects/               # Project components
│   │   ├── clients/                # Client management
│   │   └── review/                 # Client review UI
│   ├── pages/
│   │   ├── pr-portal/              # PR firm pages
│   │   ├── client-portal/          # Client pages
│   │   └── auth/                   # Auth pages
│   ├── hooks/                      # Custom React hooks
│   ├── contexts/                   # React contexts
│   ├── services/                   # API services
│   ├── lib/                        # Utilities, translations, constants
│   ├── types/                      # TypeScript types
│   └── styles/                     # Global styles
├── supabase/
│   ├── migrations/                 # Database migrations
│   ├── functions/                  # Edge functions
│   └── seed/                       # Seed data
├── docs/                           # Documentation
└── tests/                          # Test files
```

---

## Code Conventions

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProjectCard.tsx` |
| Files | kebab-case | `use-projects.ts` |
| Variables | camelCase | `projectList` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Types | PascalCase | `ProjectStatus` |
| DB columns | snake_case | `created_at` |

### TypeScript

```typescript
// Use explicit types
function getProject(id: string): Promise<Project | null> { }

// Interfaces for objects
interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
}

// Types for unions
type ProjectStatus = 'draft' | 'in_progress' | 'completed';

// Const assertions for literals
const URGENCY_LEVELS = ['standard', 'priority', 'urgent', 'crisis'] as const;
type UrgencyLevel = typeof URGENCY_LEVELS[number];

// Avoid `any`, use `unknown` if needed
```

### React Components

```typescript
// Functional components with typed props
interface ProjectCardProps {
  project: Project;
  onSelect?: (id: string) => void;
}

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  // Hooks at top level
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  // Early returns after hooks
  if (!project) return null;
  
  return ( /* JSX */ );
}
```

### File Structure

```typescript
// 1. External imports
import { useState } from 'react';
import { Card } from '@/components/ui/card';

// 2. Internal imports
import { formatDate } from '@/lib/utils';
import type { Project } from '@/types';

// 3. Types (if component-specific)
interface Props { }

// 4. Constants (if component-specific)
const STATUS_COLORS = { } as const;

// 5. Component
export function MyComponent() { }
```

---

## Database Patterns

### Supabase Client

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Query Patterns

```typescript
// Typed queries with relationships
const { data, error } = await supabase
  .from('projects')
  .select(`
    *,
    client:clients(id, name),
    content_items(count)
  `)
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false });

// Always handle errors
if (error) throw new Error('プロジェクトの取得に失敗しました');
```

### TanStack Query

```typescript
// Query hook
export function useProjects(filters?: Filters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => fetchProjects(filters),
    staleTime: 30 * 1000,
  });
}

// Mutation hook
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

---

## AI Integration

### Edge Function Calls

```typescript
// src/services/ai.ts
export async function generateContent(params: GenerateParams) {
  const { data, error } = await supabase.functions.invoke('generate-content', {
    body: params,
  });
  
  if (error) throw new Error('コンテンツ生成に失敗しました');
  return data as GenerateContentResponse;
}
```

### Real-time Compliance

```typescript
// Debounced compliance check
function useComplianceCheck(content: string) {
  const [result, setResult] = useState<ComplianceResult | null>(null);
  
  const check = useDebouncedCallback(async (text: string) => {
    if (text.length < 50) return;
    const { data } = await supabase.functions.invoke('check-compliance', {
      body: { content: text },
    });
    setResult(data);
  }, 1000);
  
  useEffect(() => { check(content); }, [content]);
  return result;
}
```

---

## Internationalization

### Structure

```typescript
// src/lib/translations.ts
export const translations = {
  ja: {
    common: {
      save: '保存',
      cancel: 'キャンセル',
    },
    projects: {
      title: 'プロジェクト',
      status: {
        draft: '下書き',
        in_progress: '進行中',
      },
    },
  },
  en: { /* ... */ },
} as const;
```

### Usage

```typescript
const { t, language } = useLanguage();
<button>{t('common.save')}</button>
```

---

## Important Architectural Decisions

### Multi-Tenancy
- **Organization** = PR Firm (tenant root)
- All data scoped to organization via `organization_id`
- RLS policies enforce data isolation
- Never query without organization context

### User Roles
| Role | Access |
|------|--------|
| `pr_admin` | Full organization access |
| `pr_staff` | Assigned projects only |
| `client_user` | Own client's projects only |

### Content Workflow
```
Draft → Submitted → In Review → Needs Revision → Approved
                         ↑______________|
```

### Mobile Strategy
- **Client Portal**: App-simulated PWA with bottom navigation
- **PR Portal**: Responsive desktop-first

---

## Critical Rules

### Security
- **NEVER** expose `service_role` key to client
- **ALWAYS** use RLS for data access
- **VALIDATE** all inputs with Zod
- **SANITIZE** user content in editor

### Data Integrity
- Use transactions for multi-table operations
- Implement optimistic updates carefully
- Handle concurrent editing with locks

### Performance
- Paginate lists (20 items default)
- Use select() to limit columns
- Debounce AI calls (1000ms)
- Lazy load heavy components

### Japanese Market
- Primary language: Japanese (ja)
- Date format: YYYY年MM月DD日
- Currency: ¥
- Data residency: Asia (Tokyo)

---

## Common Tasks

### Add New Component

```bash
# 1. Create component file
touch src/components/projects/ProjectStats.tsx

# 2. Add types if needed
# 3. Implement component
# 4. Export from index if using barrel exports
```

### Add Database Table

```bash
# 1. Create migration
supabase migration new add_table_name

# 2. Write SQL in migration file
# 3. Add RLS policies
# 4. Apply: supabase db push
# 5. Regenerate types: supabase gen types typescript > src/types/database.ts
```

### Add Edge Function

```bash
# 1. Create function
supabase functions new function-name

# 2. Implement in supabase/functions/function-name/index.ts
# 3. Test locally: supabase functions serve
# 4. Deploy: supabase functions deploy function-name
```

### Add Translation

```typescript
// 1. Add to src/lib/translations.ts for both ja and en
// 2. Use with: const { t } = useLanguage(); t('key.path')
```

---

## Testing Approach

### Unit Tests (Vitest)
```typescript
// Component and hook tests
describe('useProjects', () => {
  it('fetches projects for organization', async () => {
    // ...
  });
});
```

### Integration Tests
```typescript
// API and database integration
describe('Project API', () => {
  it('creates project with RLS', async () => {
    // ...
  });
});
```

### E2E Tests (Playwright)
```typescript
// Full user flows
test('PR staff creates content', async ({ page }) => {
  await page.goto('/pr/projects');
  // ...
});
```

---

## Environment Variables

```bash
# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Edge Functions (set in Supabase dashboard)
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
```

---

## Git Workflow

### Branch Naming
```
feature/add-content-generation
fix/compliance-score-calculation
docs/update-api-documentation
```

### Commit Messages
```
feat: add AI content generation
fix: resolve compliance score bug
docs: update API documentation
refactor: extract content service
test: add project creation tests
```

---

## Quick Reference

### Content Types
| Slug | Japanese |
|------|----------|
| `press_release` | プレスリリース |
| `blog_post` | ブログ記事 |
| `social_media` | ソーシャルメディア |
| `internal_memo` | 社内文書 |
| `faq` | FAQ |
| `executive_statement` | 経営者声明 |

### Status Values
**Project**: `requested` → `in_progress` → `in_review` → `approved` → `completed`

**Content**: `draft` → `submitted` → `in_review` → `needs_revision` → `approved`

### Urgency Levels
| Slug | Japanese | Timeline |
|------|----------|----------|
| `standard` | 通常 | 5-7 days |
| `priority` | 優先 | 2-3 days |
| `urgent` | 緊急 | 24-48h |
| `crisis` | 危機対応 | Same day |

---

## Do's and Don'ts

### DO
- ✅ Use TypeScript strict mode
- ✅ Handle loading and error states
- ✅ Use Japanese for user-facing strings
- ✅ Follow existing patterns in codebase
- ✅ Add JSDoc comments for complex functions
- ✅ Use Tailwind for styling
- ✅ Test edge cases (empty states, errors)

### DON'T
- ❌ Use `any` type
- ❌ Skip error handling
- ❌ Hardcode strings (use translations)
- ❌ Create components > 300 lines
- ❌ Mix concerns in components
- ❌ Ignore RLS in queries
- ❌ Store sensitive data in localStorage

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `PRD.md` | Product requirements, user journeys |
| `TSD.md` | Technical architecture |
| `DATABASE.md` | Schema, RLS policies |
| `API.md` | Endpoint documentation |
| `PROMPTS.md` | AI prompt templates |
| `HANDOFF.md` | Project context summary |

---

*For detailed specifications, refer to the respective documentation files.*

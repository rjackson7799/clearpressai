# ClearPress AI - Database Schema Documentation

**Version**: 1.0  
**Last Updated**: January 30, 2025  
**Database**: PostgreSQL 15 (Supabase)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Table Definitions](#3-table-definitions)
4. [JSONB Schemas](#4-jsonb-schemas)
5. [Row Level Security](#5-row-level-security)
6. [Indexes](#6-indexes)
7. [Functions & Triggers](#7-functions--triggers)
8. [Migrations](#8-migrations)

---

## 1. Overview

### 1.1 Database Architecture

ClearPress AI uses a multi-tenant architecture where:
- **Organizations** are PR firms (tenants)
- **Clients** are companies served by PR firms
- **Users** can be PR staff or client users
- Data isolation is enforced via Row Level Security (RLS)

### 1.2 Key Relationships

```
Organization (PR Firm)
├── Users (PR Admin, PR Staff)
├── Clients
│   ├── Client Users
│   ├── Industries (M:M)
│   └── Projects
│       ├── Content Items
│       │   ├── Versions
│       │   ├── Comments
│       │   ├── Suggestions
│       │   └── Approvals
│       └── Files
└── Industries (Global)
```

---

## 2. Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   organizations  │       │      users       │       │     clients      │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──────│ organization_id  │       │ id (PK)          │
│ name             │       │ id (PK)          │◄──┐   │ organization_id  │──►
│ settings         │       │ email            │   │   │ name             │
│ created_at       │       │ name             │   │   │ logo_url         │
│ updated_at       │       │ role             │   │   │ style_profile    │
└──────────────────┘       │ preferences      │   │   │ created_at       │
                           │ is_active        │   │   └──────────────────┘
                           │ created_at       │   │            │
                           └──────────────────┘   │            │
                                    │             │            ▼
                                    │             │   ┌──────────────────┐
                                    │             │   │  client_users    │
                                    │             │   ├──────────────────┤
                                    │             │   │ client_id (FK)   │
                                    │             │   │ user_id (FK)     │
                                    │             │   └──────────────────┘
                                    ▼             │
                           ┌──────────────────┐   │   ┌──────────────────┐
                           │    projects      │   │   │    industries    │
                           ├──────────────────┤   │   ├──────────────────┤
                           │ id (PK)          │   │   │ id (PK)          │
                           │ organization_id  │   │   │ slug             │
                           │ client_id (FK)   │───┘   │ name_en          │
                           │ name             │       │ name_ja          │
                           │ status           │       │ config           │
                           │ urgency          │       │ compliance_rules │
                           │ target_date      │       └──────────────────┘
                           │ brief            │                │
                           │ expanded_brief   │                │
                           │ created_by (FK)  │       ┌────────┴────────┐
                           │ created_at       │       │client_industries│
                           └──────────────────┘       ├─────────────────┤
                                    │                 │ client_id (FK)  │
                                    │                 │ industry_id(FK) │
                                    ▼                 └─────────────────┘
                           ┌──────────────────┐
                           │  content_items   │
                           ├──────────────────┤
                           │ id (PK)          │
                           │ project_id (FK)  │
                           │ type             │
                           │ title            │
                           │ status           │
                           │ current_version  │
                           │ settings         │
                           │ locked_by        │
                           │ created_at       │
                           └──────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│content_versions  │     │    comments      │     │client_suggestions│
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ content_item_id  │     │ content_item_id  │     │ content_item_id  │
│ version_number   │     │ version_id       │     │ version_id       │
│ content          │     │ user_id          │     │ user_id          │
│ compliance_score │     │ content          │     │ before_text      │
│ compliance_detail│     │ position         │     │ after_text       │
│ word_count       │     │ parent_id        │     │ position         │
│ created_by       │     │ resolved         │     │ status           │
│ created_at       │     │ created_at       │     │ created_at       │
│ is_milestone     │     └──────────────────┘     └──────────────────┘
└──────────────────┘
          │
          ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    approvals     │     │      files       │     │  notifications   │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ content_item_id  │     │ organization_id  │     │ user_id          │
│ version_id       │     │ client_id        │     │ type             │
│ user_id          │     │ project_id       │     │ title            │
│ status           │     │ name             │     │ body             │
│ feedback         │     │ storage_path     │     │ metadata         │
│ created_at       │     │ category         │     │ read             │
└──────────────────┘     │ created_at       │     │ created_at       │
                         └──────────────────┘     └──────────────────┘
```

---

## 3. Table Definitions

### 3.1 organizations

PR firms (multi-tenant root).

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example data
INSERT INTO organizations (name, settings) VALUES (
    'Tokyo PR Agency',
    '{"branding": {"primary_color": "#2563eb"}, "defaults": {"language": "ja"}}'
);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| name | VARCHAR(255) | NO | - | Organization name |
| settings | JSONB | YES | {} | Organization settings |
| created_at | TIMESTAMPTZ | YES | NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | YES | NOW() | Last update timestamp |

---

### 3.2 industries

Configurable industry modules.

```sql
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example: Pharmaceutical industry
INSERT INTO industries (slug, name_en, name_ja, icon, config, compliance_rules) VALUES (
    'pharmaceutical',
    'Pharmaceutical',
    '製薬',
    'pill',
    '{
        "compliance_level": "strict",
        "regions": ["japan"],
        "regulations": [
            {"name": "薬機法", "description": "Pharmaceutical Affairs Law"},
            {"name": "PMDA Guidelines", "description": "Advertising guidelines"}
        ],
        "required_elements": ["ISI", "Clinical data references", "Company boilerplate"],
        "audiences": ["HCP", "Patients", "Investors", "Media"]
    }',
    '## Pharmaceutical Compliance Rules\n\n### Prohibited Claims\n- Unsubstantiated efficacy...'
);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| slug | VARCHAR(50) | NO | - | URL-safe identifier |
| name_en | VARCHAR(100) | NO | - | English name |
| name_ja | VARCHAR(100) | NO | - | Japanese name |
| icon | VARCHAR(50) | YES | - | Icon identifier |
| config | JSONB | NO | - | Industry configuration |
| compliance_rules | TEXT | YES | - | Compliance rules (Markdown) |
| prompts | JSONB | YES | - | AI prompt templates |
| is_active | BOOLEAN | YES | true | Active status |
| created_at | TIMESTAMPTZ | YES | NOW() | Creation timestamp |

---

### 3.3 users

All platform users (PR staff and client users).

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('pr_admin', 'pr_staff', 'client_user')),
    avatar_url TEXT,
    preferences JSONB DEFAULT '{
        "language": "ja",
        "theme": "system",
        "notifications": {"email": true, "inApp": true}
    }',
    is_active BOOLEAN DEFAULT true,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | - | FK to auth.users |
| organization_id | UUID | YES | - | FK to organizations (null for client users) |
| email | VARCHAR(255) | NO | - | Unique email |
| name | VARCHAR(255) | NO | - | Display name |
| role | VARCHAR(50) | NO | - | User role |
| avatar_url | TEXT | YES | - | Profile image URL |
| preferences | JSONB | YES | {...} | User preferences |
| is_active | BOOLEAN | YES | true | Account active status |
| last_active_at | TIMESTAMPTZ | YES | - | Last activity timestamp |
| created_at | TIMESTAMPTZ | YES | NOW() | Creation timestamp |

**Role Values**:
- `pr_admin` - Full access to PR firm features
- `pr_staff` - Content creation and project access
- `client_user` - Review and approval access

---

### 3.4 clients

Client organizations served by PR firms.

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    description TEXT,
    website VARCHAR(500),
    settings JSONB DEFAULT '{}',
    style_profile JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| organization_id | UUID | NO | - | FK to organizations |
| name | VARCHAR(255) | NO | - | Client company name |
| logo_url | TEXT | YES | - | Client logo URL |
| description | TEXT | YES | - | Client description |
| website | VARCHAR(500) | YES | - | Client website |
| settings | JSONB | YES | {} | Client settings |
| style_profile | JSONB | YES | {} | Learned style profile |
| created_by | UUID | YES | - | FK to users |
| created_at | TIMESTAMPTZ | YES | NOW() | Creation timestamp |

---

### 3.5 client_industries

Many-to-many relationship between clients and industries.

```sql
CREATE TABLE client_industries (
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
    PRIMARY KEY (client_id, industry_id)
);
```

---

### 3.6 client_users

Links client users to client organizations.

```sql
CREATE TABLE client_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (client_id, user_id)
);
```

---

### 3.7 projects

Projects/campaigns for clients.

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    name VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'requested' CHECK (status IN (
        'requested', 'in_progress', 'in_review', 'approved', 'completed', 'archived'
    )),
    urgency VARCHAR(50) DEFAULT 'standard' CHECK (urgency IN (
        'standard', 'priority', 'urgent', 'crisis'
    )),
    target_date DATE,
    brief TEXT,
    expanded_brief JSONB,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| organization_id | UUID | NO | - | FK to organizations |
| client_id | UUID | NO | - | FK to clients |
| name | VARCHAR(500) | NO | - | Project name |
| status | VARCHAR(50) | YES | 'requested' | Current status |
| urgency | VARCHAR(50) | YES | 'standard' | Urgency level |
| target_date | DATE | YES | - | Target completion date |
| brief | TEXT | YES | - | Original brief |
| expanded_brief | JSONB | YES | - | AI-expanded brief |
| metadata | JSONB | YES | {} | Additional metadata |
| created_by | UUID | YES | - | FK to users |
| created_at | TIMESTAMPTZ | YES | NOW() | Creation timestamp |

**Status Values**:
- `requested` - Client submitted request
- `in_progress` - PR team working on it
- `in_review` - Submitted to client for review
- `approved` - Client approved
- `completed` - Project finished
- `archived` - Archived

**Urgency Values**:
- `standard` - 5-7 business days
- `priority` - 2-3 business days
- `urgent` - 24-48 hours
- `crisis` - Same day

---

### 3.8 project_assignments

PR staff assigned to projects.

```sql
CREATE TABLE project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'contributor',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (project_id, user_id)
);
```

---

### 3.9 project_reviewers

Client users who can review project content.

```sql
CREATE TABLE project_reviewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (project_id, user_id)
);
```

---

### 3.10 content_items

Individual deliverables within a project.

```sql
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'press_release', 'blog_post', 'social_media', 
        'internal_memo', 'faq', 'executive_statement'
    )),
    title VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
        'draft', 'submitted', 'in_review', 'needs_revision', 'approved'
    )),
    current_version_id UUID,
    settings JSONB DEFAULT '{}',
    locked_by UUID REFERENCES users(id),
    locked_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK after content_versions is created
ALTER TABLE content_items 
ADD CONSTRAINT fk_current_version 
FOREIGN KEY (current_version_id) REFERENCES content_versions(id);
```

**Content Types**:
- `press_release` - プレスリリース
- `blog_post` - ブログ記事
- `social_media` - ソーシャルメディア投稿
- `internal_memo` - 社内文書
- `faq` - FAQ
- `executive_statement` - 経営者声明

---

### 3.11 content_versions

Version history for content items.

```sql
CREATE TABLE content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    compliance_details JSONB,
    word_count INTEGER,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    note TEXT,
    is_milestone BOOLEAN DEFAULT false,
    UNIQUE (content_item_id, version_number)
);
```

---

### 3.12 comments

Inline comments on content.

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_id UUID REFERENCES content_versions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    position JSONB, -- {"start": 100, "end": 150}
    parent_id UUID REFERENCES comments(id),
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.13 client_suggestions

Client edit suggestions (tracked changes).

```sql
CREATE TABLE client_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES content_versions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    before_text TEXT NOT NULL,
    after_text TEXT NOT NULL,
    position JSONB NOT NULL, -- {"start": 100, "end": 150}
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'accepted', 'rejected'
    )),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.14 submissions

Records when content is submitted to client.

```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES content_versions(id),
    submitted_by UUID NOT NULL REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.15 approvals

Client approval/rejection records.

```sql
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES content_versions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('approved', 'rejected')),
    feedback TEXT,
    quick_response_template VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.16 files

Uploaded files.

```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    client_id UUID REFERENCES clients(id),
    project_id UUID REFERENCES projects(id),
    content_item_id UUID REFERENCES content_items(id),
    name VARCHAR(500) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'reference', 'brand_guidelines', 'tone_example', 'competitor_example',
        'logo', 'image', 'data', 'legal', 'output', 'translation'
    )),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**File Categories**:
- `reference` - Reference materials
- `brand_guidelines` - Brand guidelines
- `tone_example` - Tone/voice examples
- `competitor_example` - Competitor examples
- `logo` - Logo files
- `image` - Images
- `data` - Data/statistics
- `legal` - Legal documents
- `output` - Generated outputs
- `translation` - Translated versions

---

### 3.17 notifications

User notifications.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'project_assigned', 'project_requested', 'draft_ready',
        'feedback_received', 'content_approved', 'content_rejected',
        'deadline_approaching', 'urgent_project', 'comment_added', 'mention'
    )),
    title VARCHAR(500) NOT NULL,
    body TEXT,
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.18 audit_logs

Audit trail for all actions.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. JSONB Schemas

### 4.1 Organization Settings

```typescript
interface OrganizationSettings {
  branding?: {
    logo_url?: string;
    primary_color?: string;
    company_name_display?: string;
  };
  defaults?: {
    language: 'ja' | 'en';
    compliance_level: 'strict' | 'standard' | 'flexible';
  };
}
```

### 4.2 User Preferences

```typescript
interface UserPreferences {
  language: 'ja' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    inApp: boolean;
    types?: Record<string, boolean>;
  };
}
```

### 4.3 Client Style Profile

```typescript
interface ClientStyleProfile {
  tone?: string;
  vocabulary_patterns?: string[];
  structure_preferences?: string[];
  extracted_from?: string[]; // File IDs
  last_updated?: string;
}
```

### 4.4 Content Settings

```typescript
interface ContentSettings {
  language: string;
  tone: string;
  tone_intensity: number;
  target_audience: string[];
  required_elements: string[];
  compliance_level: string;
}
```

### 4.5 Compliance Details

```typescript
interface ComplianceDetails {
  score: number;
  categories: {
    [key: string]: {
      score: number;
      issues: number;
    };
  };
  issues: Array<{
    type: 'warning' | 'suggestion';
    category: string;
    title: string;
    location: { start: number; end: number };
    reason: string;
    before_text: string;
    after_text: string;
    score_impact: number;
  }>;
  checked_at: string;
}
```

### 4.6 Expanded Brief

```typescript
interface ExpandedBrief {
  key_messages: string[];
  target_audience_analysis: string;
  suggested_structure: string[];
  compliance_considerations: string[];
  potential_challenges: string[];
  recommended_timeline: string;
  suggested_deliverables: string[];
  generated_at: string;
}
```

---

## 5. Row Level Security

### 5.1 Enable RLS

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

### 5.2 Helper Functions

```sql
-- Get current user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is PR Admin
CREATE OR REPLACE FUNCTION is_pr_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'pr_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is PR Staff
CREATE OR REPLACE FUNCTION is_pr_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('pr_admin', 'pr_staff')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check client access
CREATE OR REPLACE FUNCTION has_client_access(client_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM clients c
    JOIN users u ON u.organization_id = c.organization_id
    WHERE c.id = client_id AND u.id = auth.uid()
    AND u.role IN ('pr_admin', 'pr_staff')
  ) OR EXISTS (
    SELECT 1 FROM client_users cu
    WHERE cu.client_id = client_id AND cu.user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check project access
CREATE OR REPLACE FUNCTION has_project_access(proj_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_assignments pa
    WHERE pa.project_id = proj_id AND pa.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM projects p
    JOIN users u ON u.organization_id = p.organization_id
    WHERE p.id = proj_id AND u.id = auth.uid() AND u.role = 'pr_admin'
  ) OR EXISTS (
    SELECT 1 FROM project_reviewers pr
    WHERE pr.project_id = proj_id AND pr.user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

### 5.3 Policies

```sql
-- Users policies
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_read_org" ON users
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND is_pr_staff()
  );

-- Clients policies
CREATE POLICY "clients_read_org" ON clients
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND is_pr_staff()
  );

CREATE POLICY "clients_read_own" ON clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM client_users cu WHERE cu.client_id = clients.id AND cu.user_id = auth.uid())
  );

-- Projects policies
CREATE POLICY "projects_read" ON projects
  FOR SELECT USING (has_project_access(id));

CREATE POLICY "projects_read_admin" ON projects
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND is_pr_admin()
  );

-- Content items policies
CREATE POLICY "content_items_read" ON content_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = content_items.project_id AND has_project_access(p.id)
    )
  );

-- Notifications policies
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Audit logs policies (admin only)
CREATE POLICY "audit_logs_admin" ON audit_logs
  FOR SELECT USING (is_pr_admin());
```

---

## 6. Indexes

```sql
-- Users
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Clients
CREATE INDEX idx_clients_organization ON clients(organization_id);

-- Projects
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_target_date ON projects(target_date);
CREATE INDEX idx_projects_urgency_status ON projects(urgency, status);

-- Content Items
CREATE INDEX idx_content_items_project ON content_items(project_id);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_type ON content_items(type);

-- Content Versions
CREATE INDEX idx_content_versions_content_item ON content_versions(content_item_id);
CREATE INDEX idx_content_versions_milestone ON content_versions(content_item_id) WHERE is_milestone = true;

-- Comments
CREATE INDEX idx_comments_content_item ON comments(content_item_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_unresolved ON comments(content_item_id) WHERE resolved = false;

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Files
CREATE INDEX idx_files_organization ON files(organization_id);
CREATE INDEX idx_files_client ON files(client_id);
CREATE INDEX idx_files_project ON files(project_id);

-- Audit Logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

---

## 7. Functions & Triggers

### 7.1 Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 7.2 Audit Logging Trigger

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
    jsonb_build_object(
      'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to critical tables
CREATE TRIGGER audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_content_items
  AFTER INSERT OR UPDATE OR DELETE ON content_items
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_approvals
  AFTER INSERT ON approvals
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
```

### 7.3 Auto-increment Version Number

```sql
CREATE OR REPLACE FUNCTION set_version_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO NEW.version_number
  FROM content_versions
  WHERE content_item_id = NEW.content_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_version_number
  BEFORE INSERT ON content_versions
  FOR EACH ROW EXECUTE FUNCTION set_version_number();
```

---

## 8. Migrations

### 8.1 Migration Files Structure

```
supabase/migrations/
├── 00001_initial_schema.sql       # Core tables
├── 00002_rls_policies.sql         # RLS policies
├── 00003_functions_triggers.sql   # Functions and triggers
├── 00004_indexes.sql              # Performance indexes
└── 00005_seed_industries.sql      # Seed data
```

### 8.2 Running Migrations

```bash
# Apply migrations
supabase db push

# Generate types
supabase gen types typescript --local > src/types/database.ts

# Reset database (development only)
supabase db reset
```

---

*End of Document*

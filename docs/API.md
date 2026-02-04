# ClearPress AI - API Documentation

**Version**: 1.0  
**Last Updated**: January 30, 2025  
**API Type**: REST + Supabase Client + Edge Functions

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Supabase Client API](#3-supabase-client-api)
4. [Edge Functions API](#4-edge-functions-api)
5. [Error Handling](#5-error-handling)
6. [Rate Limiting](#6-rate-limiting)
7. [Webhooks](#7-webhooks)

---

## 1. Overview

### 1.1 API Architecture

ClearPress AI uses a hybrid API architecture:

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Direct Database** | Supabase Client | CRUD operations with RLS |
| **Edge Functions** | Deno + Supabase | AI processing, exports, complex logic |
| **Real-time** | Supabase Realtime | Live updates, notifications |

### 1.2 Base URLs

```
# Supabase Project
SUPABASE_URL: https://<project-id>.supabase.co

# Edge Functions
FUNCTIONS_URL: https://<project-id>.supabase.co/functions/v1

# Storage
STORAGE_URL: https://<project-id>.supabase.co/storage/v1
```

### 1.3 Request Headers

```typescript
// Standard headers for all requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`,
  'apikey': SUPABASE_ANON_KEY,
  'Accept-Language': 'ja', // or 'en'
};
```

---

## 2. Authentication

### 2.1 Sign Up (PR Admin Only - Initial Setup)

```typescript
// Only for initial organization setup
const { data, error } = await supabase.auth.signUp({
  email: 'admin@prfirm.co.jp',
  password: 'securepassword',
  options: {
    data: {
      name: '中村 浩',
      organization_name: 'Tokyo PR Agency',
    },
  },
});
```

### 2.2 Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Response
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": { "name": "..." }
  },
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

### 2.3 Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

### 2.4 Password Reset

```typescript
// Request reset
const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  { redirectTo: 'https://app.clearpress.ai/reset-password' }
);

// Update password (after redirect)
const { error } = await supabase.auth.updateUser({
  password: 'newpassword',
});
```

### 2.5 Invite User (Magic Link)

```typescript
// PR Admin invites new user
const { data, error } = await supabase.auth.admin.inviteUserByEmail(
  'newuser@example.com',
  {
    data: {
      name: 'New User Name',
      role: 'pr_staff', // or 'client_user'
      organization_id: 'org-uuid',
      client_id: 'client-uuid', // for client_user only
    },
    redirectTo: 'https://app.clearpress.ai/accept-invite',
  }
);
```

### 2.6 Get Current User Profile

```typescript
const { data: user } = await supabase.auth.getUser();

// Get extended profile with organization
const { data: profile } = await supabase
  .from('users')
  .select(`
    *,
    organization:organizations(*),
    client_users(client:clients(*))
  `)
  .eq('id', user.id)
  .single();
```

---

## 3. Supabase Client API

### 3.1 Organizations

#### Get Organization

```typescript
const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .eq('id', organizationId)
  .single();
```

#### Update Organization Settings

```typescript
const { data, error } = await supabase
  .from('organizations')
  .update({
    settings: {
      branding: { primary_color: '#2563eb' },
      defaults: { language: 'ja' },
    },
  })
  .eq('id', organizationId)
  .select()
  .single();
```

---

### 3.2 Users

#### List Users (PR Admin)

```typescript
const { data, error } = await supabase
  .from('users')
  .select(`
    *,
    client_users(client:clients(id, name))
  `)
  .eq('organization_id', organizationId)
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

#### Get User by ID

```typescript
const { data, error } = await supabase
  .from('users')
  .select(`
    *,
    organization:organizations(id, name),
    client_users(client:clients(id, name, logo_url))
  `)
  .eq('id', userId)
  .single();
```

#### Update User

```typescript
const { data, error } = await supabase
  .from('users')
  .update({
    name: '田中 花子',
    preferences: { language: 'ja', theme: 'dark' },
  })
  .eq('id', userId)
  .select()
  .single();
```

#### Deactivate User

```typescript
const { data, error } = await supabase
  .from('users')
  .update({ is_active: false })
  .eq('id', userId)
  .select()
  .single();
```

---

### 3.3 Clients

#### List Clients

```typescript
const { data, error } = await supabase
  .from('clients')
  .select(`
    *,
    industries:client_industries(
      industry:industries(id, slug, name_ja, name_en)
    ),
    _count:projects(count)
  `)
  .eq('organization_id', organizationId)
  .order('name');
```

#### Get Client with Full Details

```typescript
const { data, error } = await supabase
  .from('clients')
  .select(`
    *,
    industries:client_industries(
      industry:industries(*)
    ),
    users:client_users(
      user:users(id, name, email, avatar_url)
    ),
    projects(
      id, name, status, urgency, target_date,
      content_items(count)
    )
  `)
  .eq('id', clientId)
  .single();
```

#### Create Client

```typescript
const { data, error } = await supabase
  .from('clients')
  .insert({
    organization_id: organizationId,
    name: 'Pharma Corp Japan',
    description: '大手製薬会社',
    settings: {
      default_urgency: 'standard',
      require_approval: true,
    },
    style_profile: {
      tone: 'professional',
      formality: 'high',
      key_messages: ['安全性と有効性'],
    },
  })
  .select()
  .single();
```

#### Update Client

```typescript
const { data, error } = await supabase
  .from('clients')
  .update({
    name: 'Updated Name',
    style_profile: { tone: 'formal' },
  })
  .eq('id', clientId)
  .select()
  .single();
```

#### Assign Industries to Client

```typescript
// First remove existing
await supabase
  .from('client_industries')
  .delete()
  .eq('client_id', clientId);

// Then insert new
const { data, error } = await supabase
  .from('client_industries')
  .insert(
    industryIds.map(id => ({
      client_id: clientId,
      industry_id: id,
    }))
  );
```

#### Add Client User

```typescript
const { data, error } = await supabase
  .from('client_users')
  .insert({
    client_id: clientId,
    user_id: userId,
  });
```

---

### 3.4 Industries

#### List Active Industries

```typescript
const { data, error } = await supabase
  .from('industries')
  .select('id, slug, name_en, name_ja, icon')
  .eq('is_active', true)
  .order('name_en');
```

#### Get Industry with Config

```typescript
const { data, error } = await supabase
  .from('industries')
  .select('*')
  .eq('slug', 'pharmaceutical')
  .single();

// Response includes:
// - config: { content_types, compliance_categories, ... }
// - compliance_rules: Full markdown rules
// - prompts: AI prompt templates
```

---

### 3.5 Projects

#### List Projects (with Filters)

```typescript
interface ProjectFilters {
  client_id?: string;
  status?: string[];
  urgency?: string[];
  search?: string;
  date_from?: string;
  date_to?: string;
}

let query = supabase
  .from('projects')
  .select(`
    *,
    client:clients(id, name, logo_url),
    created_by_user:users!created_by(id, name),
    content_items(count),
    content_items!inner(
      status
    )
  `)
  .eq('organization_id', organizationId);

if (filters.client_id) {
  query = query.eq('client_id', filters.client_id);
}
if (filters.status?.length) {
  query = query.in('status', filters.status);
}
if (filters.urgency?.length) {
  query = query.in('urgency', filters.urgency);
}
if (filters.search) {
  query = query.ilike('name', `%${filters.search}%`);
}
if (filters.date_from) {
  query = query.gte('target_date', filters.date_from);
}
if (filters.date_to) {
  query = query.lte('target_date', filters.date_to);
}

const { data, error } = await query.order('created_at', { ascending: false });
```

#### Get Project Detail

```typescript
const { data, error } = await supabase
  .from('projects')
  .select(`
    *,
    client:clients(
      id, name, logo_url, style_profile,
      industries:client_industries(
        industry:industries(id, slug, name_ja, config)
      )
    ),
    created_by_user:users!created_by(id, name, avatar_url),
    content_items(
      *,
      current_version:content_versions!current_version_id(*),
      created_by_user:users!created_by(id, name)
    ),
    files(*)
  `)
  .eq('id', projectId)
  .single();
```

#### Create Project (PR Staff)

```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    organization_id: organizationId,
    client_id: clientId,
    name: '新製品発表キャンペーン',
    status: 'in_progress',
    urgency: 'priority',
    target_date: '2025-02-15',
    brief: 'Q1の新製品発表に向けたPRキャンペーン...',
    created_by: userId,
  })
  .select()
  .single();
```

#### Create Project Request (Client)

```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    organization_id: organizationId, // from client's org
    client_id: clientId,
    name: 'プレスリリース作成依頼',
    status: 'requested', // Client requests start as 'requested'
    urgency: 'standard',
    brief: '新サービスのプレスリリースを...',
    created_by: clientUserId,
  })
  .select()
  .single();
```

#### Update Project Status

```typescript
const { data, error } = await supabase
  .from('projects')
  .update({
    status: 'in_review',
    updated_at: new Date().toISOString(),
  })
  .eq('id', projectId)
  .select()
  .single();
```

#### Update Expanded Brief

```typescript
const { data, error } = await supabase
  .from('projects')
  .update({
    expanded_brief: {
      target_audience: ['医療従事者', '患者'],
      key_messages: ['安全性', '有効性', '利便性'],
      tone: 'professional',
      deliverables: [
        { type: 'press_release', notes: '主要メディア向け' },
        { type: 'social_media', notes: 'Twitter/LinkedIn' },
      ],
      constraints: ['薬機法遵守', 'PMDA承認内容準拠'],
      references: ['Phase III試験結果'],
    },
  })
  .eq('id', projectId)
  .select()
  .single();
```

---

### 3.6 Content Items

#### List Content Items for Project

```typescript
const { data, error } = await supabase
  .from('content_items')
  .select(`
    *,
    current_version:content_versions!current_version_id(
      id, version_number, content, compliance_score, word_count
    ),
    created_by_user:users!created_by(id, name),
    locked_by_user:users!locked_by(id, name),
    comments(count),
    client_suggestions(count)
  `)
  .eq('project_id', projectId)
  .order('created_at');
```

#### Get Content Item with Full History

```typescript
const { data, error } = await supabase
  .from('content_items')
  .select(`
    *,
    project:projects(
      id, name, client_id,
      client:clients(id, name, style_profile)
    ),
    versions:content_versions(
      *,
      created_by_user:users!created_by(id, name)
    ),
    comments(
      *,
      user:users(id, name, avatar_url, role),
      replies:comments(
        *,
        user:users(id, name, avatar_url, role)
      )
    ),
    suggestions:client_suggestions(
      *,
      user:users(id, name, avatar_url)
    ),
    approvals(
      *,
      user:users(id, name, avatar_url)
    )
  `)
  .eq('id', contentItemId)
  .single();
```

#### Create Content Item

```typescript
const { data, error } = await supabase
  .from('content_items')
  .insert({
    project_id: projectId,
    type: 'press_release',
    title: '新製品発表プレスリリース',
    status: 'draft',
    settings: {
      target_length: 800,
      include_isi: true,
      include_boilerplate: true,
    },
    created_by: userId,
  })
  .select()
  .single();
```

#### Update Content Item Status

```typescript
const { data, error } = await supabase
  .from('content_items')
  .update({ status: 'submitted' })
  .eq('id', contentItemId)
  .select()
  .single();
```

#### Lock Content Item for Editing

```typescript
const { data, error } = await supabase
  .from('content_items')
  .update({
    locked_by: userId,
    locked_at: new Date().toISOString(),
  })
  .eq('id', contentItemId)
  .is('locked_by', null) // Only if not already locked
  .select()
  .single();
```

#### Unlock Content Item

```typescript
const { data, error } = await supabase
  .from('content_items')
  .update({
    locked_by: null,
    locked_at: null,
  })
  .eq('id', contentItemId)
  .eq('locked_by', userId) // Only owner can unlock
  .select()
  .single();
```

---

### 3.7 Content Versions

#### Create New Version

```typescript
// Create version
const { data: version, error } = await supabase
  .from('content_versions')
  .insert({
    content_item_id: contentItemId,
    content: contentData, // JSONB with structured content
    compliance_score: 85,
    compliance_details: {
      categories: {
        regulatory_claims: { score: 90, issues: [] },
        safety_info: { score: 80, issues: ['ISI section incomplete'] },
      },
    },
    word_count: 650,
    created_by: userId,
    generation_params: {
      tone: 'professional',
      model: 'claude-3-5-sonnet',
    },
  })
  .select()
  .single();

// Update content item to point to new version
await supabase
  .from('content_items')
  .update({ current_version_id: version.id })
  .eq('id', contentItemId);
```

#### Get Version History

```typescript
const { data, error } = await supabase
  .from('content_versions')
  .select(`
    *,
    created_by_user:users!created_by(id, name, avatar_url)
  `)
  .eq('content_item_id', contentItemId)
  .order('version_number', { ascending: false });
```

#### Compare Versions

```typescript
const { data, error } = await supabase
  .from('content_versions')
  .select('*')
  .in('id', [versionId1, versionId2]);
```

#### Mark Version as Milestone

```typescript
const { data, error } = await supabase
  .from('content_versions')
  .update({
    is_milestone: true,
    milestone_name: 'クライアント提出版',
  })
  .eq('id', versionId)
  .select()
  .single();
```

---

### 3.8 Comments

#### Get Comments for Content Item

```typescript
const { data, error } = await supabase
  .from('comments')
  .select(`
    *,
    user:users(id, name, avatar_url, role),
    replies:comments(
      *,
      user:users(id, name, avatar_url, role)
    )
  `)
  .eq('content_item_id', contentItemId)
  .is('parent_id', null) // Top-level comments only
  .order('created_at', { ascending: true });
```

#### Create Comment

```typescript
const { data, error } = await supabase
  .from('comments')
  .insert({
    content_item_id: contentItemId,
    version_id: versionId,
    user_id: userId,
    content: 'この部分の表現を確認してください',
    position: {
      type: 'inline',
      start_offset: 150,
      end_offset: 200,
      selected_text: '効果が認められました',
    },
  })
  .select(`
    *,
    user:users(id, name, avatar_url, role)
  `)
  .single();
```

#### Reply to Comment

```typescript
const { data, error } = await supabase
  .from('comments')
  .insert({
    content_item_id: contentItemId,
    version_id: versionId,
    user_id: userId,
    content: '承知しました、修正します',
    parent_id: parentCommentId,
  })
  .select(`
    *,
    user:users(id, name, avatar_url, role)
  `)
  .single();
```

#### Resolve Comment

```typescript
const { data, error } = await supabase
  .from('comments')
  .update({ resolved: true })
  .eq('id', commentId)
  .select()
  .single();
```

---

### 3.9 Client Suggestions

#### Get Suggestions for Content Item

```typescript
const { data, error } = await supabase
  .from('client_suggestions')
  .select(`
    *,
    user:users(id, name, avatar_url)
  `)
  .eq('content_item_id', contentItemId)
  .order('created_at', { ascending: true });
```

#### Create Suggestion (Client Only)

```typescript
const { data, error } = await supabase
  .from('client_suggestions')
  .insert({
    content_item_id: contentItemId,
    version_id: versionId,
    user_id: clientUserId,
    before_text: '効果が認められました',
    after_text: '臨床試験において有意な効果が確認されました',
    position: {
      start_offset: 150,
      end_offset: 200,
    },
    reason: 'より正確な表現に変更',
  })
  .select(`
    *,
    user:users(id, name, avatar_url)
  `)
  .single();
```

#### Accept/Reject Suggestion (PR Staff)

```typescript
const { data, error } = await supabase
  .from('client_suggestions')
  .update({
    status: 'accepted', // or 'rejected'
    reviewed_by: staffUserId,
    reviewed_at: new Date().toISOString(),
  })
  .eq('id', suggestionId)
  .select()
  .single();
```

---

### 3.10 Approvals

#### Get Approvals for Content Item

```typescript
const { data, error } = await supabase
  .from('approvals')
  .select(`
    *,
    user:users(id, name, avatar_url, role),
    version:content_versions(id, version_number)
  `)
  .eq('content_item_id', contentItemId)
  .order('created_at', { ascending: false });
```

#### Create Approval

```typescript
const { data, error } = await supabase
  .from('approvals')
  .insert({
    content_item_id: contentItemId,
    version_id: versionId,
    user_id: clientUserId,
    status: 'approved', // or 'rejected', 'changes_requested'
    feedback: '内容を確認しました。承認します。',
  })
  .select(`
    *,
    user:users(id, name, avatar_url)
  `)
  .single();
```

---

### 3.11 Files

#### List Files for Project

```typescript
const { data, error } = await supabase
  .from('files')
  .select('*')
  .eq('project_id', projectId)
  .order('created_at', { ascending: false });
```

#### Upload File

```typescript
// 1. Upload to storage
const filePath = `${organizationId}/${clientId}/${projectId}/${file.name}`;
const { error: uploadError } = await supabase.storage
  .from('client-files')
  .upload(filePath, file);

// 2. Create database record
const { data, error } = await supabase
  .from('files')
  .insert({
    organization_id: organizationId,
    client_id: clientId,
    project_id: projectId,
    name: file.name,
    storage_path: filePath,
    mime_type: file.type,
    size_bytes: file.size,
    category: 'reference', // or 'asset', 'export'
    uploaded_by: userId,
  })
  .select()
  .single();
```

#### Get File Download URL

```typescript
const { data } = await supabase.storage
  .from('client-files')
  .createSignedUrl(filePath, 3600); // 1 hour expiry

// data.signedUrl
```

#### Delete File

```typescript
// 1. Delete from storage
await supabase.storage
  .from('client-files')
  .remove([filePath]);

// 2. Delete database record
await supabase
  .from('files')
  .delete()
  .eq('id', fileId);
```

---

### 3.12 Notifications

#### Get User Notifications

```typescript
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);
```

#### Get Unread Count

```typescript
const { count, error } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('read', false);
```

#### Mark as Read

```typescript
const { data, error } = await supabase
  .from('notifications')
  .update({ read: true })
  .eq('id', notificationId)
  .select()
  .single();
```

#### Mark All as Read

```typescript
const { data, error } = await supabase
  .from('notifications')
  .update({ read: true })
  .eq('user_id', userId)
  .eq('read', false);
```

---

### 3.13 Audit Logs (PR Admin Only)

#### Query Audit Logs

```typescript
const { data, error } = await supabase
  .from('audit_logs')
  .select(`
    *,
    user:users(id, name, email)
  `)
  .eq('organization_id', organizationId)
  .order('created_at', { ascending: false })
  .limit(100);
```

#### Filter by Resource

```typescript
const { data, error } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('resource_type', 'content_items')
  .eq('resource_id', contentItemId)
  .order('created_at', { ascending: false });
```

---

## 4. Edge Functions API

### 4.1 Generate Content

**Endpoint**: `POST /functions/v1/generate-content`

Generates AI content based on brief and parameters.

#### Request

```typescript
interface GenerateContentRequest {
  project_id: string;
  content_type: 'press_release' | 'blog_post' | 'social_media' | 
                'internal_memo' | 'faq' | 'executive_statement';
  brief: string;
  expanded_brief?: {
    target_audience: string[];
    key_messages: string[];
    tone: string;
    constraints: string[];
    references: string[];
  };
  settings: {
    tone: 'formal' | 'professional' | 'friendly' | 'urgent' | 'custom';
    custom_tone?: string;
    target_length?: number;
    language: 'ja' | 'en';
    include_isi?: boolean;
    include_boilerplate?: boolean;
  };
  client_style_profile?: {
    tone: string;
    formality: string;
    key_messages: string[];
    avoid_phrases: string[];
  };
  industry_config?: {
    slug: string;
    compliance_rules: string;
  };
}
```

#### Response

```typescript
interface GenerateContentResponse {
  success: boolean;
  content: {
    structured: {
      headline?: string;
      subheadline?: string;
      dateline?: string;
      lead: string;
      body: string[];
      quotes?: { text: string; attribution: string }[];
      boilerplate?: string;
      isi?: string;
      contact?: string;
    };
    plain_text: string;
    html: string;
  };
  compliance: {
    score: number;
    categories: {
      [key: string]: {
        score: number;
        issues: string[];
        suggestions: string[];
      };
    };
  };
  metadata: {
    word_count: number;
    model: string;
    tokens_used: number;
    generation_time_ms: number;
  };
}
```

#### Example

```bash
curl -X POST \
  'https://<project>.supabase.co/functions/v1/generate-content' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "project_id": "uuid",
    "content_type": "press_release",
    "brief": "新しい糖尿病治療薬の承認取得について",
    "settings": {
      "tone": "professional",
      "language": "ja",
      "include_isi": true
    }
  }'
```

---

### 4.2 Check Compliance

**Endpoint**: `POST /functions/v1/check-compliance`

Real-time compliance checking for content.

#### Request

```typescript
interface CheckComplianceRequest {
  content: string;
  content_type: string;
  industry_slug: string;
  language: 'ja' | 'en';
}
```

#### Response

```typescript
interface CheckComplianceResponse {
  success: boolean;
  score: number; // 0-100
  categories: {
    regulatory_claims: {
      score: number;
      issues: {
        type: 'error' | 'warning' | 'suggestion';
        message: string;
        position?: { start: number; end: number };
        suggestion?: string;
      }[];
    };
    safety_info: { /* same structure */ };
    fair_balance: { /* same structure */ };
    substantiation: { /* same structure */ };
    formatting: { /* same structure */ };
  };
  summary: {
    errors: number;
    warnings: number;
    suggestions: number;
  };
}
```

#### Example

```bash
curl -X POST \
  'https://<project>.supabase.co/functions/v1/check-compliance' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "新薬Xは糖尿病を完治させます...",
    "content_type": "press_release",
    "industry_slug": "pharmaceutical",
    "language": "ja"
  }'
```

---

### 4.3 Adjust Tone

**Endpoint**: `POST /functions/v1/adjust-tone`

Adjusts the tone of existing content.

#### Request

```typescript
interface AdjustToneRequest {
  content: string;
  current_tone?: string;
  target_tone: 'formal' | 'professional' | 'friendly' | 'urgent' | 'custom';
  custom_tone_description?: string;
  language: 'ja' | 'en';
  preserve_facts: boolean;
}
```

#### Response

```typescript
interface AdjustToneResponse {
  success: boolean;
  adjusted_content: string;
  changes_summary: string;
  tone_analysis: {
    before: { formality: number; warmth: number; urgency: number };
    after: { formality: number; warmth: number; urgency: number };
  };
}
```

---

### 4.4 Expand Brief

**Endpoint**: `POST /functions/v1/expand-brief`

AI expansion of initial project brief.

#### Request

```typescript
interface ExpandBriefRequest {
  brief: string;
  client_id: string;
  industry_slug: string;
  content_types: string[];
  urgency: string;
  language: 'ja' | 'en';
}
```

#### Response

```typescript
interface ExpandBriefResponse {
  success: boolean;
  expanded_brief: {
    summary: string;
    target_audience: {
      primary: string[];
      secondary: string[];
    };
    key_messages: string[];
    suggested_tone: string;
    deliverables: {
      type: string;
      purpose: string;
      key_points: string[];
    }[];
    timeline_suggestions: {
      phase: string;
      duration: string;
      activities: string[];
    }[];
    compliance_considerations: string[];
    questions_for_client: string[];
    references_needed: string[];
  };
}
```

---

### 4.5 Translate Content

**Endpoint**: `POST /functions/v1/translate-content`

Culturally-aware translation.

#### Request

```typescript
interface TranslateContentRequest {
  content: string | { [key: string]: any }; // Plain text or structured
  source_language: 'ja' | 'en';
  target_language: 'ja' | 'en';
  content_type: string;
  preserve_structure: boolean;
  cultural_adaptation: 'minimal' | 'moderate' | 'full';
}
```

#### Response

```typescript
interface TranslateContentResponse {
  success: boolean;
  translated_content: string | { [key: string]: any };
  adaptations: {
    original: string;
    translated: string;
    reason: string;
  }[];
  quality_score: number;
}
```

---

### 4.6 Export Content

**Endpoint**: `POST /functions/v1/export-content`

Export content to PDF, DOCX, or plain text.

#### Request

```typescript
interface ExportContentRequest {
  content_item_id: string;
  version_id?: string; // Optional, defaults to current
  format: 'pdf' | 'docx' | 'txt';
  options: {
    include_header: boolean;
    include_footer: boolean;
    include_isi: boolean;
    include_boilerplate: boolean;
    include_metadata: boolean;
    language: 'ja' | 'en';
    paper_size: 'a4' | 'letter';
  };
}
```

#### Response

```typescript
interface ExportContentResponse {
  success: boolean;
  file_url: string; // Signed URL, expires in 1 hour
  file_name: string;
  file_size: number;
  expires_at: string;
}
```

---

### 4.7 Send Notification

**Endpoint**: `POST /functions/v1/send-notification`

Internal function for sending notifications.

#### Request

```typescript
interface SendNotificationRequest {
  user_ids: string[];
  type: 'project_request' | 'content_submitted' | 'comment_added' | 
        'approval_needed' | 'content_approved' | 'deadline_reminder';
  title: string;
  body: string;
  metadata: {
    project_id?: string;
    content_item_id?: string;
    link?: string;
  };
  send_email: boolean;
}
```

---

## 5. Error Handling

### 5.1 Error Response Format

```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    hint?: string;
  };
  status: number;
}
```

### 5.2 Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource conflict (e.g., locked) |
| `RATE_LIMITED` | 429 | Too many requests |
| `AI_ERROR` | 502 | AI service error |
| `INTERNAL_ERROR` | 500 | Server error |

### 5.3 Supabase Error Handling

```typescript
const { data, error } = await supabase.from('projects').select();

if (error) {
  if (error.code === 'PGRST116') {
    // No rows found
  } else if (error.code === '42501') {
    // RLS violation
  } else if (error.code === '23505') {
    // Unique constraint violation
  }
}
```

### 5.4 Edge Function Error Handling

```typescript
try {
  const response = await fetch(functionUrl, { ... });
  
  if (!response.ok) {
    const error = await response.json();
    throw new APIError(error);
  }
  
  return await response.json();
} catch (error) {
  if (error instanceof APIError) {
    // Handle known API error
  } else {
    // Handle network/unknown error
  }
}
```

---

## 6. Rate Limiting

### 6.1 Supabase Limits

| Resource | Limit | Window |
|----------|-------|--------|
| API requests | 1000/min | Per project |
| Auth requests | 100/min | Per IP |
| Storage uploads | 100/min | Per project |
| Realtime connections | 200 | Concurrent |

### 6.2 Edge Function Limits

| Function | Limit | Window |
|----------|-------|--------|
| generate-content | 20/min | Per user |
| check-compliance | 60/min | Per user |
| adjust-tone | 30/min | Per user |
| translate-content | 20/min | Per user |
| export-content | 10/min | Per user |

### 6.3 Rate Limit Headers

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1706644800
```

---

## 7. Webhooks

### 7.1 Notification Webhooks (Future)

For integrations with external systems.

#### Event Types

| Event | Description |
|-------|-------------|
| `project.created` | New project created |
| `project.status_changed` | Project status updated |
| `content.submitted` | Content submitted for review |
| `content.approved` | Content approved |
| `content.rejected` | Content rejected |

#### Webhook Payload

```typescript
interface WebhookPayload {
  event: string;
  timestamp: string;
  organization_id: string;
  data: {
    id: string;
    type: string;
    attributes: { [key: string]: any };
    relationships?: { [key: string]: any };
  };
}
```

---

## Quick Reference

### Content Types

| Type | Slug | Japanese |
|------|------|----------|
| Press Release | `press_release` | プレスリリース |
| Blog Post | `blog_post` | ブログ記事 |
| Social Media | `social_media` | ソーシャルメディア |
| Internal Memo | `internal_memo` | 社内文書 |
| FAQ | `faq` | FAQ |
| Executive Statement | `executive_statement` | 経営者声明 |

### Status Values

**Project Status**:
`requested` → `in_progress` → `in_review` → `approved` → `completed` → `archived`

**Content Status**:
`draft` → `submitted` → `in_review` → `needs_revision` → `approved`

### Urgency Levels

| Level | Slug | Japanese | Timeline |
|-------|------|----------|----------|
| Standard | `standard` | 通常 | 5-7 days |
| Priority | `priority` | 優先 | 2-3 days |
| Urgent | `urgent` | 緊急 | 24-48 hours |
| Crisis | `crisis` | 危機対応 | Same day |

### User Roles

| Role | Slug | Portal |
|------|------|--------|
| PR Admin | `pr_admin` | PR Portal |
| PR Staff | `pr_staff` | PR Portal |
| Client User | `client_user` | Client Portal |

---

*End of Document*

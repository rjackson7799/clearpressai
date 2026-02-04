# ClearPress AI - Development Roadmap

**Created**: February 3, 2025
**Status**: Active Planning Document
**Last Updated**: February 3, 2025

---

## Overview

This document captures the prioritized roadmap for ClearPress AI development beyond the core MVP. Items are organized by anticipated value and implementation complexity.

---

## Priority Tiers

| Tier | Timeline | Focus |
|------|----------|-------|
| **P1** | Completed | Core gaps fixed (Settings, Dashboards, AI Functions) |
| **P2** | Next Sprint | High-value workflow improvements |
| **P3** | Medium-term | Industry scaling & advanced features |
| **P4** | Long-term | Enterprise & integration ecosystem |

---

## P2: High-Value Workflow Improvements

### 2.1 Content Workflow Enhancements

#### Content Duplication / Cloning ✅ COMPLETE
**Value**: High | **Complexity**: Low | **Effort**: 2-3 days | **Completed**: February 3, 2025

Allows staff to duplicate existing content as a starting point for new pieces.

**Implementation**:
- ✅ Add "Duplicate" action to content item dropdown
- ✅ Clone content_item record with new ID
- ✅ Clone latest version as v1 of new content
- ✅ Reset status to 'draft'

**Files modified**:
- `src/services/content.ts` - Added `duplicateContentItem()` function
- `src/hooks/use-content.ts` - Added `useDuplicateContentItem()` hook
- `src/components/content/ContentItemCard.tsx` - Added duplicate action with Copy icon
- `src/components/content/ContentItemList.tsx` - Wired up duplicate handler
- `src/lib/translations.ts` - Added `content.duplicate` translations (ja/en)

---

#### Project Templates
**Value**: High | **Complexity**: Medium | **Effort**: 1 week

Save and reuse project configurations as templates.

**Implementation**:
- New `project_templates` table
- Template CRUD UI in Settings
- "Create from Template" option in new project dialog
- Pre-populate deliverables, timeline, brief structure

**Files to create**:
- `src/services/project-templates.ts`
- `src/hooks/use-project-templates.ts`
- `src/components/projects/ProjectTemplateSelector.tsx`
- `supabase/migrations/xxx_project_templates.sql`

---

#### Deadline Reminders During Review
**Value**: High | **Complexity**: Medium | **Effort**: 3-4 days

Automated reminders for content pending client review.

**Implementation**:
- Scheduled Edge Function (cron) checking content approaching deadline
- Send email reminders at 48h, 24h, 12h before target_date
- In-app notification badges for overdue items
- Dashboard widget showing overdue reviews

**Files to create**:
- `supabase/functions/deadline-reminders/index.ts`
- Update `src/pages/client-portal/ClientDashboard.tsx` - Overdue indicator

---

### 2.2 Review & Approval Enhancements

#### Review Delegation
**Value**: Medium | **Complexity**: Medium | **Effort**: 3-4 days

Allow clients to delegate reviews to colleagues.

**Implementation**:
- "Delegate Review" button on ContentReviewPage
- Select another client_user from same client
- Transfer review responsibility
- Notification to new reviewer

**Files to create**:
- `src/components/review/DelegateReviewDialog.tsx`
- Update `src/services/approvals.ts` - Add delegation function

---

#### Sequential Approval Workflows
**Value**: Medium | **Complexity**: High | **Effort**: 1-2 weeks

Multi-stage approval (e.g., Legal → Executive → Final).

**Implementation**:
- New `approval_workflows` table with stages
- Workflow template configuration UI
- Auto-route to next approver on approval
- Progress indicator showing current stage

**Files to create**:
- `supabase/migrations/xxx_approval_workflows.sql`
- `src/services/approval-workflows.ts`
- `src/components/approvals/WorkflowProgress.tsx`

---

### 2.3 Staff Productivity

#### Staff Workload Dashboard
**Value**: High | **Complexity**: Medium | **Effort**: 1 week

View and balance workload across team members.

**Implementation**:
- New analytics view showing projects per staff member
- Assignment counts by status
- Drag-and-drop reassignment
- Capacity indicators

**Files to create**:
- `src/pages/pr-portal/WorkloadPage.tsx`
- `src/components/workload/StaffWorkloadCard.tsx`
- `src/services/workload.ts`

---

#### Keyboard Shortcuts
**Value**: Medium | **Complexity**: Low | **Effort**: 2-3 days

Power-user keyboard shortcuts for common actions.

**Shortcuts**:
- `Cmd/Ctrl + S` - Save
- `Cmd/Ctrl + Enter` - Submit for review
- `Cmd/Ctrl + G` - Generate content
- `Cmd/Ctrl + K` - Command palette

**Files to create**:
- `src/hooks/use-keyboard-shortcuts.ts`
- `src/components/common/CommandPalette.tsx`

---

## P3: Industry Scaling & AI Enhancement

### 3.1 Multi-Industry Module System

#### Industry Configuration Engine
**Value**: Very High | **Complexity**: High | **Effort**: 3-4 weeks

Expand beyond pharmaceutical to other regulated industries.

**Target Industries**:
1. Financial Services (金融商品取引法, FSA)
2. Food & Beverage (食品表示法, HACCP)
3. Automotive (emissions, safety regulations)
4. Technology/IT (minimal regulation)
5. Legal Services (attorney advertising rules)

**Implementation**:
- Industry module YAML configuration format
- Compliance rule engine that reads industry configs
- Industry-specific terminology dictionaries
- Industry-specific content templates
- Per-client industry assignment

**Files to create**:
- `src/lib/industry-modules/` - Module loader
- `supabase/functions/check-compliance-v2/` - Rule engine
- `src/components/settings/IndustryModuleManager.tsx`
- Industry config files (YAML)

---

### 3.2 AI Enhancement Suite

#### Section-Level Regeneration
**Value**: High | **Complexity**: Medium | **Effort**: 1 week

Regenerate individual sections instead of entire content.

**Implementation**:
- Section selection in editor
- "Regenerate Section" context menu
- Preserve surrounding content
- Apply same style/tone settings

**Files to modify**:
- `src/components/editor/RichTextEditor.tsx` - Selection handling
- `src/services/ai.ts` - Add `regenerateSection()` function
- `supabase/functions/regenerate-section/index.ts`

---

#### Streaming Responses
**Value**: Medium | **Complexity**: High | **Effort**: 2 weeks

Real-time token-by-token display during generation.

**Implementation**:
- Server-Sent Events from Edge Functions
- Streaming UI component
- Progressive rendering in preview
- Cancel generation button

**Files to modify**:
- Edge Functions - Add streaming support
- `src/hooks/use-ai.ts` - Streaming state management
- `src/components/ai/StreamingPreview.tsx`

---

#### AI Cost Tracking
**Value**: High | **Complexity**: Medium | **Effort**: 1 week

Track and report AI usage per client for billing.

**Implementation**:
- Log AI calls with token counts
- Cost calculation based on model pricing
- Per-client usage dashboard
- Monthly usage reports

**Files to create**:
- `supabase/migrations/xxx_ai_usage_log.sql`
- `src/services/ai-usage.ts`
- `src/pages/pr-portal/AIUsagePage.tsx`

---

#### Proactive Suggestions Engine
**Value**: High | **Complexity**: High | **Effort**: 2-3 weeks

AI-powered suggestions while editing.

**Features**:
- "Improve this paragraph" button
- Automatic headline optimization
- Quote enhancement for executive statements
- SEO optimization hints

**Files to create**:
- `src/components/editor/SuggestionButton.tsx`
- `supabase/functions/suggest-improvement/index.ts`
- `src/hooks/use-proactive-suggestions.ts`

---

### 3.3 Smart Content Library

#### Searchable Content Archive
**Value**: High | **Complexity**: Medium | **Effort**: 2 weeks

Full-text search across all approved content.

**Implementation**:
- PostgreSQL full-text search with Japanese support
- "Similar content" recommendations
- Reusable content blocks (boilerplates, ISI)
- Content performance tracking

**Files to create**:
- `supabase/migrations/xxx_content_search.sql`
- `src/services/content-search.ts`
- `src/pages/pr-portal/ContentLibraryPage.tsx`

---

## P4: Enterprise & Integration Ecosystem

### 4.1 Enterprise Features

#### SSO/SAML Authentication
**Value**: High (Enterprise) | **Complexity**: High | **Effort**: 2-3 weeks

Single Sign-On for enterprise clients.

**Implementation**:
- Supabase Auth SAML provider configuration
- Organization-level SSO settings
- Just-in-time user provisioning
- SCIM user sync (optional)

---

#### Custom Domain / White-Label
**Value**: Medium | **Complexity**: High | **Effort**: 3-4 weeks

Allow agencies to use their own domain.

**Implementation**:
- Custom domain configuration
- Branding customization (logo, colors)
- Email templates with custom branding
- DNS verification flow

---

#### Advanced Audit Logging
**Value**: High (Enterprise) | **Complexity**: Medium | **Effort**: 1-2 weeks

Comprehensive audit trail for compliance.

**Implementation**:
- Log all user actions with timestamps
- Export audit logs as CSV/JSON
- Retention policy configuration
- Search and filter audit events

---

### 4.2 Integrations Ecosystem

#### Slack Integration
**Value**: High | **Complexity**: Medium | **Effort**: 1-2 weeks

Receive notifications in Slack.

**Implementation**:
- Slack app OAuth flow
- Channel selection for notifications
- Notification type filtering
- Quick actions from Slack

---

#### CRM Integration (Salesforce/HubSpot)
**Value**: Medium | **Complexity**: High | **Effort**: 3-4 weeks

Sync client data with CRM.

**Implementation**:
- OAuth connection flow
- Bi-directional sync of client records
- Activity logging to CRM
- Project status sync

---

#### Calendar Integration
**Value**: Medium | **Complexity**: Medium | **Effort**: 1-2 weeks

Sync deadlines with Google/Outlook Calendar.

**Implementation**:
- OAuth for Google/Microsoft
- Create calendar events for deadlines
- Update events on date changes
- Calendar-based project timeline view

---

#### Wire Service Distribution
**Value**: Medium | **Complexity**: High | **Effort**: 3-4 weeks

Direct distribution to PR Newswire, etc.

**Implementation**:
- API integration with distribution services
- Distribution workflow in approval
- Tracking of distribution status
- Distribution analytics

---

## P5: Mobile Enhancement

### 5.1 Native Mobile Features

#### Native iOS/Android Apps (Optional)
**Value**: Medium | **Complexity**: Very High | **Effort**: 2-3 months

Native apps for power users.

**Approach Options**:
- React Native wrapper
- Capacitor/Ionic wrapper
- Full native development

---

#### Push Notifications
**Value**: High | **Complexity**: Medium | **Effort**: 1 week

Native push notifications for mobile.

**Implementation**:
- Firebase Cloud Messaging integration
- Push subscription management
- Deep linking from notifications
- Notification preferences

---

#### Biometric Authentication
**Value**: Medium | **Complexity**: Low | **Effort**: 2-3 days

Touch ID / Face ID login.

**Implementation**:
- Web Authentication API (WebAuthn)
- Biometric enrollment flow
- Fallback to password

---

## Success Metrics

### Platform Metrics
| Metric | Current | 6-Month Target | 12-Month Target |
|--------|---------|----------------|-----------------|
| Active industries | 1 | 5 | 10+ |
| Active clients | TBD | 50+ | 200+ |
| Monthly content items | TBD | 500+ | 2000+ |
| AI generation accuracy | ~80% | 90% | 95% |
| Average approval time | ~24-48h | <12h | <8h |

### User Satisfaction
| Metric | Target |
|--------|--------|
| PR Staff satisfaction | >4.5/5 |
| Client NPS | >50 |
| Feature request resolution | <30 days |
| Support ticket resolution | <24h |

---

## Implementation Notes

### Quick Wins (< 1 week each)
1. ~~Content Duplication - 2-3 days~~ ✅ COMPLETE
2. Keyboard Shortcuts - 2-3 days
3. Biometric Authentication - 2-3 days

### High-Impact Medium Effort (1-2 weeks each)
1. Project Templates - 1 week
2. Deadline Reminders - 3-4 days
3. Staff Workload Dashboard - 1 week
4. AI Cost Tracking - 1 week
5. Slack Integration - 1-2 weeks

### Strategic Investments (3+ weeks)
1. Multi-Industry Module System - 3-4 weeks
2. Sequential Approval Workflows - 1-2 weeks
3. Streaming AI Responses - 2 weeks
4. SSO/SAML - 2-3 weeks
5. CRM Integration - 3-4 weeks

---

## Recommended Next Steps

Based on anticipated value and implementation complexity:

### Immediate (Next 2 weeks)
1. ~~**Content Duplication**~~ ✅ COMPLETE - February 3, 2025
2. **Keyboard Shortcuts** - Power user productivity
3. **Deadline Reminders** - Reduces review bottlenecks

### Short-term (Next month)
4. **Project Templates** - Reduces project setup time
5. **Staff Workload Dashboard** - Improves resource allocation
6. **AI Cost Tracking** - Enables usage-based billing

### Medium-term (Next quarter)
7. **Multi-Industry Module System** - Revenue expansion
8. **Section-Level Regeneration** - AI UX improvement
9. **Slack Integration** - Enterprise appeal

---

*This roadmap is a living document and should be updated as priorities evolve.*

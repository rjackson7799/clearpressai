# ClearPress AI - Product Requirements Document

**Version**: 1.0  
**Last Updated**: January 30, 2025  
**Status**: MVP Definition  
**Document Owner**: Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [User Personas](#3-user-personas)
4. [User Journeys](#4-user-journeys)
5. [Information Architecture](#5-information-architecture)
6. [Feature Specifications](#6-feature-specifications)
7. [Industry Module Framework](#7-industry-module-framework)
8. [AI Capabilities](#8-ai-capabilities)
9. [Design System](#9-design-system)
10. [Security & Compliance](#10-security--compliance)
11. [Success Metrics & KPIs](#11-success-metrics--kpis)
12. [MVP Roadmap](#12-mvp-roadmap)
13. [Future Considerations](#13-future-considerations)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### 1.1 Product Overview

**ClearPress AI** is a B2B SaaS platform that empowers PR firms to create culturally-nuanced, industry-compliant content using AI. The platform provides a sophisticated admin interface for PR professionals and a streamlined, mobile-first collaboration portal for their clients.

### 1.2 Problem Statement

PR firms serving specialized industries face significant challenges:

| Challenge | Impact |
|-----------|--------|
| **Time-Intensive Content Creation** | Press releases take 4-8 hours to draft, review, and refine |
| **Industry Compliance Complexity** | Pharmaceutical, legal, and financial industries have strict regulatory requirements |
| **Cultural & Linguistic Nuance** | Content must resonate across cultures while maintaining accuracy |
| **Fragmented Client Collaboration** | Email chains, version confusion, and unclear approval workflows |
| **Scalability Limitations** | Quality suffers as client portfolio grows |
| **Multi-Language Demands** | Global clients need content in multiple languages with cultural adaptation |

### 1.3 Solution

ClearPress AI addresses these challenges through:

| Capability | Benefit |
|------------|---------|
| **AI-Powered Content Generation** | Reduce draft creation from hours to minutes |
| **Industry-Specific Compliance** | Built-in regulatory checking for specialized industries |
| **Cultural Intelligence** | AI trained on cultural nuances for Japan and global markets |
| **Client Collaboration Portal** | Streamlined review and approval with full audit trail |
| **Multi-Language Support** | Generate and translate content across languages |
| **Campaign Management** | Organize multiple deliverables under unified projects |

### 1.4 Target Market

**Primary**: PR firms based in Japan serving domestic and international clients

**Secondary**: Global PR firms with Japanese clientele

**Initial Focus**: 
- PR firms serving pharmaceutical industry clients
- Japan market with Japanese language as primary

### 1.5 MVP Scope Summary

| Attribute | Decision |
|-----------|----------|
| Timeline | 12-16 weeks |
| Industry Modules | Pharmaceutical (Japan regulations) |
| Content Types | Press Release, Blog Post, Social Media, Internal Memo, FAQ, Executive Statement |
| UI Language | Bilingual (Japanese default + English) |
| Content Output | Multi-language (Japanese primary, export/translate to others) |
| AI Backend | Claude API (Anthropic) |
| Frontend | React + TypeScript + Tailwind |
| Backend | Supabase (Auth, PostgreSQL, Realtime, Edge Functions) |
| Email | Resend |
| Mobile Strategy | App-simulated for clients, responsive for admin |

### 1.6 Key Stakeholders

| Role | Responsibility |
|------|----------------|
| PR Firm (Platform Operator) | Manages clients, creates content, delivers results |
| Client Organizations | Request projects, review content, provide approvals |
| End Audiences | Consume the final published content (media, public, investors) |

---

## 2. Product Vision & Goals

### 2.1 Vision Statement

> Transform how PR firms create and deliver content by combining human creativity with AI precision—enabling culturally-intelligent, compliance-ready communications at unprecedented speed.

### 2.2 Mission

To become the trusted AI platform for PR content creation in Japan, setting the standard for industry-specific, culturally-aware marketing communications.

### 2.3 Product Principles

| Principle | Description |
|-----------|-------------|
| **Compliance First** | Industry regulations are non-negotiable; every feature respects compliance requirements |
| **Cultural Intelligence** | AI understands cultural nuances, not just language translation |
| **Human in the Loop** | AI assists and accelerates; humans make final decisions |
| **Client Transparency** | Clients see what they need, when they need it—no more, no less |
| **Mobile Reality** | Busy executives approve on their phones; design for this reality |
| **Audit Everything** | Complete traceability for regulatory and client accountability |

### 2.4 Business Goals

| Goal | Target | Timeframe |
|------|--------|-----------|
| Reduce content creation time | 70% reduction | MVP Launch |
| Client approval cycle time | < 48 hours average | 3 months post-launch |
| Client satisfaction | > 4.5/5 rating | 6 months post-launch |
| PR firm efficiency | 3x more projects per staff | 6 months post-launch |
| Platform reliability | 99.5% uptime | Ongoing |

### 2.5 Success Criteria for MVP

- [ ] PR staff can create all 6 content types using AI generation
- [ ] Pharmaceutical compliance checking catches > 90% of regulatory issues
- [ ] Clients can review and approve content on mobile devices
- [ ] Complete audit trail for all content changes and approvals
- [ ] Multi-language export produces culturally-appropriate content
- [ ] Average project turnaround reduced by 50%

---

## 3. User Personas

### 3.1 Primary Persona: PR Admin (Agency Owner/Manager)

**Name**: Nakamura Hiroshi (中村 浩)  
**Title**: Managing Director, Tokyo PR Agency  
**Age**: 48  
**Experience**: 20+ years in PR, 10 years running own agency

#### Background
Nakamura-san founded his PR agency 10 years ago after a successful career at a major international firm. His agency specializes in pharmaceutical and healthcare communications, with 8 staff members serving 15 active clients. He's tech-savvy but prioritizes tools that deliver immediate value without extensive training.

#### Goals
- Scale the agency without proportionally increasing headcount
- Maintain quality standards that built the agency's reputation
- Reduce time spent on administrative tasks and status updates
- Differentiate from competitors through technology and speed

#### Pain Points
- Staff spending 60% of time on routine content, limiting strategic work
- Compliance reviews creating bottlenecks with pharmaceutical clients
- Difficulty tracking project status across multiple clients
- Client communication scattered across email, chat, and calls
- Translation and localization adding days to project timelines

#### Technology Profile
- Primary device: MacBook Pro (office), iPhone (mobile)
- Comfortable with: Slack, Google Workspace, basic project management tools
- Frustrated by: Complex enterprise software, tools requiring IT support

#### Key Features Used
- Client and project management dashboards
- Staff assignment and workload overview
- Industry module configuration
- Business analytics and reporting
- User management

#### Success Metrics
- Agency revenue per employee
- Client retention rate
- Average project turnaround time
- Staff utilization rate

#### Quote
> "I need my team focused on strategy and client relationships, not wrestling with compliance checklists and formatting documents."

---

### 3.2 Primary Persona: PR Staff (Content Creator)

**Name**: Sato Yuki (佐藤 優希)  
**Title**: Senior Account Executive  
**Age**: 32  
**Experience**: 8 years in PR, specializing in pharmaceutical communications

#### Background
Sato-san handles 4-5 client accounts simultaneously, creating press releases, coordinating with media, and managing client relationships. She has deep knowledge of pharmaceutical regulations from years of experience but finds compliance documentation tedious. She's eager to adopt tools that reduce repetitive work.

#### Goals
- Produce high-quality content faster
- Reduce back-and-forth with compliance reviewers
- Maintain consistent brand voice across clients
- Have more time for strategic thinking and client interaction

#### Pain Points
- Spending hours on first drafts that get heavily revised
- Manually checking compliance requirements for each piece
- Remembering each client's preferred tone and style
- Managing feedback from multiple client stakeholders
- Tight deadlines with limited support

#### Technology Profile
- Primary device: Windows laptop (office), iPhone (mobile)
- Power user of: Microsoft Office, Slack, various PR tools
- Wishes for: AI writing assistance, automated compliance checking

#### Key Features Used
- AI content generation
- Compliance checking and suggestions
- Client tone/style profiles
- Project management and deadlines
- Version history and comparison

#### Success Metrics
- Content pieces produced per week
- First-draft acceptance rate
- Revision cycles per project
- Client satisfaction scores

#### Quote
> "If AI can give me a solid first draft that's already compliance-checked, I can focus on making it brilliant rather than just making it acceptable."

---

### 3.3 Primary Persona: Client User (Marketing Manager)

**Name**: Yamamoto Keiko (山本 恵子)  
**Title**: Marketing Communications Manager, Pharma Company  
**Age**: 41  
**Experience**: 15 years in pharmaceutical marketing

#### Background
Yamamoto-san manages external communications for her company's oncology portfolio. She works with three PR agencies and coordinates internal stakeholders including medical affairs, legal, and executive leadership. She reviews content on the go between meetings and during her commute.

#### Goals
- Get quality PR content without micromanaging agencies
- Ensure all content meets internal and regulatory standards
- Quickly approve time-sensitive announcements
- Maintain visibility into project progress
- Reduce internal coordination overhead

#### Pain Points
- Drowning in email threads about content revisions
- Difficulty reviewing documents on mobile devices
- No clear view of what's pending her approval
- Having to re-explain brand preferences to agencies
- Unclear version history leading to confusion

#### Technology Profile
- Primary device: iPhone (70% of work), Windows laptop (office)
- Comfortable with: Email, Teams, basic mobile apps
- Frustrated by: Desktop-only tools, complex interfaces

#### Key Features Used
- Mobile-optimized review interface
- Approval workflows with one-tap actions
- Comment and feedback tools
- Project status dashboard
- Notification center

#### Success Metrics
- Time from draft receipt to approval
- Number of revision cycles
- Internal stakeholder satisfaction
- Compliance issues caught before publication

#### Quote
> "I review most content during my train commute. If I can't approve it on my phone, it waits until I'm back at my desk—and that could be days."

---

### 3.4 Secondary Persona: Client Executive (Occasional Approver)

**Name**: Tanaka Takeshi (田中 武)  
**Title**: VP of Corporate Communications, Pharma Company  
**Age**: 55  
**Experience**: 25+ years, executive for 10 years

#### Background
Tanaka-san provides final approval on major announcements but delegates routine content to his team. He's extremely busy, often traveling, and needs the simplest possible interface when he does need to review something.

#### Goals
- Approve important content quickly without learning new tools
- Trust that his team has already vetted the content
- Maintain oversight without micromanaging

#### Pain Points
- Too many tools requiring logins and learning
- Content buried in long email chains
- No context when asked to approve something
- Difficulty reading documents on phone

#### Technology Profile
- Primary device: iPhone, occasionally iPad
- Minimal app usage beyond email and calendar
- Expects: Intuitive interfaces requiring zero training

#### Key Features Used
- Simplified approval view (content + approve/reject)
- Mobile-optimized reading experience
- Approval history

#### Quote
> "Send me a link, let me read it, and let me tap 'approved.' That's all I need."

---

### 3.5 Edge Case Personas

#### The Skeptical Client
**Profile**: Prefers traditional methods, resistant to new platforms  
**Accommodation**: Email notification option with direct approval links; minimal required platform interaction

#### The Over-Involved Client
**Profile**: Wants to edit everything directly, multiple revision requests  
**Accommodation**: Suggestion mode with tracked changes; revision limits and escalation paths

#### The Multi-Stakeholder Client
**Profile**: Requires approval from legal, medical affairs, and executives  
**Accommodation**: Future feature—sequential approval workflows (post-MVP)

#### The Urgent Request Client
**Profile**: Frequently has crisis communications or time-sensitive announcements  
**Accommodation**: Priority project flags, deadline tracking, notification escalation

---

## 4. User Journeys

### 4.1 Journey: Client Requests New Project

**Persona**: Yamamoto Keiko (Client User)  
**Goal**: Request a press release for a new clinical trial result  
**Context**: On mobile during morning commute

#### Happy Path

```
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER: Yamamoto receives clinical trial results to announce   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. OPEN APP                                                     │
│    • Opens ClearPress AI on iPhone                              │
│    • Sees dashboard with active projects                        │
│    • Taps "Request" in bottom navigation                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. SELECT PROJECT TYPE                                          │
│    • Sees content type options (Press Release highlighted)      │
│    • Selects "Press Release"                                    │
│    • Industry auto-filled as "Pharmaceutical"                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. FILL PROJECT REQUEST FORM                                    │
│    • Project name: "OncoDrug Phase 3 Results"                   │
│    • Urgency: Priority (2-3 days)                               │
│    • Target date: February 5, 2025                              │
│    • Brief description: Types key points                        │
│    • Uploads: Attaches clinical trial summary PDF               │
│    • Target audience: Healthcare media, investors               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. AI BRIEF EXPANSION (Automatic)                               │
│    • AI analyzes brief and uploaded documents                   │
│    • Generates expanded project requirements                    │
│    • Shows: Key messages, compliance considerations, timeline   │
│    • Yamamoto reviews and adjusts if needed                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. SUBMIT REQUEST                                               │
│    • Taps "Submit Request"                                      │
│    • Sees confirmation with reference number                    │
│    • Returns to dashboard—new project shows as "Requested"      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. PR FIRM NOTIFIED                                             │
│    • PR Admin receives in-app notification                      │
│    • Email sent to assigned account team                        │
│    • Project appears in PR Admin queue                          │
└─────────────────────────────────────────────────────────────────┘
```

#### Edge Cases & Error Handling

| Scenario | System Response |
|----------|-----------------|
| **Incomplete form submission** | Highlights required fields, saves draft automatically |
| **Large file upload fails** | Retry option, alternative upload method (link) |
| **Network disconnection mid-form** | Auto-saves draft, restores on reconnection |
| **Duplicate project name** | Suggests adding date or version suffix |
| **Client selects "Crisis" urgency** | Triggers immediate notification to PR Admin with alert |

---

### 4.2 Journey: PR Staff Creates Content

**Persona**: Sato Yuki (PR Staff)  
**Goal**: Create press release for Yamamoto's clinical trial announcement  
**Context**: At desk with full workstation

#### Happy Path

```
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER: PR Admin assigns project to Sato                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. REVIEW PROJECT BRIEF                                         │
│    • Opens project from dashboard                               │
│    • Reviews client request and AI-expanded brief               │
│    • Checks uploaded reference documents                        │
│    • Reviews client's historical tone preferences               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ACCESS AI CONTENT STUDIO                                     │
│    • Clicks "Create Content" on project                         │
│    • Content type pre-selected (Press Release)                  │
│    • Client style profile loaded automatically                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CONFIGURE GENERATION SETTINGS                                │
│    • Primary language: Japanese                                 │
│    • Tone: Professional (client default)                        │
│    • Target audience: Healthcare media + investors              │
│    • Compliance level: Strict (pharmaceutical)                  │
│    • Required elements: ISI, clinical data, company boilerplate │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. GENERATE INITIAL DRAFT                                       │
│    • Clicks "Generate Draft"                                    │
│    • AI processes request (streaming response visible)          │
│    • Draft appears in editor (15-30 seconds)                    │
│    • Compliance score shown immediately (e.g., 78/100)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. REVIEW COMPLIANCE SUGGESTIONS                                │
│    • Sidebar shows compliance issues:                           │
│      - Warning: "Efficacy claim needs clinical reference"       │
│      - Suggestion: "Consider adding patient population size"    │
│    • Each suggestion shows before/after text                    │
│    • Sato accepts 3 suggestions, dismisses 1 with reason        │
│    • Score improves to 94/100                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. REFINE AND POLISH                                            │
│    • Makes manual edits to improve flow                         │
│    • Uses "Adjust Tone" for executive quote section             │
│    • Compliance re-checks automatically                         │
│    • Saves version: "Draft v1 - Initial AI generation"          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. INTERNAL REVIEW (Optional)                                   │
│    • Shares with PR Admin for internal review                   │
│    • Admin provides feedback via comments                       │
│    • Sato incorporates feedback                                 │
│    • Saves version: "Draft v2 - Internal review complete"       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. SUBMIT TO CLIENT                                             │
│    • Clicks "Submit to Client"                                  │
│    • Adds note: "Ready for your review. Key changes from..."    │
│    • Selects reviewers: Yamamoto + Tanaka (executive)           │
│    • Confirms submission                                        │
│    • Client notified via app and email                          │
└─────────────────────────────────────────────────────────────────┘
```

#### Edge Cases & Error Handling

| Scenario | System Response |
|----------|-----------------|
| **AI generation fails** | Retry button, option to start with template instead |
| **Compliance score too low (<60)** | Warning before client submission, requires override or fixes |
| **Client style profile missing** | Prompts to upload reference documents or proceed with defaults |
| **Network timeout during save** | Auto-saves locally, syncs when connection restored |
| **Session expires during editing** | Preserves work, re-authenticates, continues without loss |

---

### 4.3 Journey: Client Reviews and Approves

**Persona**: Yamamoto Keiko (Client User)  
**Goal**: Review and approve the press release  
**Context**: On iPhone during lunch break

#### Happy Path

```
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER: Push notification "New draft ready for review"         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. OPEN FROM NOTIFICATION                                       │
│    • Taps notification on iPhone                                │
│    • App opens directly to draft review screen                  │
│    • Sees PR staff note: "Ready for your review..."             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. READ CONTENT                                                 │
│    • Scrolls through press release                              │
│    • Mobile-optimized reading experience                        │
│    • Key sections collapsible for easy navigation               │
│    • Compliance score badge visible (94/100 ✓)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. PROVIDE FEEDBACK (Optional)                                  │
│    Option A: Quick Response Template                            │
│    • Taps "Request Changes"                                     │
│    • Selects: "Adjust tone - more conservative"                 │
│    • Adds note: "CEO prefers softer language on efficacy"       │
│                                                                 │
│    Option B: Inline Comment                                     │
│    • Long-press on specific paragraph                           │
│    • Types comment: "Can we add patient quote here?"            │
│                                                                 │
│    Option C: Direct Edit (Suggestion Mode)                      │
│    • Taps edit icon                                             │
│    • Makes text changes directly                                │
│    • Changes tracked as suggestions                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. SUBMIT RESPONSE                                              │
│    If requesting changes:                                       │
│    • Taps "Submit Feedback"                                     │
│    • Confirms: "Send feedback to PR team?"                      │
│    • Project status: "Needs Revision"                           │
│                                                                 │
│    If approving:                                                │
│    • Taps "Approve" button                                      │
│    • Confirms: "Approve this draft?"                            │
│    • Optional: Add approval note                                │
│    • Project status: "Approved"                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. CONFIRMATION                                                 │
│    • Sees success message                                       │
│    • Returns to dashboard                                       │
│    • Project moved to appropriate status                        │
│    • PR team notified immediately                               │
└─────────────────────────────────────────────────────────────────┘
```

#### Edge Cases & Error Handling

| Scenario | System Response |
|----------|-----------------|
| **Client edits break compliance** | Real-time warning, compliance score updates, flags for PR review |
| **Accidental approval tap** | 3-second undo option, confirmation required for final approval |
| **Multiple reviewers conflict** | Latest feedback takes precedence, all feedback visible in log |
| **Client offline when reviewing** | Content cached for reading, actions queued until online |
| **Session timeout during review** | Draft feedback preserved, can continue after re-login |

---

### 4.4 Journey: Crisis/Urgent Project Flow

**Persona**: Yamamoto Keiko (Client User) + Sato Yuki (PR Staff)  
**Goal**: Rapid response to unexpected news requiring immediate press statement  
**Context**: Breaking situation requiring same-day response

#### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER: Yamamoto submits "Crisis" urgency project request      │
│          at 9:00 AM                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ IMMEDIATE ESCALATION                                            │
│ • PR Admin receives urgent alert (app + email + sound)          │
│ • Project flagged red in all views                              │
│ • Auto-assigns to available senior staff                        │
│ • SLA timer starts (same-day deadline visible)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ACCELERATED CREATION (9:15 AM)                                  │
│ • Sato opens urgent project immediately                         │
│ • AI generates draft with crisis communication template         │
│ • Compliance check runs in parallel                             │
│ • Draft ready in 20 minutes                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ RAPID REVIEW CYCLE (10:00 AM)                                   │
│ • Submitted to client with "URGENT" flag                        │
│ • Yamamoto receives priority notification                       │
│ • Notification includes: "Deadline: Today 3:00 PM"              │
│ • Quick review on mobile                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ EXPEDITED APPROVAL (11:30 AM)                                   │
│ • Yamamoto approves with minor edits                            │
│ • Executive approval bypassed (pre-authorized for crisis)       │
│ • Final version exported immediately                            │
│ • Audit trail captures accelerated approval path                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ COMPLETION (12:00 PM)                                           │
│ • Project completed in 3 hours                                  │
│ • Exported in Japanese + English                                │
│ • All parties notified of completion                            │
│ • Post-incident review scheduled                                │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.5 Journey: First-Time User Onboarding

**Persona**: New Client User  
**Goal**: Access the platform for the first time and understand how to use it  
**Context**: Received invitation email from PR firm

#### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. INVITATION                                                   │
│    • Receives email: "You've been invited to ClearPress AI"     │
│    • Email includes: PR firm name, project context, CTA button  │
│    • Clicks "Accept Invitation"                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ACCOUNT SETUP                                                │
│    • Lands on registration page (client-branded)                │
│    • Enters: Name, password                                     │
│    • Email pre-filled from invitation                           │
│    • Accepts terms of service                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. PROFILE SETUP                                                │
│    • Language preference (Japanese/English)                     │
│    • Theme preference (Light/Dark/System)                       │
│    • Notification preferences                                   │
│    • Optional: Profile photo                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. GUIDED TOUR (Optional, dismissible)                          │
│    • 4-5 tooltip walkthrough of key features:                   │
│      - Dashboard overview                                       │
│      - How to request new project                               │
│      - How to review and approve content                        │
│      - Where to find notifications                              │
│    • "Skip tour" option always visible                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. DASHBOARD                                                    │
│    • Sees assigned projects immediately                         │
│    • Empty state if no projects yet:                            │
│      "No active projects. Request your first project?"          │
│    • Help resources accessible from header                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Information Architecture

### 5.1 PR Firm Portal (Admin/Staff) - Site Map

```
ClearPress AI - PR Portal
│
├── 🏠 Dashboard
│   ├── Overview metrics (projects, deadlines, client activity)
│   ├── Recent activity feed
│   ├── Pending actions (approvals needed, overdue items)
│   └── Quick actions (new project, new client)
│
├── 👥 Clients
│   ├── Client list (with search, filter by industry)
│   ├── Client detail
│   │   ├── Overview (projects, contacts, activity)
│   │   ├── Projects (active, archived)
│   │   ├── Users (client contacts with access)
│   │   ├── Files (brand guidelines, reference docs)
│   │   ├── Style profile (tone preferences, learned style)
│   │   └── Settings (industry, preferences)
│   └── Add new client
│
├── 📁 Projects
│   ├── All projects (with filters: status, client, urgency, date)
│   ├── Project detail
│   │   ├── Overview (brief, timeline, team)
│   │   ├── Content items (deliverables within project)
│   │   │   └── Content editor (AI studio)
│   │   ├── Files (project-specific uploads)
│   │   ├── Activity log (all actions, changes)
│   │   ├── Comments (internal discussion)
│   │   └── Settings (workflow, deadlines)
│   ├── New project
│   └── Project requests (from clients)
│
├── ✏️ AI Content Studio (accessed from project)
│   ├── Content type selector
│   ├── Generation settings
│   ├── Editor with AI assistance
│   ├── Compliance sidebar
│   │   ├── Score overview
│   │   ├── Suggestions list
│   │   └── Compliance details
│   ├── Tone adjustment
│   ├── Version history
│   └── Export options
│
├── 📊 Analytics
│   ├── Project metrics
│   ├── Client insights
│   ├── Team performance
│   └── Export reports
│
├── ⚙️ Settings
│   ├── Organization
│   │   ├── Company profile
│   │   ├── Branding (logo, colors)
│   │   └── Billing (future)
│   ├── Industries
│   │   ├── Industry list
│   │   ├── Industry configuration
│   │   └── Add new industry
│   ├── Users
│   │   ├── Team members
│   │   ├── Roles & permissions
│   │   └── Invite user
│   ├── Templates
│   │   ├── Content templates
│   │   └── Email templates
│   └── Integrations (future)
│
└── 👤 Profile (user menu)
    ├── My profile
    ├── Preferences (language, theme)
    ├── Notifications settings
    └── Sign out
```

### 5.2 Client Portal - Site Map

```
ClearPress AI - Client Portal
│
├── 🏠 Home (Dashboard)
│   ├── Action required (pending reviews)
│   ├── Active projects summary
│   ├── Recent activity
│   └── Quick stats
│
├── 📁 Projects
│   ├── Active projects
│   ├── Project detail
│   │   ├── Overview (status, timeline, team)
│   │   ├── Deliverables (content items)
│   │   │   └── Content review view
│   │   ├── Files
│   │   └── Activity history
│   ├── Archived projects
│   └── Request new project
│
├── ➕ Request (prominent action)
│   ├── Content type selection
│   ├── Project request form
│   ├── AI brief expansion preview
│   └── Confirmation
│
├── 🔔 Notifications
│   ├── All notifications
│   ├── Unread
│   └── Settings
│
└── 👤 Profile
    ├── My information
    ├── Preferences (language, theme)
    ├── Reference documents (my uploads)
    ├── Notification settings
    └── Sign out
```

### 5.3 Mobile Navigation (Client Portal)

```
┌─────────────────────────────────────────┐
│        [Client Logo]         [Avatar]   │  ← Minimal header
├─────────────────────────────────────────┤
│                                         │
│                                         │
│          Content Area                   │
│          (Scrollable)                   │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  🏠      📁       ➕       🔔      👤   │  ← Bottom navigation
│ Home  Projects  Request  Alerts  Profile│
└─────────────────────────────────────────┘

Bottom Navigation States:
• 🏠 Home - Active/Inactive
• 📁 Projects - Active/Inactive, badge for pending reviews
• ➕ Request - Always prominent (primary action)
• 🔔 Alerts - Badge with unread count
• 👤 Profile - Active/Inactive
```

---

## 6. Feature Specifications

### 6.1 Authentication & Access Control

#### 6.1.1 User Authentication

**Description**: Secure login system with email and password.

**Acceptance Criteria**:
- [ ] User can log in with email and password
- [ ] Password requirements: 8+ characters, 1 uppercase, 1 number
- [ ] "Forgot password" sends reset email via Resend
- [ ] Session persists for 7 days (refreshed on activity)
- [ ] Force logout on password change
- [ ] Login page shows appropriate branding (PR firm or client)

**User Roles**:

| Role | Scope | Capabilities |
|------|-------|--------------|
| PR Admin | Full platform | Manage clients, projects, users, industries, settings |
| PR Staff | Assigned projects | Create/edit content, submit for review, internal comments |
| Client User | Invited projects | View projects, review content, provide feedback, approve |

**Permission Matrix**:

| Permission | PR Admin | PR Staff | Client User |
|------------|----------|----------|-------------|
| Manage clients | ✓ | - | - |
| Manage users | ✓ | - | - |
| Configure industries | ✓ | - | - |
| Create projects | ✓ | ✓ | Request only |
| Assign projects | ✓ | - | - |
| Edit content (AI Studio) | ✓ | ✓ | - |
| Submit to client | ✓ | ✓ | - |
| Review content | ✓ | ✓ | ✓ |
| Approve content | ✓ | - | ✓ |
| View analytics | ✓ | Limited | - |
| Export content | ✓ | ✓ | ✓ (approved only) |

**Priority**: P0  
**Complexity**: Medium

---

#### 6.1.2 User Management (PR Admin)

**Description**: PR Admin can manage all users across the platform.

**Acceptance Criteria**:
- [ ] Admin can invite new PR Staff via email
- [ ] Admin can invite Client Users to specific clients/projects
- [ ] Admin can edit user details (name, email, role)
- [ ] Admin can deactivate users (soft delete)
- [ ] Deactivated users cannot log in but audit trail preserved
- [ ] User list shows: name, email, role, client (if applicable), status, last active

**Invitation Flow**:
1. Admin enters email and selects role
2. For Client Users: selects client organization and projects
3. System sends branded invitation email
4. User clicks link and creates password
5. User directed to onboarding flow

**Priority**: P0  
**Complexity**: Medium

---

### 6.2 Client Management

#### 6.2.1 Client Organizations

**Description**: Manage client companies that the PR firm serves.

**Acceptance Criteria**:
- [ ] Admin can create new client organization
- [ ] Client profile includes: name, industry, logo, description
- [ ] Admin can assign one or more industries to a client
- [ ] Admin can upload client branding (logo for their portal)
- [ ] Admin can add multiple client users to a client
- [ ] Client list shows: name, industry, active projects count, users count
- [ ] Search and filter clients by name, industry

**Client Profile Fields**:

| Field | Type | Required |
|-------|------|----------|
| Company name | Text | Yes |
| Industry | Select (multiple) | Yes |
| Logo | Image upload | No |
| Description | Text | No |
| Primary contact | Text | No |
| Website | URL | No |
| Notes | Rich text | No |

**Priority**: P0  
**Complexity**: Low

---

#### 6.2.2 Client Style Profile

**Description**: Store and learn client's preferred tone and style.

**Acceptance Criteria**:
- [ ] Admin/Staff can upload reference documents (previous press releases, style guides)
- [ ] System categorizes uploads (reference, brand guidelines, tone examples)
- [ ] Each upload can have description and category
- [ ] AI analyzes uploads to extract style characteristics
- [ ] Style profile shows: extracted tone, vocabulary patterns, structure preferences
- [ ] Style profile applied automatically to content generation
- [ ] Manual overrides available per project

**Reference Document Categories**:
- Previous Press Releases
- Brand Guidelines
- Tone/Voice Examples
- Competitor Examples

**Priority**: P0  
**Complexity**: Medium

---

### 6.3 Project Management

#### 6.3.1 Project Creation (PR Admin/Staff)

**Description**: Create new projects assigned to clients.

**Acceptance Criteria**:
- [ ] Admin/Staff can create project directly
- [ ] Project linked to a client organization
- [ ] Project can contain multiple content items (deliverables)
- [ ] Set project urgency: Standard, Priority, Urgent, Crisis
- [ ] Set target completion date
- [ ] Assign PR staff members to project
- [ ] Add project brief and reference documents
- [ ] Invite specific client users as reviewers

**Project Fields**:

| Field | Type | Required |
|-------|------|----------|
| Project name | Text | Yes |
| Client | Select | Yes |
| Content types | Multi-select | Yes |
| Urgency | Select | Yes |
| Target date | Date | Yes |
| Brief | Rich text | Yes |
| Reference files | File upload | No |
| Assigned staff | Multi-select | No |
| Client reviewers | Multi-select | No |

**Priority**: P0  
**Complexity**: Medium

---

#### 6.3.2 Project Requests (Client-Initiated)

**Description**: Clients can request new projects from their portal.

**Acceptance Criteria**:
- [ ] Client sees "Request New Project" option prominently
- [ ] Form includes: content types, urgency, target date, brief description
- [ ] File upload available for reference documents
- [ ] AI Brief Expander processes initial brief
- [ ] Expanded brief shown for client review before submission
- [ ] Client can edit AI-expanded brief
- [ ] Submitted request appears in PR Admin queue
- [ ] PR Admin notified immediately (app + email)
- [ ] Admin reviews and converts to active project

**Request Form Fields**:

| Field | Type | Required |
|-------|------|----------|
| Project name | Text | Yes |
| Content type(s) | Multi-select | Yes |
| Urgency | Select | Yes |
| Target date | Date | Yes |
| Brief description | Textarea | Yes |
| Target audience | Multi-select | No |
| Reference files | File upload | No |
| Additional notes | Textarea | No |

**Priority**: P0  
**Complexity**: Medium

---

#### 6.3.3 AI Brief Expander

**Description**: AI automatically expands client's brief into structured project requirements.

**Acceptance Criteria**:
- [ ] Triggers automatically when brief is entered
- [ ] Analyzes brief text and any uploaded documents
- [ ] Generates expanded requirements:
  - Key messages to convey
  - Target audience analysis
  - Suggested structure
  - Compliance considerations
  - Potential challenges
  - Recommended timeline
- [ ] Client/Admin can edit expanded brief
- [ ] Changes preserved when saving project

**Priority**: P0 (MVP Value-Add)  
**Complexity**: Medium

---

#### 6.3.4 Project Dashboard

**Description**: Overview of all projects with status tracking.

**Acceptance Criteria**:
- [ ] List view showing all projects with key info
- [ ] Filter by: status, client, urgency, date range, assigned staff
- [ ] Sort by: date, urgency, client name
- [ ] Status badges: Requested, In Progress, In Review, Approved, Completed
- [ ] Urgency indicators: color-coded
- [ ] Quick actions: open, archive, assign

**Priority**: P0  
**Complexity**: Low

---

### 6.4 Content Creation (AI Content Studio)

#### 6.4.1 Content Type Selection

**Description**: Select the type of content to create within a project.

**Content Types Supported (MVP)**:

| Type | Description | Typical Length | Compliance Level |
|------|-------------|----------------|------------------|
| Press Release | Formal announcement for media | 400-800 words | High |
| Blog Post | Thought leadership, educational | 600-1500 words | Medium |
| Social Media | LinkedIn, Twitter posts | 50-280 chars | Medium |
| Internal Memo | Company internal communications | 200-500 words | Low |
| FAQ | Q&A format for stakeholders | Variable | High |
| Executive Statement | Quotes from leadership | 100-300 words | High |

**Acceptance Criteria**:
- [ ] Content type selection shown when creating new content item
- [ ] Each type has icon, description, typical use case
- [ ] Selection loads appropriate AI prompts and templates
- [ ] Can create multiple content items of same or different types per project

**Priority**: P0  
**Complexity**: Low

---

#### 6.4.2 AI Content Generation

**Description**: Generate initial content draft using AI.

**Acceptance Criteria**:
- [ ] User configures generation settings:
  - Language (Japanese default, other languages available)
  - Tone (from client profile or manual selection)
  - Target audience
  - Key messages to include
  - Required elements (ISI, boilerplate, etc.)
- [ ] "Generate" initiates AI content creation
- [ ] Streaming response shows content appearing in real-time
- [ ] Generation completes in < 30 seconds
- [ ] Content appears in editor with compliance score
- [ ] "Regenerate" option for unsatisfactory results
- [ ] Generation history preserved for comparison

**Generation Settings**:

| Setting | Options |
|---------|---------|
| Primary language | Japanese, English |
| Tone | Professional, Patient-Friendly, Empathetic, Scientific, Conservative, Optimistic |
| Tone intensity | 1-5 scale |
| Target audience | HCP, Investors, Media, Patients, General Public |
| Required elements | ISI, Clinical data, Boilerplate, Regulatory disclaimers |
| Compliance level | Strict, Standard, Flexible |

**Priority**: P0  
**Complexity**: High

---

#### 6.4.3 Content Editor

**Description**: Rich text editor for reviewing and editing generated content.

**Acceptance Criteria**:
- [ ] Full-featured rich text editing (bold, italic, headings, lists, links)
- [ ] Single editor at a time (no simultaneous editing)
- [ ] Lock indicator when another user is editing
- [ ] Auto-save every 30 seconds
- [ ] Manual save button
- [ ] "Saving..." and "Saved" status indicators
- [ ] Undo/redo functionality
- [ ] Word count and character count display
- [ ] Full-screen mode for focused editing

**Priority**: P0  
**Complexity**: Medium

---

#### 6.4.4 Compliance Checking

**Description**: Real-time compliance analysis based on industry rules.

**Acceptance Criteria**:
- [ ] Compliance score (0-100) displayed prominently
- [ ] Score updates within 3 seconds of content change (debounced)
- [ ] Score color-coded: green (80-100), yellow (60-79), red (0-59)
- [ ] Sidebar shows compliance issues in two categories:
  - Warnings (should fix)
  - Suggestions (nice to have)
- [ ] Each issue shows:
  - Issue title
  - Location in document
  - Reason/explanation
  - Suggested fix (before/after text)
  - Score impact if fixed
- [ ] User can accept suggestion (auto-applies)
- [ ] User can dismiss suggestion (requires reason)
- [ ] Dismissed suggestions tracked in audit log

**Compliance Categories (Pharmaceutical)**:

| Category | Weight | Description |
|----------|--------|-------------|
| Regulatory Claims | 30% | Efficacy claims, clinical references |
| Safety Information | 25% | ISI, warnings, contraindications |
| Fair Balance | 20% | Equal presentation of benefits/risks |
| Substantiation | 15% | Data accuracy, citations |
| Formatting | 10% | Required disclaimers, prominence |

**Priority**: P0  
**Complexity**: High

---

#### 6.4.5 Tone Adjustment

**Description**: AI-powered tone modification while preserving compliance.

**Acceptance Criteria**:
- [ ] "Adjust Tone" opens modal/panel
- [ ] Select target tone from presets
- [ ] Intensity slider (1-5)
- [ ] Preview shows rewritten content
- [ ] Compliance impact shown (score change, new warnings)
- [ ] Apply or cancel adjustment
- [ ] Applied adjustments logged in version history
- [ ] Option to adjust selected text only

**Priority**: P0  
**Complexity**: Medium

---

#### 6.4.6 Version History

**Description**: Track and compare content versions.

**Acceptance Criteria**:
- [ ] Milestone versions saved on:
  - Manual save with note
  - Submit for review
  - Major edit completion
- [ ] Version list shows: number, timestamp, author, summary, compliance score
- [ ] Click version to view content (read-only)
- [ ] Compare any two versions side-by-side
- [ ] Diff highlighting: additions (green), deletions (red), changes (yellow)
- [ ] Restore previous version (creates new version)
- [ ] Version history cannot be deleted

**Priority**: P0  
**Complexity**: Medium

---

### 6.5 Client Collaboration

#### 6.5.1 Submit to Client

**Description**: Send content to client for review.

**Acceptance Criteria**:
- [ ] "Submit to Client" button in editor
- [ ] Warning if compliance score < 60 (can proceed with confirmation)
- [ ] Select client reviewers (from client users)
- [ ] Add submission note (optional)
- [ ] Confirm submission
- [ ] Content status changes to "In Review"
- [ ] Content becomes locked for PR staff during review
- [ ] Selected reviewers notified (app + email)
- [ ] Submission recorded in audit log

**Priority**: P0  
**Complexity**: Low

---

#### 6.5.2 Client Review Interface

**Description**: Interface for clients to review submitted content.

**Acceptance Criteria**:
- [ ] Mobile-optimized reading experience
- [ ] Content displayed with proper formatting
- [ ] Collapsible sections for long content
- [ ] Compliance score badge visible
- [ ] PR staff note visible
- [ ] Three response options:
  - Approve
  - Request Changes
  - Inline Comments
- [ ] Can combine options (e.g., add comments then approve)

**Priority**: P0  
**Complexity**: Medium

---

#### 6.5.3 Quick Response Templates

**Description**: Pre-built response options for faster feedback.

**Response Templates**:

| Template | Description |
|----------|-------------|
| Approved as-is | No changes needed |
| Approved with minor edits | Approve but apply client's suggestions |
| Adjust tone | Request tone modification (select target) |
| Needs more detail | Specific sections need expansion |
| Factual correction needed | Flag specific inaccuracies |
| Needs significant revision | Major changes required (requires explanation) |
| Schedule call | Request discussion before proceeding |

**Acceptance Criteria**:
- [ ] Templates shown when selecting "Request Changes"
- [ ] Can select multiple templates
- [ ] Each template expands relevant options/fields
- [ ] Free-text note always available
- [ ] Templates recorded in feedback log

**Priority**: P0 (MVP Value-Add)  
**Complexity**: Low

---

#### 6.5.4 Inline Comments

**Description**: Add comments on specific content sections.

**Acceptance Criteria**:
- [ ] Select text to add comment (long-press on mobile)
- [ ] Comment appears in margin/thread
- [ ] PR staff can reply to comments
- [ ] Comments show: author, timestamp, text
- [ ] Comments can be resolved
- [ ] Resolved comments can be shown/hidden
- [ ] Comment count displayed on content

**Priority**: P0  
**Complexity**: Medium

---

#### 6.5.5 Client Direct Editing (Suggestion Mode)

**Description**: Allow clients to make text changes as suggestions.

**Acceptance Criteria**:
- [ ] "Edit" button toggles suggestion mode
- [ ] Client edits tracked as suggestions (similar to Word track changes)
- [ ] Additions shown in green
- [ ] Deletions shown in strikethrough red
- [ ] Real-time compliance checking on client edits
- [ ] Warning if client edit breaks compliance
- [ ] PR staff reviews and accepts/rejects suggestions
- [ ] All suggestions logged in audit trail

**Priority**: P0  
**Complexity**: High

---

#### 6.5.6 Approval Workflow

**Description**: Formal approval process for content.

**Acceptance Criteria**:
- [ ] "Approve" button requires confirmation
- [ ] Approval recorded with timestamp and user
- [ ] Approved content status changes to "Approved"
- [ ] PR staff notified immediately
- [ ] Approved content can be exported
- [ ] Optional: approval notes
- [ ] 3-second undo option after approval

**Rejection Flow**:
- [ ] "Request Changes" requires feedback (template or free text)
- [ ] Content status changes to "Needs Revision"
- [ ] PR staff notified with feedback details
- [ ] PR staff can resubmit after revisions

**Priority**: P0  
**Complexity**: Medium

---

### 6.6 File Management

#### 6.6.1 File Upload & Organization

**Description**: Upload and organize files across the platform.

**File Categories**:

| Category | Subcategories |
|----------|---------------|
| Reference Materials | Previous Press Releases, Brand Guidelines, Tone Examples, Competitor Examples |
| Project Assets | Logos/Images, Data/Statistics, Supporting Documents, Legal/Compliance |
| Output Files | Approved Drafts, Final Deliverables, Translations |

**Acceptance Criteria**:
- [ ] Upload files via drag-and-drop or file picker
- [ ] Supported formats: PDF, DOCX, TXT, PNG, JPG, XLSX
- [ ] Max file size: 25MB per file
- [ ] Required metadata: category, description
- [ ] Optional metadata: tags, related project
- [ ] Files organized by client and project
- [ ] Search files by name, category, description
- [ ] Preview files in-app (where possible)
- [ ] Download files

**Priority**: P0  
**Complexity**: Medium

---

### 6.7 Export & Delivery

#### 6.7.1 Content Export

**Description**: Export approved content in multiple formats.

**Supported Formats**:

| Format | Use Case |
|--------|----------|
| PDF | Formal distribution, archival |
| Word (.docx) | Further editing, client preference |
| Plain Text | Wire services, simple copy |

**Acceptance Criteria**:
- [ ] Export available for approved content
- [ ] Format selection with preview
- [ ] PDF includes: content, compliance badge, approval date, version
- [ ] Word maintains formatting
- [ ] Plain text strips all formatting
- [ ] Download starts automatically
- [ ] Export logged in audit trail

**Priority**: P0  
**Complexity**: Medium

---

#### 6.7.2 Multi-Language Export

**Description**: Translate and export content in multiple languages.

**Acceptance Criteria**:
- [ ] "Translate" option after approval
- [ ] Select target language(s)
- [ ] AI translates with cultural adaptation
- [ ] Translated content shown for review
- [ ] Compliance re-checked for translated version
- [ ] Export translated versions in any supported format
- [ ] Original and translations linked in project

**Supported Languages (MVP)**:
- Japanese (primary)
- English
- (Additional languages post-MVP)

**Priority**: P0  
**Complexity**: High

---

### 6.8 Notifications & Alerts

#### 6.8.1 In-App Notifications

**Description**: Real-time notifications within the platform.

**Notification Types**:

| Type | Recipients | Trigger |
|------|------------|---------|
| Project assigned | PR Staff | Admin assigns project |
| Project requested | PR Admin | Client submits request |
| Draft ready for review | Client Users | Staff submits to client |
| Feedback received | PR Staff | Client provides feedback |
| Content approved | PR Staff | Client approves |
| Deadline approaching | Assigned users | 24h before target date |
| Urgent project | PR Admin | Crisis urgency selected |

**Acceptance Criteria**:
- [ ] Notification bell in header with unread count
- [ ] Notification panel shows recent notifications
- [ ] Click notification navigates to relevant page
- [ ] Mark as read/unread
- [ ] Mark all as read
- [ ] Notification settings allow per-type control

**Priority**: P0  
**Complexity**: Medium

---

#### 6.8.2 Email Notifications

**Description**: Email alerts for important events.

**Acceptance Criteria**:
- [ ] Emails sent via Resend
- [ ] Branded email templates
- [ ] Key events trigger immediate email:
  - Project assigned
  - Draft ready for review (client)
  - Feedback received
  - Content approved
  - Urgent project submitted
- [ ] Unsubscribe option per notification type
- [ ] Email includes direct link to relevant page

**Priority**: P0  
**Complexity**: Medium

---

### 6.9 Deadline Tracking

#### 6.9.1 Deadline Visualization

**Description**: Track and display project deadlines.

**Acceptance Criteria**:
- [ ] Target date visible on all project views
- [ ] Color-coded urgency indicators
- [ ] Days remaining countdown
- [ ] Overdue projects highlighted red
- [ ] Calendar view option for all deadlines
- [ ] Timeline view for project milestones

**Priority**: P0 (MVP Value-Add)  
**Complexity**: Low

---

#### 6.9.2 Deadline Alerts

**Description**: Automated alerts for approaching deadlines.

**Alert Rules**:

| Urgency | Alert Timing |
|---------|--------------|
| Standard | 48h, 24h before deadline |
| Priority | 48h, 24h, 12h before |
| Urgent | 24h, 12h, 6h before |
| Crisis | Hourly updates until complete |

**Acceptance Criteria**:
- [ ] Automatic alerts based on urgency
- [ ] In-app and email notifications
- [ ] Escalation to PR Admin if deadline missed
- [ ] Alert history in project activity log

**Priority**: P0 (MVP Value-Add)  
**Complexity**: Medium

---

### 6.10 Analytics Dashboard

#### 6.10.1 PR Firm Analytics

**Description**: Metrics dashboard for PR Admin.

**Metrics Displayed**:

| Metric | Description |
|--------|-------------|
| Active projects | Count by status, client, urgency |
| Average turnaround | Time from request to approval |
| Revision cycles | Average revisions per project |
| Compliance scores | Average across content |
| Staff workload | Projects per staff member |
| Client activity | Projects per client, approval times |

**Acceptance Criteria**:
- [ ] Dashboard with visual charts/graphs
- [ ] Filter by date range, client, content type
- [ ] Export reports as PDF or CSV
- [ ] Trend comparisons (vs previous period)

**Priority**: P1  
**Complexity**: Medium

---

## 7. Industry Module Framework

### 7.1 Configuration-Driven Architecture

Industry modules are configured via uploadable files, not hard-coded. This allows PR Admin to add new industries without code deployment.

### 7.2 Module File Structure

```
/industries/{industry-name}/
├── config.yaml              # Basic settings
├── compliance-rules.md      # Rules for AI compliance checking
├── terminology.md           # Industry-specific terms
├── templates/               # Content templates
│   ├── press-release.md
│   ├── blog-post.md
│   └── ...
└── prompts/                 # AI system prompts
    ├── generation.md
    ├── compliance.md
    └── translation.md
```

### 7.3 Configuration Schema

**config.yaml**:
```yaml
name: Pharmaceutical
display_name:
  en: Pharmaceutical
  ja: 製薬
icon: pill
compliance_level: strict
regions:
  - japan
regulations:
  - name: 薬機法
    description: Pharmaceutical Affairs Law
    reference_url: https://...
  - name: PMDA Guidelines
    description: Advertising guidelines
    reference_url: https://...
required_elements:
  - ISI (Important Safety Information)
  - Clinical data references
  - Company boilerplate
  - Regulatory disclaimers
audiences:
  - HCP (Healthcare Professionals)
  - Patients
  - Investors
  - Media
```

### 7.4 Pharmaceutical Module (MVP)

**Regulations Covered**:

| Regulation | Description |
|------------|-------------|
| 薬機法 (Pharmaceutical Affairs Law) | Articles 66-68 on advertising |
| PMDA Guidelines | Medical drug advertising guidelines |
| JPMA Codes | Voluntary industry codes |

**Compliance Rules**:

| Rule | Severity | Description |
|------|----------|-------------|
| Unsubstantiated efficacy claim | Warning | Requires clinical reference |
| Missing ISI | Warning | Safety info must be included |
| Superiority claim without data | Warning | Needs head-to-head trial data |
| Off-label promotion | Warning | Only approved indications |
| Vague superlatives | Suggestion | Avoid "best," "breakthrough" without context |
| Missing fair balance | Warning | Benefits and risks equally presented |

**Prohibited Language Patterns**:
- "最も効果的" (Most effective) - unless proven
- "完全に治る" (Completely cures) - absolute claims
- "副作用がない" (No side effects) - impossible claim
- "100%安全" (100% safe) - impossible claim

### 7.5 Adding New Industries (Future)

**Process**:
1. PR Admin navigates to Settings → Industries
2. Clicks "Add New Industry"
3. Uploads configuration files (yaml, markdown)
4. System validates file structure
5. Industry becomes available for client assignment
6. Can edit/update files at any time

**Validation Rules**:
- config.yaml must contain required fields
- compliance-rules.md must follow specified format
- All template files must be valid markdown

---

## 8. AI Capabilities

### 8.1 Content Generation

**Model**: Claude API (Anthropic)

**Capabilities**:
- Generate industry-compliant content from brief
- Maintain brand voice based on style profile
- Include required elements automatically
- Respect length and format guidelines
- Support multiple languages

**System Prompt Structure**:
```
You are ClearPress AI, a professional PR content creator specializing in {industry}.

## Context
- Client: {client_name}
- Industry: {industry}
- Content Type: {content_type}
- Target Audience: {audience}
- Tone: {tone}

## Client Style Profile
{extracted_style_characteristics}

## Industry Compliance
{industry_compliance_rules}

## Required Elements
{required_elements_list}

## Instructions
Generate a {content_type} that:
1. Addresses the key messages provided
2. Maintains compliance with industry regulations
3. Matches the client's established tone and style
4. Includes all required elements
5. Is appropriate for the target audience
```

### 8.2 Compliance Checking

**Process**:
1. Content submitted for analysis
2. AI evaluates against industry compliance rules
3. Identifies potential issues
4. Calculates compliance score
5. Generates specific suggestions with fixes

**Response Structure**:
```json
{
  "score": 85,
  "categories": {
    "regulatory_claims": { "score": 80, "issues": 2 },
    "safety_information": { "score": 90, "issues": 1 },
    "fair_balance": { "score": 85, "issues": 1 },
    "substantiation": { "score": 90, "issues": 0 },
    "formatting": { "score": 80, "issues": 1 }
  },
  "issues": [
    {
      "type": "warning",
      "category": "regulatory_claims",
      "title": "Unsubstantiated efficacy claim",
      "location": { "start": 245, "end": 312 },
      "reason": "Efficacy claim requires clinical trial reference",
      "before_text": "significantly improves patient outcomes",
      "after_text": "improved patient outcomes in the Phase 3 TRIAL-001 study (p<0.001)",
      "score_impact": 5
    }
  ]
}
```

### 8.3 Tone Adjustment

**Available Tones**:

| Tone | Description | Use Case |
|------|-------------|----------|
| Professional | Formal, business-like | B2B, investor communications |
| Patient-Friendly | Simple language, empathetic | Patient education |
| Empathetic | Acknowledges challenges, supportive | Disease awareness |
| Scientific | Technical, data-driven | HCP communications |
| Conservative | Cautious, careful claims | High-risk products |
| Optimistic | Positive framing | Launch announcements |

**Intensity Scale**:
- 1: Subtle adjustment (10% change)
- 2: Light adjustment (25% change)
- 3: Moderate adjustment (50% change)
- 4: Strong adjustment (75% change)
- 5: Complete rewrite (90%+ change)

### 8.4 Brief Expansion

**Input**: Client's short project description + uploaded documents

**Output**:
- Key messages to convey
- Target audience analysis
- Suggested content structure
- Compliance considerations
- Potential challenges
- Recommended timeline
- Suggested deliverables

### 8.5 Translation

**Approach**:
- Not literal translation
- Cultural adaptation for target market
- Maintains compliance in target language
- Preserves key messages and intent
- Adapts examples and references

**Quality Checks**:
- Back-translation verification
- Compliance re-check in target language
- Cultural appropriateness review

---

## 9. Design System

### 9.1 Design Principles

| Principle | Application |
|-----------|-------------|
| **Mobile-First (Client)** | Client portal designed for phone use first |
| **Desktop-Optimized (Admin)** | PR portal optimized for productivity |
| **Clarity Over Cleverness** | Simple, obvious UI patterns |
| **Progressive Disclosure** | Show what's needed, when needed |
| **Accessibility** | WCAG 2.1 AA compliance |

### 9.2 Responsive Strategy

**PR Portal (Admin/Staff)**:
- Primary: Desktop (1280px+)
- Secondary: Tablet (768px-1279px)
- Functional: Mobile (< 768px) - hamburger menu

**Client Portal**:
- Primary: Mobile (< 768px) - app-simulated with bottom nav
- Secondary: Desktop (768px+) - expanded layout, maximize screen real estate

### 9.3 Mobile Client Interface

```
┌─────────────────────────────────────────┐
│        [Client Logo]         [Avatar]   │  ← Minimal header (48px)
├─────────────────────────────────────────┤
│                                         │
│                                         │
│          Content Area                   │  ← Full screen real estate
│          (Scrollable)                   │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  🏠      📁       ➕       🔔      👤   │  ← Bottom nav (56px)
│ Home  Projects  Request  Alerts  Profile│
└─────────────────────────────────────────┘
```

**Mobile UX Features**:
- Pull-to-refresh on lists
- Swipe right to approve, left for changes
- Long-press to add inline comment
- Floating action button for primary actions
- Collapsible sections for long content
- Offline content caching for reading

### 9.4 Desktop Layout (Maximize Real Estate)

**PR Admin Dashboard**:
```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]     Dashboard  Clients  Projects  Analytics    [Profile] │
├────────────────────┬─────────────────────────────────────────────┤
│                    │                                             │
│   Quick Stats      │           Main Content Area                 │
│   (240px sidebar)  │           (Fluid width)                     │
│                    │                                             │
│   - Active: 12     │   ┌─────────────────────────────────────┐  │
│   - Pending: 5     │   │  Project Cards / Table View         │  │
│   - Urgent: 2      │   │                                     │  │
│                    │   │                                     │  │
│   Recent Activity  │   │                                     │  │
│   - Item 1         │   │                                     │  │
│   - Item 2         │   │                                     │  │
│                    │   └─────────────────────────────────────┘  │
│                    │                                             │
└────────────────────┴─────────────────────────────────────────────┘
```

**Content Editor (AI Studio)**:
```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Project     Draft: Press Release v2        [Actions] │
├──────────────────────────────────────────────────────────────────┤
│                                          │                       │
│                                          │   Compliance Sidebar  │
│          Editor Area                     │   (320px)             │
│          (Fluid width)                   │                       │
│                                          │   Score: 94/100 ✓     │
│                                          │                       │
│   ┌──────────────────────────────┐      │   ┌─────────────────┐ │
│   │                              │      │   │ Warnings (2)    │ │
│   │     Rich Text Editor         │      │   │ ├─ Issue 1      │ │
│   │                              │      │   │ └─ Issue 2      │ │
│   │                              │      │   │                 │ │
│   │                              │      │   │ Suggestions (3) │ │
│   │                              │      │   │ ├─ Tip 1        │ │
│   │                              │      │   │ ├─ Tip 2        │ │
│   │                              │      │   │ └─ Tip 3        │ │
│   │                              │      │   └─────────────────┘ │
│   └──────────────────────────────┘      │                       │
│                                          │   [Adjust Tone]       │
├──────────────────────────────────────────┴───────────────────────┤
│  Word count: 456  |  Auto-saved 10:23 AM  |  Version: Draft v2   │
└──────────────────────────────────────────────────────────────────┘
```

### 9.5 Color System

**Light Mode**:

| Element | Color | Usage |
|---------|-------|-------|
| Primary | #2563EB (Blue) | Actions, links, focus |
| Success | #16A34A (Green) | Approved, high compliance |
| Warning | #EAB308 (Yellow) | Pending, medium compliance |
| Error | #DC2626 (Red) | Rejected, urgent, low compliance |
| Neutral | #6B7280 (Gray) | Text, borders |
| Background | #FFFFFF | Primary background |
| Surface | #F9FAFB | Cards, elevated surfaces |

**Dark Mode**:

| Element | Color | Usage |
|---------|-------|-------|
| Primary | #3B82F6 (Blue) | Actions, links, focus |
| Success | #22C55E (Green) | Approved, high compliance |
| Warning | #FACC15 (Yellow) | Pending, medium compliance |
| Error | #EF4444 (Red) | Rejected, urgent, low compliance |
| Neutral | #9CA3AF (Gray) | Text, borders |
| Background | #111827 | Primary background |
| Surface | #1F2937 | Cards, elevated surfaces |

### 9.6 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter/Noto Sans JP | 30px | Bold |
| H2 | Inter/Noto Sans JP | 24px | Semibold |
| H3 | Inter/Noto Sans JP | 20px | Semibold |
| Body | Inter/Noto Sans JP | 16px | Regular |
| Small | Inter/Noto Sans JP | 14px | Regular |
| Caption | Inter/Noto Sans JP | 12px | Regular |

### 9.7 Component Library

Using **shadcn/ui** with Tailwind CSS for consistent components:

- Buttons (Primary, Secondary, Ghost, Destructive)
- Forms (Input, Textarea, Select, Checkbox, Radio)
- Cards
- Modals/Dialogs
- Tooltips
- Dropdowns
- Tabs
- Tables
- Badges
- Alerts
- Toast notifications

### 9.8 Accessibility

**Requirements**:
- Color contrast: 4.5:1 minimum
- Focus indicators visible
- Keyboard navigation support
- Screen reader compatible
- Japanese language properly declared
- Touch targets: 44x44px minimum on mobile

---

## 10. Security & Compliance

### 10.1 Authentication Security

| Measure | Implementation |
|---------|----------------|
| Password requirements | 8+ chars, 1 uppercase, 1 number |
| Password hashing | bcrypt (Supabase default) |
| Session management | JWT with 7-day expiry |
| Session refresh | On activity |
| Force logout | On password change |
| Rate limiting | 5 failed attempts = 15 min lockout |

### 10.2 Authorization

**Row Level Security (RLS)**:
- PR staff see only assigned projects
- Clients see only invited projects
- All queries filtered by organization
- Audit trail immutable

### 10.3 Data Protection

| Layer | Method |
|-------|--------|
| In Transit | TLS 1.3 |
| At Rest | AES-256 (Supabase managed) |
| Backups | Encrypted, daily |
| API Keys | Environment variables, never exposed |

### 10.4 APPI Compliance (Japan Privacy Law)

| Requirement | Implementation |
|-------------|----------------|
| Purpose specification | Clear privacy policy |
| Consent | Opt-in for data collection |
| Data minimization | Collect only necessary data |
| Access rights | User can export data |
| Deletion rights | User can request deletion |
| Security measures | Encryption + access controls |

### 10.5 Audit Trail

**Logged Events**:
- User authentication (login, logout, failed attempts)
- Content creation and edits
- Content submissions
- Client feedback
- Approvals and rejections
- File uploads and downloads
- Setting changes
- User management actions

**Audit Log Fields**:
- Timestamp
- User ID
- Action type
- Resource type and ID
- Before/after values (where applicable)
- IP address
- User agent

### 10.6 Data Residency

- **Region**: Supabase Asia (Tokyo/Singapore)
- **Backups**: Same region
- **AI Processing**: Claude API (US-based, but no data retention)

---

## 11. Success Metrics & KPIs

### 11.1 Product Metrics

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| Content creation time | Brief to first draft | < 30 min | Event tracking |
| Revision cycles | Submissions per approval | < 2 average | Database query |
| Client response time | Submit to client action | < 24 hours | Timestamp diff |
| Compliance accuracy | AI score vs human review | > 90% correlation | Sampling |
| User adoption | Weekly active users | > 80% of accounts | Login analytics |

### 11.2 Technical Metrics

| Metric | Definition | Target | Tool |
|--------|------------|--------|------|
| Page load time | Time to interactive | < 3s | Lighthouse |
| API latency | 95th percentile | < 500ms | Supabase metrics |
| AI generation time | Brief to draft | < 30s | Custom logging |
| Error rate | Failed requests | < 1% | Error tracking |
| Uptime | System availability | > 99.5% | Status monitoring |

### 11.3 Business Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Projects completed | 50+ | First 6 months |
| Client satisfaction | > 4.5/5 | Quarterly survey |
| Time saved per project | > 4 hours | User survey |
| Staff efficiency | 3x more projects | 6 months |

---

## 12. MVP Roadmap

### 12.1 Phase Overview

```
Week  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16
      ├─────────────┼─────────────┼─────────────┼───────────┤
      │  Phase 1    │   Phase 2   │   Phase 3   │  Phase 4  │
      │ Foundation  │  AI Core    │ Collaboration│  Polish   │
```

### 12.2 Phase 1: Foundation (Weeks 1-4)

**Goals**: Core infrastructure and basic functionality

**Deliverables**:
- [ ] Project setup (React, Supabase, Tailwind)
- [ ] Authentication system
- [ ] User management (PR Admin, Staff, Client)
- [ ] Client management CRUD
- [ ] Basic project management
- [ ] File upload infrastructure
- [ ] Basic UI components

### 12.3 Phase 2: AI Core (Weeks 5-8)

**Goals**: AI-powered content creation

**Deliverables**:
- [ ] Claude API integration
- [ ] Content generation for all 6 types
- [ ] Compliance checking (Pharmaceutical)
- [ ] Tone adjustment
- [ ] AI Brief Expander
- [ ] Content editor with rich text
- [ ] Version history

### 12.4 Phase 3: Collaboration (Weeks 9-12)

**Goals**: Client portal and review workflow

**Deliverables**:
- [ ] Client portal (mobile-first)
- [ ] Project request flow
- [ ] Submit to client workflow
- [ ] Client review interface
- [ ] Quick response templates
- [ ] Inline comments
- [ ] Client suggestion mode
- [ ] Approval workflow
- [ ] Notifications (in-app + email)

### 12.5 Phase 4: Polish & Launch (Weeks 13-16)

**Goals**: Production readiness

**Deliverables**:
- [ ] Deadline tracking with alerts
- [ ] Export functionality (PDF, Word, Plain Text)
- [ ] Multi-language export
- [ ] Analytics dashboard (basic)
- [ ] Light/dark mode
- [ ] Performance optimization
- [ ] Security audit
- [ ] Bug fixing
- [ ] Documentation
- [ ] Soft launch

---

## 13. Future Considerations

### 13.1 Post-MVP Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Client Admin role | High | Allow clients to manage their own users |
| Sequential approval workflows | High | Legal → Executive → Final approval |
| Additional industries | High | Automotive, IT, Legal, Travel |
| Competitive reference library | Medium | Curated competitor content database |
| Client satisfaction pulse | Medium | Post-project ratings |
| Smart history suggestions | Medium | AI learns from past projects |
| Media distribution integration | Low | Wire service connections |
| Social media scheduling | Low | Direct posting to platforms |
| Advanced analytics | Low | Deeper insights and predictions |
| White-label platform | Low | Full customization for PR firms |

### 13.2 Scalability Considerations

- Multi-region deployment for global clients
- CDN for static assets and document delivery
- Database read replicas for analytics
- Queue system for AI processing
- Rate limiting and usage quotas

### 13.3 Integration Opportunities

- CRM systems (Salesforce, HubSpot)
- Project management (Asana, Monday)
- Communication (Slack, Teams)
- Cloud storage (Google Drive, Dropbox)
- Wire services (PR Newswire, Business Wire)

---

## 14. Appendices

### 14.1 Glossary

| Term | Definition |
|------|------------|
| ISI | Important Safety Information - required in pharmaceutical communications |
| HCP | Healthcare Professional (doctors, nurses, pharmacists) |
| PMDA | Pharmaceuticals and Medical Devices Agency (Japan) |
| 薬機法 | Pharmaceutical and Medical Devices Act (Japan) |
| Brief | Initial project description from client |
| Deliverable | Individual content piece within a project |
| Compliance Score | 0-100 rating of regulatory adherence |

### 14.2 Content Type Templates

**Press Release Structure**:
1. Headline
2. Subheadline (optional)
3. Dateline
4. Lead paragraph (who, what, when, where, why)
5. Body paragraphs
6. Quote(s)
7. Boilerplate
8. Contact information
9. ISI (if pharmaceutical)

**Blog Post Structure**:
1. Title
2. Introduction
3. Key points (with subheadings)
4. Conclusion
5. Call to action
6. Disclosures (if applicable)

### 14.3 Urgency Level Definitions

| Level | Response Time | Use Case |
|-------|---------------|----------|
| Standard | 5-7 business days | Routine announcements |
| Priority | 2-3 business days | Important but planned |
| Urgent | 24-48 hours | Time-sensitive news |
| Crisis | Same day | Emergency communications |

### 14.4 Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 30, 2025 | Product Team | Initial PRD |

---

*End of Document*

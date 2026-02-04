# ClearPress AI - Design System Guide

**Version**: 1.1
**Last Updated**: January 31, 2025
**Framework**: React + Tailwind CSS + shadcn/ui

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design Tokens](#2-design-tokens)
3. [Typography](#3-typography)
4. [Layout System](#4-layout-system)
5. [Component Library](#5-component-library)
6. [PR Portal Design](#6-pr-portal-design)
7. [Client Portal Design](#7-client-portal-design)
8. [Status & Urgency System](#8-status--urgency-system)
9. [Japanese UX Considerations](#9-japanese-ux-considerations)
10. [Responsive Patterns](#10-responsive-patterns)
11. [Motion & Interactions](#11-motion--interactions)
12. [Accessibility](#12-accessibility)

---

## 1. Design Philosophy

### 1.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **Modern Minimalist** | Clean whites, subtle shadows, generous whitespace |
| **Professional Trust** | Conveys reliability for B2B pharmaceutical industry |
| **Clarity First** | Information hierarchy guides the eye naturally |
| **Japanese Sensibility** | Respects Japanese business aesthetics and readability |
| **Functional Beauty** | Every element serves a purpose |

### 1.2 Aesthetic Direction

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Clean          Card-based        Subtle           Warm    │
│   Whites         Layout            Shadows          Accents │
│                                                             │
│   ○ Minimal visual noise                                    │
│   ○ Generous padding and margins                            │
│   ○ Soft border-radius on cards                             │
│   ○ Muted colors with purposeful accents                    │
│   ○ Consistent 8px grid system                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Inspiration Sources

Based on modern SaaS dashboard patterns:
- Left sidebar navigation with icon + text
- Card-based content organization
- Right panel for details/metadata
- Color-coded status and category badges
- Clean data tables with avatar integration

---

## 2. Design Tokens

### 2.1 Color Palette

```css
:root {
  /* ===== Base Colors ===== */
  --background: 0 0% 100%;           /* #FFFFFF - Main background */
  --background-subtle: 210 20% 98%;  /* #F8FAFC - Card backgrounds */
  --foreground: 222 47% 11%;         /* #0F172A - Primary text */
  
  /* ===== Neutral Scale ===== */
  --gray-50: 210 20% 98%;            /* #F8FAFC */
  --gray-100: 220 14% 96%;           /* #F1F5F9 */
  --gray-200: 220 13% 91%;           /* #E2E8F0 */
  --gray-300: 216 12% 84%;           /* #CBD5E1 */
  --gray-400: 218 11% 65%;           /* #94A3B8 */
  --gray-500: 220 9% 46%;            /* #64748B */
  --gray-600: 215 14% 34%;           /* #475569 */
  --gray-700: 217 19% 27%;           /* #334155 */
  --gray-800: 215 28% 17%;           /* #1E293B */
  --gray-900: 222 47% 11%;           /* #0F172A */
  
  /* ===== Primary (Brand) ===== */
  --primary: 221 83% 53%;            /* #3B82F6 - Blue */
  --primary-hover: 221 83% 46%;      /* #2563EB */
  --primary-light: 214 95% 93%;      /* #DBEAFE */
  --primary-foreground: 0 0% 100%;   /* White text on primary */
  
  /* ===== Semantic Colors ===== */
  /* Success */
  --success: 142 76% 36%;            /* #16A34A - Green */
  --success-light: 142 77% 93%;      /* #DCFCE7 */
  
  /* Warning */
  --warning: 38 92% 50%;             /* #F59E0B - Amber */
  --warning-light: 48 96% 89%;       /* #FEF3C7 */
  
  /* Error */
  --error: 0 84% 60%;                /* #EF4444 - Red */
  --error-light: 0 86% 94%;          /* #FEE2E2 */
  
  /* Info */
  --info: 199 89% 48%;               /* #0EA5E9 - Sky */
  --info-light: 201 94% 94%;         /* #E0F2FE */
  
  /* ===== Urgency Colors ===== */
  --urgency-standard: 220 9% 46%;    /* Gray */
  --urgency-priority: 38 92% 50%;    /* Amber */
  --urgency-urgent: 25 95% 53%;      /* Orange */
  --urgency-crisis: 0 84% 60%;       /* Red */
  
  /* ===== Status Colors ===== */
  --status-draft: 220 13% 91%;       /* Light gray */
  --status-in-progress: 214 95% 93%; /* Light blue */
  --status-in-review: 48 96% 89%;    /* Light amber */
  --status-approved: 142 77% 93%;    /* Light green */
  --status-completed: 142 76% 36%;   /* Green */
  
  /* ===== UI Elements ===== */
  --border: 220 13% 91%;             /* #E2E8F0 */
  --border-hover: 216 12% 84%;       /* #CBD5E1 */
  --ring: 221 83% 53%;               /* Focus ring - primary */
  --input: 220 13% 91%;              /* Input borders */
  
  /* ===== Shadows ===== */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

### 2.2 Dark Mode (Optional - Phase 2)

```css
.dark {
  --background: 222 47% 11%;
  --background-subtle: 217 19% 17%;
  --foreground: 210 20% 98%;
  --border: 217 19% 27%;
  /* ... additional dark mode tokens */
}
```

### 2.3 Spacing Scale

Based on 4px base unit, prefer 8px increments:

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### 2.4 Border Radius

```css
:root {
  --radius-sm: 0.25rem;   /* 4px - Small elements */
  --radius: 0.5rem;       /* 8px - Default (buttons, inputs) */
  --radius-md: 0.625rem;  /* 10px - Cards */
  --radius-lg: 0.75rem;   /* 12px - Large cards, modals */
  --radius-xl: 1rem;      /* 16px - Feature cards */
  --radius-full: 9999px;  /* Pills, avatars */
}
```

---

## 3. Typography

### 3.1 Font Stack

```css
:root {
  /* Japanese-optimized font stack */
  --font-sans: 
    "Inter",                    /* Primary Latin */
    "Hiragino Sans",            /* macOS Japanese */
    "Hiragino Kaku Gothic ProN",
    "Noto Sans JP",             /* Cross-platform Japanese */
    "Meiryo",                   /* Windows Japanese */
    sans-serif;
  
  --font-mono: 
    "JetBrains Mono",
    "Fira Code",
    monospace;
}
```

### 3.2 Type Scale

```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;      /* 12px - Captions, labels */
  --text-sm: 0.875rem;     /* 14px - Secondary text, table cells */
  --text-base: 1rem;       /* 16px - Body text */
  --text-lg: 1.125rem;     /* 18px - Emphasized body */
  --text-xl: 1.25rem;      /* 20px - Section headers */
  --text-2xl: 1.5rem;      /* 24px - Page titles */
  --text-3xl: 1.875rem;    /* 30px - Hero text */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;    /* Default for body */
  --leading-relaxed: 1.625; /* For Japanese text blocks */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### 3.3 Typography Classes

```css
/* Headings */
.text-page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--gray-900);
}

.text-section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--gray-900);
}

.text-card-title {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  line-height: var(--leading-snug);
  color: var(--gray-900);
}

/* Body */
.text-body {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed); /* Better for Japanese */
  color: var(--gray-700);
}

.text-body-sm {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--gray-600);
}

/* Labels & Captions */
.text-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-700);
}

.text-caption {
  font-size: var(--text-xs);
  font-weight: var(--font-normal);
  color: var(--gray-500);
}
```

---

## 4. Layout System

### 4.1 Page Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ PR Portal Layout (Desktop)                                          │
├──────────┬──────────────────────────────────────┬───────────────────┤
│          │                                      │                   │
│  Sidebar │         Main Content Area            │   Detail Panel    │
│   240px  │         (flex-1)                     │   320px           │
│          │                                      │   (optional)      │
│  - Logo  │  ┌─────────────────────────────┐    │                   │
│  - Nav   │  │ Page Header                 │    │  - Metadata       │
│  - User  │  │ Title + Actions             │    │  - Quick info     │
│          │  └─────────────────────────────┘    │  - Related items  │
│          │  ┌─────────────────────────────┐    │                   │
│          │  │ Content Cards / Tables      │    │                   │
│          │  │                             │    │                   │
│          │  │                             │    │                   │
│          │  └─────────────────────────────┘    │                   │
│          │                                      │                   │
└──────────┴──────────────────────────────────────┴───────────────────┘
```

### 4.2 Grid System

```typescript
// Tailwind config extensions
module.exports = {
  theme: {
    extend: {
      maxWidth: {
        'content': '1280px',    // Max content width
        'readable': '65ch',      // For text blocks
      },
      width: {
        'sidebar': '240px',
        'sidebar-collapsed': '64px',
        'detail-panel': '320px',
      },
    },
  },
};
```

### 4.3 Container Patterns

```tsx
// Main layout wrapper
<div className="flex min-h-screen bg-gray-50">
  <Sidebar className="w-sidebar border-r bg-white" />
  <main className="flex-1 overflow-auto">
    <div className="max-w-content mx-auto p-6">
      {children}
    </div>
  </main>
  {showDetailPanel && (
    <DetailPanel className="w-detail-panel border-l bg-white" />
  )}
</div>

// Card grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {cards}
</div>

// Dashboard layout
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-8">{mainContent}</div>
  <div className="col-span-4">{sideContent}</div>
</div>
```

---

## 5. Component Library

### 5.1 Buttons

```tsx
// Primary Button
<Button variant="default">
  保存
</Button>
// bg-primary text-white hover:bg-primary-hover

// Secondary Button
<Button variant="outline">
  キャンセル
</Button>
// border border-gray-300 bg-white hover:bg-gray-50

// Ghost Button
<Button variant="ghost">
  詳細を見る
</Button>
// hover:bg-gray-100

// Destructive Button
<Button variant="destructive">
  削除
</Button>
// bg-error text-white hover:bg-error/90

// Button Sizes
<Button size="sm">Small</Button>   // h-8 px-3 text-sm
<Button size="default">Default</Button> // h-10 px-4
<Button size="lg">Large</Button>   // h-12 px-6 text-lg
```

### 5.2 Cards

```tsx
// Standard Card
<Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
  <CardHeader className="p-4 border-b border-gray-100">
    <CardTitle className="text-base font-medium">
      プロジェクト名
    </CardTitle>
  </CardHeader>
  <CardContent className="p-4">
    {content}
  </CardContent>
  <CardFooter className="p-4 pt-0 flex justify-end gap-2">
    {actions}
  </CardFooter>
</Card>

// Clickable Card
<Card className="cursor-pointer hover:border-primary/50 transition-colors">
  ...
</Card>
```

### 5.3 Badges & Tags

```tsx
// Status Badge
<Badge variant="status" status="in_progress">
  進行中
</Badge>

// Urgency Badge
<Badge variant="urgency" urgency="urgent">
  緊急
</Badge>

// Category Tag (with color dot)
<Badge variant="category" color="blue">
  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
  Design
</Badge>
```

**Badge Variants:**

| Status | Background | Text |
|--------|------------|------|
| draft | `bg-gray-100` | `text-gray-600` |
| in_progress | `bg-blue-100` | `text-blue-700` |
| in_review | `bg-amber-100` | `text-amber-700` |
| approved | `bg-green-100` | `text-green-700` |
| completed | `bg-green-500` | `text-white` |

| Urgency | Background | Text | Border |
|---------|------------|------|--------|
| standard | `bg-gray-100` | `text-gray-600` | - |
| priority | `bg-amber-100` | `text-amber-700` | - |
| urgent | `bg-orange-100` | `text-orange-700` | - |
| crisis | `bg-red-100` | `text-red-700` | `border-red-300` (pulsing) |

### 5.4 Form Elements

```tsx
// Text Input
<div className="space-y-2">
  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
    プロジェクト名
  </Label>
  <Input
    id="name"
    className="h-10 border-gray-300 focus:border-primary focus:ring-primary"
    placeholder="プロジェクト名を入力"
  />
</div>

// Select
<Select>
  <SelectTrigger className="h-10 border-gray-300">
    <SelectValue placeholder="クライアントを選択" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="client1">クライアント A</SelectItem>
  </SelectContent>
</Select>

// Textarea
<Textarea
  className="min-h-[120px] border-gray-300 resize-none"
  placeholder="プロジェクトの概要を入力..."
/>
```

### 5.5 Tables

```tsx
<Table>
  <TableHeader>
    <TableRow className="bg-gray-50 hover:bg-gray-50">
      <TableHead className="text-xs font-medium text-gray-500 uppercase">
        プロジェクト
      </TableHead>
      <TableHead>クライアント</TableHead>
      <TableHead>ステータス</TableHead>
      <TableHead className="text-right">アクション</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8" />
          <span>プロジェクト名</span>
        </div>
      </TableCell>
      <TableCell>Pharma Corp</TableCell>
      <TableCell>
        <Badge status="in_progress">進行中</Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm">詳細</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### 5.6 Avatars

```tsx
// Single Avatar
<Avatar className="h-10 w-10">
  <AvatarImage src={user.avatar} alt={user.name} />
  <AvatarFallback className="bg-primary/10 text-primary">
    {user.name.slice(0, 2)}
  </AvatarFallback>
</Avatar>

// Avatar Group
<div className="flex -space-x-2">
  {users.slice(0, 4).map(user => (
    <Avatar key={user.id} className="h-8 w-8 border-2 border-white" />
  ))}
  {users.length > 4 && (
    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 border-2 border-white">
      +{users.length - 4}
    </div>
  )}
</div>
```

---

## 6. PR Portal Design

### 6.1 Sidebar Navigation

```tsx
<aside className="w-60 h-screen bg-white border-r border-gray-200 flex flex-col">
  {/* Logo */}
  <div className="h-16 px-4 flex items-center border-b border-gray-100">
    <Logo className="h-8" />
  </div>
  
  {/* Organization Switcher */}
  <div className="p-3 border-b border-gray-100">
    <Button variant="ghost" className="w-full justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8" />
        <span className="text-sm font-medium">Tokyo PR Agency</span>
      </div>
      <ChevronDown className="h-4 w-4 text-gray-400" />
    </Button>
  </div>
  
  {/* Main Navigation */}
  <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
    <NavSection title="メインメニュー">
      <NavItem icon={LayoutDashboard} href="/dashboard" active>
        ダッシュボード
      </NavItem>
      <NavItem icon={FolderKanban} href="/projects">
        プロジェクト
      </NavItem>
      <NavItem icon={Building2} href="/clients">
        クライアント
      </NavItem>
      <NavItem icon={Users} href="/team">
        チーム
      </NavItem>
    </NavSection>
    
    <NavSection title="クライアント" collapsible>
      {clients.map(client => (
        <NavItem key={client.id} icon={Building} href={`/clients/${client.id}`}>
          {client.name}
        </NavItem>
      ))}
    </NavSection>
  </nav>
  
  {/* User Menu */}
  <div className="p-3 border-t border-gray-100">
    <UserMenu />
  </div>
</aside>
```

**NavItem Styles:**

```tsx
// Default state
"flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"

// Active state
"flex items-center gap-3 px-3 py-2 rounded-md text-sm bg-primary/10 text-primary font-medium"
```

### 6.2 Page Header

```tsx
<header className="flex items-center justify-between pb-6 border-b border-gray-200">
  <div>
    <h1 className="text-2xl font-semibold text-gray-900">
      プロジェクト
    </h1>
    <p className="mt-1 text-sm text-gray-500">
      すべてのプロジェクトを管理
    </p>
  </div>
  <div className="flex items-center gap-3">
    <Button variant="outline">
      <Filter className="h-4 w-4 mr-2" />
      フィルター
    </Button>
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      新規プロジェクト
    </Button>
  </div>
</header>
```

### 6.3 Dashboard Cards

```tsx
// Stats Card
<Card className="p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">進行中プロジェクト</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">12</p>
      <p className="mt-1 text-sm text-green-600">
        <TrendingUp className="inline h-4 w-4 mr-1" />
        +2 今週
      </p>
    </div>
    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
      <FolderKanban className="h-6 w-6 text-blue-600" />
    </div>
  </div>
</Card>

// Activity Card
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="text-base">最近のアクティビティ</CardTitle>
    <Button variant="ghost" size="sm">すべて見る</Button>
  </CardHeader>
  <CardContent className="space-y-4">
    {activities.map(activity => (
      <div key={activity.id} className="flex items-start gap-3">
        <Avatar className="h-8 w-8" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">{activity.description}</p>
          <p className="text-xs text-gray-500">{activity.time}</p>
        </div>
      </div>
    ))}
  </CardContent>
</Card>
```

### 6.5 Dashboard Welcome Header Pattern

Time-based personalized greeting with user context. Use this pattern for dashboard pages.

```tsx
// Time-based greeting configuration
function getGreetingConfig(hour: number) {
  if (hour >= 5 && hour < 12) {
    return {
      jaGreeting: 'おはようございます',
      enGreeting: 'Good morning',
      icon: Sun,
      iconColor: 'text-amber-500',
      bgGradient: 'from-amber-50 to-orange-50',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      jaGreeting: 'こんにちは',
      enGreeting: 'Good afternoon',
      icon: Sparkles,
      iconColor: 'text-blue-500',
      bgGradient: 'from-blue-50 to-sky-50',
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      jaGreeting: 'お疲れ様です',
      enGreeting: 'Good evening',
      icon: Sunset,
      iconColor: 'text-orange-500',
      bgGradient: 'from-orange-50 to-rose-50',
    };
  } else {
    return {
      jaGreeting: 'お疲れ様です',
      enGreeting: 'Good evening',
      icon: Moon,
      iconColor: 'text-indigo-400',
      bgGradient: 'from-indigo-50 to-purple-50',
    };
  }
}

// Welcome Header Component
<div className={cn(
  'relative overflow-hidden rounded-xl p-6 lg:p-8',
  'bg-gradient-to-br',
  greeting.bgGradient // Dynamic based on time
)}>
  {/* Decorative dot pattern (subtle) */}
  <div className="absolute inset-0 opacity-[0.03]">
    <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>

  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-4">
      <Avatar className="h-14 w-14 border-2 border-white/80 shadow-sm">
        <AvatarFallback className="bg-white text-gray-700 text-lg font-semibold">
          {userInitials}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="flex items-center gap-2 text-gray-500 mb-1">
          <GreetingIcon className={cn('h-4 w-4', greeting.iconColor)} />
          <span className="text-sm font-medium">{greeting.jaGreeting}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {profile?.name}
          <span className="text-gray-400 font-normal ml-1">さん</span>
        </h1>
        <p className="text-sm text-gray-600 mt-0.5">{organization?.name}</p>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <Badge variant="secondary" className="bg-white/80 text-gray-700">
        {role}
      </Badge>
      <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
        <Clock className="h-3.5 w-3.5" />
        <span>{formattedDate}</span>
      </div>
    </div>
  </div>
</div>
```

### 6.6 Enhanced Stat Cards Pattern

Stat cards with colored icon backgrounds and hover effects.

```tsx
// Stat Card Color Configuration
const STAT_CARD_COLORS = {
  blue: { iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  amber: { iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  emerald: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  violet: { iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  rose: { iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
};

// Enhanced Stat Card
<Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200">
  <CardContent className="p-5">
    <div className="flex items-start justify-between">
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900 tracking-tight">
            {value}
          </span>
          {suffix && (
            <span className="text-lg text-gray-400">{suffix}</span>
          )}
        </div>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <div className={cn(
        'flex h-11 w-11 items-center justify-center rounded-lg',
        'transition-transform duration-200 group-hover:scale-105',
        iconBg
      )}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
    </div>
  </CardContent>
</Card>
```

### 6.7 Activity Section with Empty State

Helpful hints pattern for empty activity lists.

```tsx
// Empty Activity Item (hint style)
<div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50/70 border border-dashed border-gray-200">
  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
    <Icon className="h-4 w-4 text-gray-400" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm text-gray-600">{hintText}</p>
  </div>
  <CircleDot className="h-4 w-4 text-gray-300" />
</div>

// Activity Section Footer
<div className="mt-6 pt-4 border-t border-gray-100">
  <p className="text-center text-sm text-gray-500">
    アクティビティがここに表示されます
  </p>
</div>
```

### 6.8 Dashboard Grid Layout Pattern

Recommended grid layout for dashboards with activity and info panels.

```tsx
// Dashboard Main Grid (3-column on desktop)
<div className="grid gap-6 lg:grid-cols-3">
  {/* Activity Card - spans 2 columns */}
  <Card className="lg:col-span-2">
    {/* Activity content */}
  </Card>

  {/* Info Panel - 1 column */}
  <div className="space-y-6">
    <Card>{/* Organization info */}</Card>
    <Card>{/* Profile summary */}</Card>
  </div>
</div>

// Stats Grid (4 columns on large screens)
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {/* Stat cards */}
</div>
```

### 6.9 Card with Header Separator Pattern

Use Separator component between card header and content for clean visual hierarchy.

```tsx
<Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
      <Building2 className="h-4 w-4 text-gray-400" />
      {title}
    </CardTitle>
  </CardHeader>
  <Separator />
  <CardContent className="pt-5">
    {/* Content */}
  </CardContent>
</Card>
```

### 6.10 Info Display with Labels

Pattern for displaying labeled information in cards.

```tsx
// Grid layout for label-value pairs
<div className="grid grid-cols-2 gap-4 pt-1">
  <div>
    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
      {label}
    </p>
    <Badge variant="outline" className="font-medium">
      {value}
    </Badge>
  </div>
</div>

// Status indicator with icon
<div className="flex items-center gap-2 pt-2">
  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  </div>
  <span className="text-sm text-gray-600">アカウント有効</span>
</div>
```

### 6.4 Detail Panel (Right Side)

```tsx
<aside className="w-80 h-screen bg-white border-l border-gray-200 overflow-y-auto">
  {/* Tabs */}
  <div className="sticky top-0 bg-white border-b border-gray-200">
    <Tabs defaultValue="info">
      <TabsList className="w-full justify-start px-4 h-12 bg-transparent">
        <TabsTrigger value="info">情報</TabsTrigger>
        <TabsTrigger value="files">ファイル</TabsTrigger>
        <TabsTrigger value="activity">履歴</TabsTrigger>
      </TabsList>
    </Tabs>
  </div>
  
  {/* Content */}
  <div className="p-4 space-y-6">
    {/* Main Info */}
    <section>
      <h3 className="text-sm font-medium text-gray-900 mb-3">基本情報</h3>
      <dl className="space-y-3">
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">作成者</dt>
          <dd className="text-sm text-gray-900 flex items-center gap-2">
            <Avatar className="h-5 w-5" />
            佐藤 優希
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">作成日</dt>
          <dd className="text-sm text-gray-900">2025年1月28日</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">ステータス</dt>
          <dd><Badge status="in_progress">進行中</Badge></dd>
        </div>
      </dl>
    </section>
    
    {/* Members */}
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">メンバー</h3>
        <Button variant="ghost" size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {members.map(member => (
          <div key={member.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8" />
              <div>
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-500">{member.role}</p>
              </div>
            </div>
            <Badge variant="category">{member.department}</Badge>
          </div>
        ))}
      </div>
    </section>
  </div>
</aside>
```

---

## 7. Client Portal Design

The Client Portal is **mobile-first but fully responsive**. Pharmaceutical executives often review and approve content on mobile devices, but may also use desktop when in the office.

### 7.1 Responsive Strategy

| Breakpoint | Layout | Navigation |
|------------|--------|------------|
| Mobile (<768px) | Single column, bottom nav | Bottom tab bar |
| Tablet (768-1024px) | Wider cards, bottom nav | Bottom tab bar |
| Desktop (>1024px) | Sidebar + main content | Left sidebar |

```tsx
// Client Portal Layout - Responsive
<div className="min-h-screen bg-gray-50">
  {/* Desktop: Sidebar | Mobile: Hidden */}
  <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-gray-200 bg-white">
    <ClientSidebar />
  </aside>
  
  {/* Main Content */}
  <div className="lg:pl-64">
    {/* Mobile Header */}
    <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
      <MobileHeader />
    </header>
    
    <main className="pb-20 lg:pb-0">
      {children}
    </main>
    
    {/* Mobile Bottom Nav */}
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200">
      <BottomNavigation />
    </nav>
  </div>
</div>
```

### 7.2 Mobile App Shell

Professional, business-focused design without casual elements.

```tsx
<div className="min-h-screen bg-gray-50 pb-[72px]">
  {/* Header */}
  <header className="bg-white px-5 pt-[52px] pb-5 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 tracking-wide">
          Pharma Corp
        </p>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
          ダッシュボード
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
        <Avatar className="h-10 w-10 bg-gray-800 text-white text-sm">
          田中
        </Avatar>
      </div>
    </div>
  </header>
  
  <main className="p-5">
    {children}
  </main>
  
  <BottomNavigation active="home" />
</div>
```

### 7.3 Bottom Navigation

Clean, professional icons with subtle badge indicators.

```tsx
function BottomNavigation({ active }: { active: string }) {
  const items = [
    { id: 'home', label: 'ホーム', icon: Home },
    { id: 'projects', label: 'プロジェクト', icon: Folder },
    { id: 'pending', label: '承認', icon: CheckCircle, badge: 3 },
    { id: 'settings', label: '設定', icon: Settings },
  ];
  
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-2 pt-2 pb-5">
      <div className="flex justify-around">
        {items.map(item => (
          <Link
            key={item.id}
            href={`/client/${item.id}`}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1",
              active === item.id ? "text-primary-600" : "text-gray-400"
            )}
          >
            <div className="relative">
              <item.icon className="h-[22px] w-[22px]" strokeWidth={2} />
              {item.badge && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

### 7.4 Pending Actions Card (Dashboard Hero)

Deep blue card that draws attention to items requiring action.

```tsx
<div className="bg-[#1e3a5f] rounded-xl p-5">
  <div className="flex justify-between items-start mb-4">
    <div>
      <p className="text-xs text-blue-100 uppercase tracking-wider font-medium mb-1">
        要対応
      </p>
      <p className="text-[32px] font-semibold text-white tracking-tight">
        3<span className="text-lg font-normal ml-1">件</span>
      </p>
    </div>
    <span className="bg-white/10 rounded-lg px-3.5 py-2.5 text-sm text-blue-100">
      承認待ちコンテンツ
    </span>
  </div>
  <Button className="w-full bg-white text-primary-700 hover:bg-gray-50">
    確認する
    <ArrowRight className="h-4 w-4 ml-2" />
  </Button>
</div>
```

### 7.5 Project Card (Mobile)

Professional card with project ID for corporate traceability.

```tsx
<div className="bg-white rounded-xl p-4 border border-gray-200">
  {/* Header */}
  <div className="flex justify-between items-start mb-3">
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 font-mono mb-1">
        PRJ-2025-001
      </p>
      <h3 className="text-[15px] font-medium text-gray-900 leading-snug">
        新製品発表プレスリリース
      </h3>
    </div>
    {urgency && (
      <UrgencyBadge level={urgency} />
    )}
  </div>
  
  {/* Meta */}
  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
    <div className="flex items-center gap-4">
      <StatusBadge status="レビュー待ち" type="warning" />
      <span className="text-sm text-gray-500">3件</span>
    </div>
    <span className="text-sm text-gray-500">2025/01/30</span>
  </div>
</div>
```

### 7.6 Document Review Screen

Full-width content display with compliance indicator and sticky actions.

```tsx
<div className="min-h-screen bg-white pb-[140px]">
  {/* Header */}
  <header className="bg-white px-5 pt-[52px] pb-4 border-b border-gray-200 sticky top-0 z-10">
    <div className="flex items-center gap-3 mb-3">
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex-1">
        <p className="text-xs text-gray-500">PRJ-2025-001</p>
        <h1 className="text-lg font-semibold text-gray-900">
          プレスリリース
        </h1>
      </div>
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <MoreHorizontal className="h-5 w-5" />
      </Button>
    </div>
    
    <div className="flex items-center gap-3 flex-wrap">
      <StatusBadge status="レビュー待ち" type="warning" />
      <span className="text-sm text-gray-500 flex items-center gap-1">
        <FileText className="h-3.5 w-3.5" />
        Version 2
      </span>
      <span className="text-sm text-gray-500">更新: 2時間前</span>
    </div>
  </header>
  
  {/* Compliance Bar */}
  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Shield className="h-4 w-4 text-gray-600" />
      <span className="text-sm text-gray-600">コンプライアンス</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }} />
      </div>
      <span className="text-sm font-semibold text-green-600">92%</span>
    </div>
  </div>
  
  {/* Document Content */}
  <main className="p-5">
    <article className="prose prose-gray max-w-none">
      <h2 className="text-xl font-semibold text-gray-900 leading-relaxed mb-4">
        ファーマコープ、革新的な糖尿病治療薬「グルコケアX」の製造販売承認を取得
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        東京、2025年1月30日
      </p>
      <div className="text-[15px] text-gray-700 leading-relaxed space-y-4">
        {/* Content paragraphs */}
      </div>
    </article>
  </main>
  
  {/* Sticky Action Bar */}
  <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-5 pb-7">
    <Button variant="ghost" className="w-full mb-3 text-gray-600">
      <MessageSquare className="h-4 w-4 mr-2" />
      コメントを追加
    </Button>
    <div className="flex gap-3">
      <Button variant="outline" className="flex-1">
        差し戻し
      </Button>
      <Button className="flex-1 bg-primary-600">
        承認する
      </Button>
    </div>
  </div>
</div>
```

### 7.7 Flagged Content Block

Highlight sections requiring client attention.

```tsx
<div className="bg-amber-50 p-4 rounded-lg border-l-[3px] border-amber-500 my-4">
  <p className="text-[15px] text-gray-700 leading-relaxed mb-3">
    グルコケアXは、従来の治療薬と比較して
    <mark className="bg-amber-200 px-0.5 rounded">優れた血糖コントロール効果</mark>
    を示し、1日1回の服用で長期的な血糖管理が可能です。
  </p>
  <div className="flex items-center gap-2 p-2.5 bg-white rounded-md text-sm text-amber-600">
    <AlertCircle className="h-4 w-4" />
    <span>表現の確認が必要です</span>
  </div>
</div>
```

### 7.8 Desktop Client Portal Layout

When clients access on desktop, expand to full sidebar navigation.

```tsx
// Desktop Layout (lg and above)
<div className="min-h-screen bg-gray-50">
  {/* Sidebar */}
  <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
    {/* Logo */}
    <div className="h-16 px-6 flex items-center border-b border-gray-100">
      <Logo className="h-8" />
    </div>
    
    {/* Client Info */}
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Pharma Corp</p>
          <p className="text-xs text-gray-500">クライアントポータル</p>
        </div>
      </div>
    </div>
    
    {/* Navigation */}
    <nav className="p-3 space-y-1">
      <NavItem icon={LayoutDashboard} href="/client" active>
        ダッシュボード
      </NavItem>
      <NavItem icon={Folder} href="/client/projects">
        プロジェクト
      </NavItem>
      <NavItem icon={CheckCircle} href="/client/pending" badge={3}>
        承認待ち
      </NavItem>
      <NavItem icon={Bell} href="/client/notifications">
        通知
      </NavItem>
    </nav>
    
    {/* User Menu */}
    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
      <ClientUserMenu />
    </div>
  </aside>
  
  {/* Main Content */}
  <main className="pl-64">
    <div className="max-w-5xl mx-auto p-8">
      {children}
    </div>
  </main>
</div>
```

### 7.9 Status & Urgency Badges (Refined)

Professional, muted badge styling.

```tsx
// Status Badge
function StatusBadge({ status, type }: { status: string; type: 'success' | 'warning' | 'error' | 'info' }) {
  const styles = {
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
  };
  
  return (
    <span className={cn(
      "text-xs font-medium px-2.5 py-1 rounded-full",
      styles[type]
    )}>
      {status}
    </span>
  );
}

// Urgency Badge
function UrgencyBadge({ level }: { level: '優先' | '緊急' }) {
  const isUrgent = level === '緊急';
  
  return (
    <span className={cn(
      "text-xs font-semibold px-2 py-0.5 rounded",
      isUrgent 
        ? "bg-red-50 text-red-600 border border-red-200" 
        : "bg-amber-50 text-amber-600"
    )}>
      {level}
    </span>
  );
}
```

### 7.10 Notification Item

Clean notification row with unread indicator.

```tsx
function NotificationItem({ 
  icon: Icon, 
  title, 
  description, 
  time, 
  unread 
}: NotificationProps) {
  return (
    <div className={cn(
      "flex gap-3 px-5 py-3.5 border-b border-gray-100",
      unread ? "bg-blue-50" : "bg-white"
    )}>
      <div className={cn(
        "w-9 h-9 rounded-md flex items-center justify-center shrink-0",
        unread ? "bg-white" : "bg-gray-100"
      )}>
        <Icon className="h-[18px] w-[18px] text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm text-gray-900",
          unread && "font-medium"
        )}>
          {title}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {description}
        </p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
      {unread && (
        <div className="w-2 h-2 rounded-full bg-primary-600 shrink-0 mt-2" />
      )}
    </div>
  );
}
```

---

## 8. Status & Urgency System

### 8.1 Project Status

| Status | Japanese | Color | Usage |
|--------|----------|-------|-------|
| `requested` | リクエスト | Gray | Client submitted request |
| `in_progress` | 進行中 | Blue | PR team working |
| `in_review` | レビュー中 | Amber | Awaiting client review |
| `approved` | 承認済み | Green | Client approved |
| `completed` | 完了 | Green (solid) | Project finished |
| `archived` | アーカイブ | Gray | Inactive |

### 8.2 Content Status

| Status | Japanese | Color | Usage |
|--------|----------|-------|-------|
| `draft` | 下書き | Gray | Internal editing |
| `submitted` | 提出済み | Blue | Sent for internal review |
| `in_review` | レビュー中 | Amber | Client reviewing |
| `needs_revision` | 要修正 | Orange | Returned for changes |
| `approved` | 承認済み | Green | Client approved |

### 8.3 Urgency Levels

```tsx
const urgencyConfig = {
  standard: {
    label: '通常',
    labelEn: 'Standard',
    color: 'bg-gray-100 text-gray-600',
    timeline: '5-7日',
    icon: null,
  },
  priority: {
    label: '優先',
    labelEn: 'Priority',
    color: 'bg-amber-100 text-amber-700',
    timeline: '2-3日',
    icon: AlertCircle,
  },
  urgent: {
    label: '緊急',
    labelEn: 'Urgent',
    color: 'bg-orange-100 text-orange-700',
    timeline: '24-48時間',
    icon: AlertTriangle,
  },
  crisis: {
    label: '危機対応',
    labelEn: 'Crisis',
    color: 'bg-red-100 text-red-700 border border-red-300',
    timeline: '当日',
    icon: AlertOctagon,
    pulse: true, // Add pulsing animation
  },
};
```

### 8.4 Compliance Score Display

```tsx
// Score Badge
function ComplianceScore({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 90) return 'text-green-600 bg-green-100';
    if (s >= 70) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium",
      getColor(score)
    )}>
      <Shield className="h-4 w-4" />
      {score}点
    </div>
  );
}

// Detailed Breakdown
function ComplianceBreakdown({ details }) {
  return (
    <div className="space-y-3">
      {Object.entries(details.categories).map(([key, data]) => (
        <div key={key}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{categoryLabels[key]}</span>
            <span className="font-medium">{data.score}点</span>
          </div>
          <Progress value={data.score} className="h-2" />
        </div>
      ))}
    </div>
  );
}
```

---

## 9. Japanese UX Considerations

### 9.1 Text Display

```css
/* Optimize for Japanese text */
.japanese-text {
  line-height: 1.8;           /* More generous for kanji */
  letter-spacing: 0.02em;     /* Slight spacing */
  word-break: break-all;      /* Allow breaking within words */
  overflow-wrap: break-word;
}

/* Prevent orphaned particles */
.no-break {
  white-space: nowrap;
}
```

### 9.2 Date & Time Formatting

```typescript
// Date display (Japanese format)
function formatDateJa(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
  // Output: 2025年1月30日
}

// Relative time
function formatRelativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat('ja', { numeric: 'auto' });
  // Output: 2時間前, 昨日, 3日前
}

// Date range
function formatDateRange(start: Date, end: Date): string {
  return `${formatDateJa(start)} 〜 ${formatDateJa(end)}`;
}
```

### 9.3 Number Formatting

```typescript
// Currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
  // Output: ¥1,234,567
}

// Large numbers
function formatNumber(num: number): string {
  return new Intl.NumberFormat('ja-JP').format(num);
  // Output: 1,234,567
}
```

### 9.4 Form Labels

```tsx
// Japanese form pattern - label above input
<div className="space-y-2">
  <Label>
    プロジェクト名
    <span className="text-red-500 ml-1">*</span>
  </Label>
  <Input placeholder="例: 新製品発表キャンペーン" />
  <p className="text-xs text-gray-500">
    50文字以内で入力してください
  </p>
</div>
```

### 9.5 Empty States

```tsx
// Japanese-appropriate empty state
<div className="text-center py-12">
  <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
    <FolderOpen className="h-6 w-6 text-gray-400" />
  </div>
  <h3 className="text-base font-medium text-gray-900 mb-1">
    プロジェクトがありません
  </h3>
  <p className="text-sm text-gray-500 mb-4">
    新しいプロジェクトを作成して始めましょう
  </p>
  <Button>
    <Plus className="h-4 w-4 mr-2" />
    新規プロジェクト
  </Button>
</div>
```

---

## 10. Responsive Patterns

### 10.1 Breakpoints

```javascript
// Tailwind defaults (use these)
const breakpoints = {
  'sm': '640px',   // Mobile landscape
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
};
```

### 10.2 PR Portal Responsive

```tsx
// Sidebar: collapsible on tablet, hidden on mobile
<aside className={cn(
  "fixed inset-y-0 left-0 z-50 bg-white border-r",
  "w-64 lg:w-60",
  "transform transition-transform",
  isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
)}>

// Content: adjust padding
<main className="lg:pl-60">
  <div className="p-4 md:p-6 lg:p-8">
```

### 10.3 Client Portal Responsive

```tsx
// Cards: stack on mobile, grid on tablet+
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Bottom nav: always visible on mobile
<nav className="fixed bottom-0 inset-x-0 lg:hidden">
```

---

## 11. Motion & Interactions

### 11.1 Transition Defaults

```css
:root {
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}

/* Apply to interactive elements */
.interactive {
  transition: all var(--transition-base);
}
```

### 11.2 Hover States

```tsx
// Card hover
"hover:shadow-md hover:border-gray-300 transition-all"

// Button hover
"hover:bg-primary-hover active:scale-[0.98] transition-all"

// List item hover
"hover:bg-gray-50 transition-colors"
```

### 11.3 Loading States

```tsx
// Skeleton
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>

// Spinner
<Loader2 className="h-5 w-5 animate-spin text-primary" />

// Button loading
<Button disabled>
  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  保存中...
</Button>
```

### 11.4 Page Transitions

```tsx
// Fade in on mount
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  {content}
</motion.div>
```

---

## 12. Accessibility

### 12.1 Focus States

```css
/* Visible focus ring */
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* Remove default outline */
*:focus {
  outline: none;
}
```

### 12.2 ARIA Labels

```tsx
// Navigation
<nav aria-label="メインナビゲーション">

// Status badge
<Badge aria-label={`ステータス: ${status}`}>

// Icon buttons
<Button aria-label="通知を開く" variant="ghost" size="icon">
  <Bell className="h-5 w-5" />
</Button>
```

### 12.3 Color Contrast

- Text on white: minimum `text-gray-600` (#475569) for body
- Text on colored backgrounds: ensure 4.5:1 ratio
- Interactive elements: ensure 3:1 ratio for boundaries

---

## Quick Reference

### Import Paths

```typescript
// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Utilities
import { cn } from '@/lib/utils';

// Icons (Lucide)
import { Plus, Check, X } from 'lucide-react';
```

### Common Patterns

```tsx
// Conditional classes
className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes"
)}

// Responsive visibility
className="hidden md:block"  // Hidden on mobile
className="md:hidden"        // Mobile only
```

### Key Measurements

| Element | Size |
|---------|------|
| Sidebar width | 240px (60px collapsed) |
| Detail panel | 320px |
| Header height | 64px (desktop), 56px (mobile) |
| Bottom nav height | 64px |
| Card border radius | 10px |
| Button height | 40px (default) |
| Input height | 40px |
| Avatar sizes | 24/32/40/48px |

---

*This design system should be used alongside shadcn/ui components with the customizations specified above.*

# ClearPress AI — Design Reference

The **New Project** page (`/projects/new`) is the canonical reference for how full-page, form-heavy screens should look and behave. New pages should match this visual language. This doc captures the *recipes*; the actual design tokens live in [`src/index.css`](../src/index.css) (Tailwind v4 `@theme` + `:root`/`.dark` CSS variables) — reference them, don't restate their values.

> Convention still holds: UI labels render a **single** active language via `<BilingualLabel ja en />` / `pickLang()` (driven by the header `LanguageToggle`), never side-by-side. See CLAUDE.md → Conventions.

---

## 1. Canvas & elevation

The signature of this design is **gray page canvas + white cards**. Content floats on a soft muted canvas instead of sitting flat on white.

- **Page root:** wrap the page body in `bg-muted/40` (the `<main>` in `AppShell` stays `p-6`; the wrapper paints the canvas behind the cards). Do **not** flip the global `--background` — that would recolor every existing page at once. Rolling the gray canvas app-wide is a deliberate later pass, not something a single new page decides.
- **Cards** are the elevated surface: white `bg-card`, `rounded-xl`, a hairline `ring-1 ring-foreground/10` (a ring, not a border — matches the shadcn `Card`), generous padding. This contrast (gray behind, white card, faint ring) is what the mockup's "contrast in color, background, borders" refers to.

## 2. Section card (numbered step)

Each major form section is one card with a numbered badge, title, and muted subtitle.

```tsx
// FormSectionCard: number + title + subtitle, then children
<Card>
  <CardHeader>
    <div className="flex items-start gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
        {step}
      </span>
      <div className="space-y-0.5">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">{children}</CardContent>
</Card>
```

- Badge: `bg-primary/10 text-primary` rounded square (`size-7`, `rounded-lg`) — the brand blue-violet at 10% is the "step chip" accent used throughout.
- Two-up field rows inside a card use `grid grid-cols-1 md:grid-cols-2 gap-4`.

## 3. Two-column shell (form + summary sidebar)

```tsx
<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
  <div className="space-y-6">{/* section cards */}</div>
  <aside className="lg:sticky lg:top-6 h-fit">{/* GenerationSummary */}</aside>
</div>
```

- Left column: `space-y-6` stack of section cards. Right column: a single sticky summary card.
- Below `lg` the summary stacks under the form.
- The whole grid lives inside **one `<form>`** so a submit CTA in the summary submits the form (see §7 form architecture).

## 4. Segmented control

Used for short mutually-exclusive choices (Language, Drug lifecycle, Length tier). Pill track, white active segment. Build on the shadcn `Tabs` **default** variant (already a segmented pill: `bg-muted` track, active `bg-background` + `shadow-sm`) or a thin `RadioGroup` wrapper. Ship one primitive `src/components/ui/segmented-control.tsx` and reuse it.

- Active segment reads as raised/white; inactive as flat on the muted track.
- Keep option count small (2–4). For >4 options use a `Select`.

## 5. Chip toggle group

Used for the **Target audience** "master control". Built on `Badge` as a toggle (mirrors [`FeedbackChipGroup`](../src/components/feedback/FeedbackChipGroup.tsx)):

- Selected → `Badge variant="default"` (solid brand blue). Unselected → `variant="outline"`.
- Interactive `Badge`: `role="button"`, `tabIndex={0}`, Enter/Space handler, `cursor-pointer select-none px-3 py-1 text-sm`.
- **Single-select** (audience) = radio semantics; multi-select (feedback) = the FeedbackChipGroup pattern. A small optional leading dot (`size-1.5 rounded-full`) echoes the mockup but is decorative.
- Pair the group label with an inline **"Master control"** `Badge variant="secondary"` (blue-tinted) to signal it cascades defaults.

## 6. Stepper (numeric ±)

`[−] value [+]` for bounded small integers (variant count 1–3). No stepper primitive exists — ship `src/components/ui/stepper.tsx`:

- Flanking `Button size="icon-sm" variant="outline"` with `MinusIcon`/`PlusIcon`, a centered read-only value in `tabular-nums`, wrapped in `inline-flex items-center gap-1`.
- Clamp to `[min,max]`; disable the end buttons at the bounds.

## 7. Compliance / severity callout

A tinted alert whose tone tracks a domain signal (here: drug lifecycle → compliance strictness). Use `Alert variant="destructive"` (tinted red, not a solid fill) with a `ShieldIcon`/`ShieldAlertIcon`. Derive the copy from a pure client-side map (e.g. `src/lib/compliance-level.ts`), never hardcode per-usage. For softer advisories the codebase also uses an amber recipe: `rounded-md border border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs`.

## 8. Generation summary card (right sidebar)

A sticky recap + primary action panel. Structure:

- Header (title + muted "Review before generating").
- **Label/value rows:** `flex items-center justify-between text-sm`, label `text-muted-foreground`, value right-aligned. One row per key selection (Language, Audience, Lifecycle, Length, Channel).
- A **status pill** for the compliance level (tinted `Badge`/dot).
- The **Stepper** (variant count).
- **Primary CTA** full-width (`Button` default/solid, dynamic label e.g. "Generate {N} variants").
- **Secondary actions** below (`Button variant="outline"`) — deferred features render `disabled`.
- Helper text under the card in `text-xs text-muted-foreground`.

## 9. Buttons, inputs, typography

- **Buttons:** primary = `Button` default (solid `bg-primary`); secondary = `variant="outline"`; low-emphasis = `variant="ghost"`; tinted-danger = `variant="destructive"`. Sizes `default`(h-8)/`sm`/`lg`, `icon-*` for icon-only. See [`button.tsx`](../src/components/ui/button.tsx).
- **Inputs/Select/Textarea/Checkbox** — the existing `src/components/ui/*` primitives (h-8, `rounded-lg`, `border-input`). Don't restyle; compose.
- **Page title** `text-2xl`; **section title** `CardTitle` (`font-heading text-base font-medium`); **subtitle/help** `text-sm`/`text-xs text-muted-foreground`.
- **Vertical rhythm:** page `space-y-6`, within-card `space-y-4`, tight groups `space-y-2`.

## 10. Bilingual labels

Author every user-facing string as a `ja`/`en` pair: `<BilingualLabel ja="…" en="…" />` in JSX, `pickLang(i18n.language, ja, en)` for plain strings (toasts, `aria-label`, computed values). One language shows at a time. Reserve `t()` for shared `common.*` keys, toasts, and validation messages (which are i18n keys).

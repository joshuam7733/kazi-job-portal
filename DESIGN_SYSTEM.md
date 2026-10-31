# KAZI Design System

> *Kazi* is Swahili for "work". The identity is built around that one idea: a calm, trustworthy
> place where work in Uganda and East Africa gets found and filled.

## 0. Research notes and honesty statement

- **Mobbin MCP:** not connected in this environment (checked at project start, 2026‑10‑28). No Mobbin
  tools were available, so **no private Mobbin screens were viewed**.
- **Public Mobbin site:** the public homepage only lists its pattern taxonomy (screens, flows such as
  onboarding / account setup, UI patterns such as dialogs, navigation, forms, tables, empty states,
  website sections such as heroes, navigation and footers). The screen library itself needs an account.
  We used that taxonomy as the checklist for which patterns each KAZI surface must get right.
- **Other references:** the decisions below draw on well-documented, widely shared interaction
  conventions in recruitment products (LinkedIn Jobs, Indeed, Glassdoor, Wellfound) and SaaS dashboards —
  e.g. list + detail job search, filter drawers on mobile, kanban applicant pipelines, left sidebar +
  bottom bar dashboards. No layouts, copy or assets were copied; KAZI's visual identity is original.
- **To deepen this later:** connect the Mobbin MCP server (or add reference screenshots to
  `docs/references/`) and revisit sections 5–6.

## 1. Brand

| | |
|---|---|
| Name | KAZI Job Portal (wordmark: **kazi**, lower case, with a solid green "dot" square) |
| Tagline | Find Your Opportunity. Build Your Future. |
| Personality | Trustworthy, quietly confident, warm, precise. Never loud, never "startup-cute". |
| Voice | Plain verbs, sentence case, specific. Buttons say what happens ("Apply for this job", "Save job", "Publish job"). Errors explain the fix. |

**The one bold thing.** The homepage hero is the only place we spend boldness: a very large
display headline in Bricolage Grotesque beside a live "opportunity board" — a stack of real
(published) job cards pulled from the database that settles into place once on load. Everything
else stays disciplined: flat surfaces, borders before shadows, one accent colour.

### Deliberately avoided defaults
- No ALL‑CAPS tracked eyebrow labels above headings; section headings stand on their own.
- No `A · B · C` meta strings — job metadata is shown as discrete icon + text items or chips.
- No arrows appended to button text, no gradient washes, no glassmorphism, no stock photography.
- No "numbered 01/02/03" markers except where content is a real sequence ("How KAZI works" is a
  three‑step process, so it is numbered there and nowhere else).
- Radius follows hierarchy (controls 10px, cards 14px, panels 20px, chips pill) instead of one radius everywhere.

## 2. Colour tokens

Defined as CSS variables in `src/app/globals.css` and exposed to Tailwind via `@theme`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--canvas` | `#F6F7F4` | `#0D1626` | Page background (faint green‑grey, not cream) |
| `--surface` | `#FFFFFF` | `#132036` | Cards, panels, inputs |
| `--surface-2` | `#EEF1EC` | `#1A2943` | Subtle fills, table headers, hovered rows |
| `--ink` | `#0F1B2D` | `#E9EEF4` | Primary text, primary buttons (navy) |
| `--muted` | `#566170` | `#9AA8BC` | Secondary text (AA on canvas and surface) |
| `--line` | `#E1E5DF` | `#25344D` | Borders, dividers |
| `--accent` | `#0E7C58` | `#3CCB8C` | Kazi green — links, focus, success, key CTAs |
| `--accent-soft` | `#E2F3EB` | `#12382C` | Accent backgrounds (chips, selected states) |
| `--sun` | `#F2B544` | `#F2B544` | "Featured" marker only — used sparingly |
| `--danger` | `#C2410C` | `#FB8A5A` | Destructive actions and errors |

Contrast checks: `--ink` on `--canvas` 15.9:1; `--muted` on `--surface` 6.2:1; white on `--accent` 5.2:1;
`--accent` text on `--surface` 5.2:1. The brief's suggested `#16A34A` emerald was darkened to
`#0E7C58` because white text on `#16A34A` is only ~3.3:1 and fails WCAG AA for body-size text.

Distribution: ~60% canvas/surface, ~30% ink, ~10% accent. Elevation is expressed first with a
1px `--line` border, then with one soft shadow token for overlays only.

## 3. Typography

| Role | Family | Notes |
|---|---|---|
| Display / headings / big numbers | **Bricolage Grotesque** (variable, opsz) | Tight tracking (‑0.02em) at ≥32px; weight 600–700 |
| UI and body | **Manrope** | 400/500/600/700; tabular numerals for stats and salaries |

Scale (rem, 16px base, ~1.25 ratio): 0.75 · 0.875 · 1 · 1.125 · 1.25 · 1.5 · 1.875 · 2.25 · 3 · 3.75 · 4.5.
Body line-height 1.6; headings 1.1–1.2. Body measure capped at ~68ch on editorial pages.

## 4. Layout & spacing

- 4/8pt spacing rhythm; page gutter 16px mobile, 24px tablet, 32px desktop; content max‑width 1200px.
- Content is **left aligned** everywhere (including the hero); only empty states centre.
- Public pages: sticky top navigation (64px), full‑bleed sections separated by background change or a hairline, not by cards.
- App pages (dashboards): 248px left sidebar on ≥1024px; bottom tab bar (≤5 items) on mobile, with "More" sheet.

```
Desktop public                          Mobile public
┌──────────────────────────────────┐    ┌──────────────┐
│ kazi  Jobs Companies ...  [Start]│    │ kazi     [≡] │
├──────────────────────────────────┤    ├──────────────┤
│ Headline (big)     ┌──────────┐  │    │ Headline     │
│ [ search | where | Search ]    │    │ [search     ]│
│ popular: chips     │ job card │  │    │ [where      ]│
│                    │ job card │  │    │ [Search jobs]│
│                    └──────────┘  │    │ card stack   │
└──────────────────────────────────┘    └──────────────┘

Job search (desktop)                     App shell
┌────────┬─────────────────────────┐    ┌──────┬───────────────────┐
│Filters │ 124 jobs · sort ▾ ▦ ☰  │    │ nav  │ Title    [action] │
│ type   │ ┌─────────────────────┐ │    │      │ stat stat stat    │
│ place  │ │ job card            │ │    │      │ table / pipeline  │
│ salary │ └─────────────────────┘ │    │      │                   │
└────────┴─────────────────────────┘    └──────┴───────────────────┘
```

## 5. Components (src/components/ui)

Button (primary ink, accent, secondary outline, ghost, danger; sm/md/lg; loading state) ·
Input / Textarea / Select (native, styled) / Checkbox / Switch · Label + FieldError (visible labels always;
placeholders only for format hints) · Badge (neutral, accent, sun, danger, outline) · Chip (filter toggles) ·
Avatar + CompanyLogo (initials fallback using company brand colour) · Card · Tabs (link‑based, URL state) ·
Dialog / Sheet (Radix, focus trap + restore) · DropdownMenu · Tooltip (required on icon‑only buttons) ·
Toast (Sonner) · Skeleton · EmptyState (icon, one sentence, one action) · Progress / ProfileMeter ·
DataTable (responsive: table on ≥768px, stacked cards below) · Pagination · Charts (inline SVG bar/line/donut,
server rendered, no client JS).

## 6. Patterns and user flows

| Surface | Pattern chosen | Why |
|---|---|---|
| Homepage | Search-first hero, then proof (featured jobs, companies), then education (how it works, resources), then conversion (employers, alerts) | Job seekers arrive with intent; search must be usable within one scroll |
| Job search | Filter rail (desktop) / bottom-sheet filter drawer (mobile); results list with list/grid toggle; URL-persisted state; debounced keyword | Shareable, back-button safe, works without JS for paging |
| Job detail | Two columns, sticky apply panel; on mobile a fixed bottom action bar | Apply / Save is always one tap away |
| Apply | 3‑step flow: CV & cover letter → screening questions → review & submit; confirmation screen | Short steps keep mobile completion high |
| Onboarding (seeker) | 4 steps with skip on optional steps and a profile meter | Get users to value fast, finish later |
| Onboarding (employer) | Company details → verification request | Trust before publishing |
| Candidate dashboard | Overview cards, applications table with status timeline, saved jobs folders | Mirrors the candidate's mental model "what's happening with my applications" |
| ATS | Kanban pipeline (Applied → Screening → Shortlisted → Interview → Offer → Hired) with keyboard-accessible stage menu, plus detail drawer with private notes | Visual, and works without drag‑and‑drop |
| Admin | Dense data tables with filters, approval queues with one-line reasons, audit log for every action | Moderation speed and accountability |
| Messaging | Inbox list + thread (split pane on desktop, stacked on mobile) | Standard, learnable |

### Core flows
1. **Find & apply:** Home → search → job detail → (sign in) → apply (3 steps) → confirmation → dashboard › applications.
2. **Seeker onboarding:** Sign up (role: job seeker) → verify email (if SMTP) → onboarding 4 steps → dashboard.
3. **Employer:** Sign up (role: employer) → company onboarding → verification request → post job (draft → submit) → moderation/auto‑publish → pipeline.
4. **Admin moderation:** Admin overview → queues (verification, jobs pending, reports) → decision with note → audit log + notifications.

## 7. Motion

Durations: 120ms (micro), 200ms (overlays), 320ms (page/hero). Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.
Only `opacity` and `transform` animate. One orchestrated moment (hero card stack). Overlays fade/scale;
sheets slide. Button press feedback and success check animations respond to user actions.
`prefers-reduced-motion: reduce` → all transitions become instant or opacity-only (global CSS + `MotionConfig reducedMotion="user"`).

## 8. Accessibility checklist

Semantic landmarks, skip link, visible 2px accent focus ring (offset 2px), labels on every input,
error text linked via `aria-describedby`, 44×44px touch targets on mobile, tooltips on icon buttons,
dialogs trap and restore focus, colour never the only signal (status badges include text).

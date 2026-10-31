# KAZI — Progress log

Status as of **2026-10-28**. "Verified" means it was exercised in this environment (see Verification).

## Phase 1 — Research and architecture ✅
- Repository was empty; toolchain: Node 24, npm. No Git, PostgreSQL or Docker on the machine.
- Mobbin MCP not connected; public Mobbin pages only expose the pattern taxonomy. No private Mobbin
  screens were viewed (documented in `DESIGN_SYSTEM.md` §0).
- Design direction, tokens, patterns and user flows documented in `DESIGN_SYSTEM.md`.
- Schema designed (`prisma/schema.prisma`, 30 models) with indexes, uniqueness rules and cascades.

## Phase 2 — Design foundation ✅
- Tailwind 4 tokens (light/dark), Bricolage Grotesque + Manrope, component kit in `src/components/ui`.
- Public header/footer with mobile sheet menu; app shell with sidebar and mobile bottom tab bar.

## Phase 3 — Public website ✅
- Homepage: all 13 requested sections, live data, CSS-only hero animation honouring reduced motion.
- Job search: keyword (debounced), location, category, industry, company, type, workplace, salary,
  experience, education, date posted; sort; list/grid; server pagination; URL state; mobile filter sheet;
  empty state; save search as alert.
- Job detail: two-column with sticky apply panel, mobile action bar, share, save, report, related jobs,
  JobPosting JSON-LD, canonical/OG metadata.
- Companies directory + profile pages; career resources list + article pages (Markdown, Article JSON-LD).
- About, Trust & safety, Privacy (draft), Terms (draft), 404, error and forbidden pages; sitemap, robots.

## Phase 4 — Auth and candidate experience ✅
- Auth.js v5: email/password, optional Google, password reset, email verification, session revocation,
  rate-limited sign-in, account deletion.
- 4-step onboarding with skips; profile editor; CV management; privacy controls; completeness meter.
- 3-step application (CV + cover letter, screening questions, review) with deadline checks, file
  validation and duplicate prevention; confirmation; withdrawal; candidate-safe status timeline.
- Saved jobs with folders; job alerts (instant/daily/weekly) with management UI.

## Phase 5 — Employer experience ✅
- Company onboarding with optional verification request and document upload.
- Dashboard with live stats and 30-day activity chart; jobs list with status filters and actions.
- Job editor: drafts, screening questions, salary, deadline; automatic fraud screening; publish vs review.
- Kanban pipeline (Applied → Screening → Shortlisted → Interview → Offer → Hired, plus Rejected) with
  drag-and-drop and an accessible "Move" menu; applicant detail with CV, answers, private notes,
  interview scheduling and messaging.

## Phase 6 — Administration ✅
- Overview analytics (sign-ups/week, applications/week, jobs by category, hiring funnel, queues).
- Verification queue, job moderation (review / flagged / live / all, feature toggle), reports,
  users (suspend, admin roles, invites), companies (feature/suspend), taxonomy, resources CMS,
  announcements, platform settings (homepage copy, approval policy, risk threshold), audit log.

## Phase 7 — Notifications and integration ✅
- In-app notifications for every event in the brief; email via SMTP or local dev mailbox (`/dev/mail`).
- Messaging between employers and applicants (split-pane inbox).
- Job alerts: instant on publish, daily/weekly via `/api/cron/job-alerts` or admin "Run now".

## Phase 8 — Quality assurance (see Verification)
- Unit/component tests: `tests/unit` (filters, fraud scoring, publish policy, RBAC, rate limiting,
  validation, profile scoring, file sniffing, UI components, charts).
- E2E tests: `tests/e2e` (search + URL filters, JSON-LD, auth redirects, mobile overflow, apply flow +
  duplicate prevention, employer pipeline → candidate notification, admin approval, scam listing hidden).
- Route smoke test: `scripts/smoke.mjs` (all roles, ~75 routes, permission redirects, private file access).

## Phase 9 — Deployment preparation ✅
- `.env.example`, `DEPLOYMENT.md`, `docker-compose.yml` (optional Postgres), `scripts/create-admin.ts`.
- No deployment was performed (not authorised).

## Verification (2026-10-28, Windows 10, Node 24, 4 GB RAM)
| Check | Result |
|---|---|
| `npx prisma migrate dev` + `npm run db:seed` | ✅ 43 jobs, 13 companies, 31 job seekers, articles, applications, reports |
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors, 0 warnings |
| `npm test` (Vitest) | ✅ 46/46 tests |
| `npm run build` (production) | ✅ 60 routes |
| `node scripts/smoke.mjs` against `npm start` | ✅ 80/80 checks (all roles, permission redirects, private CV access, data export, cron auth) |
| `npm run test:e2e` (Playwright, Chromium desktop + Pixel 7) | ✅ 10/10 against the production build |
| Manual browser checks | Homepage (desktop light, mobile dark), sign-in → seeker dashboard, employer kanban |

Issues found and fixed during verification: a hero animation that could stay invisible before
hydration (now CSS-only), build-time DB prerendering timeouts (public pages now render per request),
filter checkboxes lagging behind the URL (now optimistic), the application confirmation being skipped
by revalidation (now a redirect to the application page with a confirmation banner), kanban columns
widening into each other on long headlines, moderation toasts lost when an item left its queue, and
eight React 19 lint findings (effects/purity).

Run order for a clean verification: `npm run db:seed` → `node scripts/smoke.mjs` → `npm run test:e2e`
(the e2e suite creates an application and approves a job, so re-seed before running it again).

Not verified here: real SMTP delivery, Google sign-in, the S3 storage driver (all need credentials),
screen-reader testing with NVDA/VoiceOver, and Lighthouse/performance audits on real devices.

## Known gaps and next steps
- **Mobbin research**: connect the Mobbin MCP to validate patterns against real reference screens.
- **Rate limiting** is per-process memory; use Redis/edge limits for multi-instance production.
- **Full-text search** uses case-insensitive `contains`; add PostgreSQL `pg_trgm`/`tsvector` indexes
  once listings exceed tens of thousands.
- **Multi-member companies**: the schema supports several recruiters per company, but there is no
  "invite a teammate" UI yet — additional members must be linked by an admin in the database.
- **Email templates** are a single plain layout; no per-event HTML design yet.
- **Images**: company logos use `<img>` served by the file route; add `next/image` with a loader for
  the S3 bucket/CDN when traffic grows.
- **Legal pages** are drafts and must be reviewed by counsel.

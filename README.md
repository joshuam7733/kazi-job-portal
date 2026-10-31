# KAZI Job Portal

**Find Your Opportunity. Build Your Future.**

KAZI is a recruitment platform for Uganda and East Africa: job search for candidates, an applicant
tracking system for employers and agencies, and a moderation-first admin panel that keeps fraudulent
listings out.

> Listings, companies and people marked **Sample data** are fictional demonstration content created by
> the seed script. Remove them (see "Going live" below) before launch.

## Features

| Area | What works |
|---|---|
| Public site | Homepage with live data, job search with debounced keyword search, 10 filters, sorting, server-side pagination and URL-persisted state; job detail pages with JobPosting structured data; company directory and profiles; career resources |
| Job seekers | Sign-up, 4-step onboarding with skips, profile editor (experience, education, skills, privacy), up to 5 CVs, 3-step application with screening questions and duplicate prevention, application tracking with status timeline, saved jobs with folders, job alerts (instant/daily/weekly), messages, notifications |
| Employers | Company onboarding, verification requests with documents, job editor with drafts and screening questions, automatic fraud screening, pause/resume/close, kanban pipeline (drag-and-drop + keyboard menu), applicant profiles with private team notes, interview scheduling, candidate messaging, hiring analytics |
| Admins | Live analytics, company verification queue, job moderation queue with risk flags, user reports, user and admin-role management (invites), companies (feature/suspend), categories/industries/locations, career resources CMS (Markdown, images, SEO), announcements, platform settings, immutable audit log |
| Platform | Auth.js (credentials + optional Google), role-based access in proxy + every server action, bcrypt hashing, session revocation, rate limiting, magic-byte file validation, private CV storage served through an authorised route, email via SMTP or local dev mailbox, light/dark themes, sitemap/robots/canonical/OG metadata |

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Radix primitives (shadcn-style
components in `src/components/ui`) · Motion · Lucide · Prisma 6 + PostgreSQL · Auth.js v5 · Zod ·
Vitest + Testing Library · Playwright. Everything is open source; no paid service is required.

## Quick start (local)

Requirements: Node.js 20+ (tested on 24) and npm. **PostgreSQL is optional** — a local server is bundled.

```bash
npm install
```

```bash
cp .env.example .env
```

Edit `.env` and set `AUTH_SECRET` and `CRON_SECRET` to long random strings (e.g. `npx auth secret`).

```bash
npm run db:local
```

That starts PostgreSQL 17 on port 5433 using the `embedded-postgres` package (data in `.data/postgres`).
Leave it running in its own terminal. If you already have PostgreSQL or Docker, point `DATABASE_URL` at it
instead (see `docker-compose.yml`).

```bash
npx prisma migrate deploy
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Open http://localhost:3000.

### Demo accounts (seeded, development only)

All seeded accounts use the password **`Kazi-demo-2026`**.

| Role | Email |
|---|---|
| Job seeker (full profile, applications, interview, messages) | `seeker@kazi.test` |
| Employer — Mwezi Software Labs (verified) | `employer@kazi.test` |
| Employer — Nile Ledger Partners (verified) | `hr@nileledger.test` |
| Employer — Mpanga Retail (verification pending) | `owner@mpangaretail.test` |
| Super admin | `admin@kazi.test` |
| Moderator | `moderator@kazi.test` |
| Content editor | `editor@kazi.test` |

### Share a preview link from this PC (free, no account)

With `DEMO_MODE="true"` and `SERVER_ACTIONS_ALLOWED_ORIGINS="*.trycloudflare.com"` in `.env`:

```bash
powershell -ExecutionPolicy Bypass -File scripts\share-preview.ps1
```

It starts the database and the production app if needed, opens a Cloudflare quick tunnel and prints a
public `https://….trycloudflare.com` link (also saved to `.tools\logs\preview-url.txt`). Add `-Rebuild`
after code changes, or `-Stop` to take the link down. The link only works while this PC is on, and it
changes every time the tunnel restarts. Anyone with the link can use the demo accounts, including admin.
To reset the sample data after a review, run `npm run db:seed`.

### Emails in development

Without `SMTP_HOST`, every email (verification, password reset, notifications) is written to
`storage/mail/` and listed at **http://localhost:3000/dev/mail** (disabled in production).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run db:local` | Bundled PostgreSQL for local development |
| `npm run db:migrate` | Create/apply a migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Reset and load sample data (**deletes all data**) |
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) against a running, freshly seeded app |
| `node scripts/smoke.mjs` | Signs in as every role and requests ~70 routes, reporting failures |
| `npm run typecheck` / `npm run lint` | Static checks |

## Project structure

```
prisma/            schema, migrations, seed + sample data
scripts/           local Postgres, route smoke test
src/app/           routes: (public) site, (auth), onboarding, dashboard (seekers),
                   employer, admin, (account) messages/notifications/settings, api
src/components/    ui kit, site chrome, app shell, jobs, employer, admin
src/lib/           db, auth helpers, permissions, validation, search filters, fraud scoring,
                   storage (local/S3), mail, notifications, alerts, audit, settings
src/server/        server actions grouped by domain (all validate input and check authorization)
tests/             unit (Vitest) and e2e (Playwright)
```

## Security model (summary)

- Roles: `JOB_SEEKER`, `EMPLOYER`, `ADMIN` (+ admin roles `SUPER_ADMIN`, `MODERATOR`, `CONTENT_EDITOR`,
  `SUPPORT` with a permission matrix in `src/lib/permissions.ts`).
- `src/proxy.ts` guards areas; every page, server action and route handler re-checks on the server.
- Employers only see applications to their own company's jobs; candidates never see private notes.
  There is no candidate search — recruiters can't browse people who haven't applied.
- CVs and verification documents are private files served by `/api/files/[id]` after an ownership check.
- Sessions are JWTs re-validated against the database every minute; suspension, password change,
  role change and "sign out everywhere" revoke them via `sessionVersion`.
- See `DEPLOYMENT.md` for production hardening.

## Going live

1. Review the draft Privacy policy and Terms (`src/app/(public)/(legal)`) with a lawyer.
2. Configure SMTP, set `REQUIRE_EMAIL_VERIFICATION=true` if desired, and optionally Google sign-in.
3. Remove sample content: run `npx prisma migrate reset` (empties the database) and create your first
   super admin (see `DEPLOYMENT.md`), or delete records where `isSample = true`.
4. Follow `DEPLOYMENT.md`.

See `DESIGN_SYSTEM.md` for the design direction and `PROGRESS.md` for status and known gaps.

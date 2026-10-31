# Deploying KAZI

KAZI is a standard Next.js 16 Node.js app with PostgreSQL. It runs on any host that can run
`next start` (a VPS, Render, Railway, Fly.io, a container platform) or on Vercel.

## 1. Provision

- **PostgreSQL 15+** (managed: Neon, Supabase, RDS, Render, Railway…). Enable automated backups.
- **Object storage** (S3-compatible: AWS S3, Cloudflare R2, Backblaze B2, MinIO) — required on
  serverless or multi-instance hosts because local disk isn't shared or persistent.
- **SMTP** provider for transactional email (any provider; free tiers work at launch scale).

## 2. Environment variables

Copy `.env.example` and set, at minimum:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Public HTTPS origin, e.g. `https://kazi.example` |
| `DATABASE_URL` | Production Postgres connection string (use SSL: `?sslmode=require`) |
| `AUTH_SECRET` | 32+ random bytes. Never reuse the development value |
| `AUTH_TRUST_HOST` | `true` behind a proxy/load balancer |
| `STORAGE_DRIVER` + `S3_*` | `s3` for production |
| `SMTP_*` | Enables real email. `REQUIRE_EMAIL_VERIFICATION=true` to require confirmed emails before applying |
| `CRON_SECRET` | Protects `/api/cron/job-alerts` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional; redirect URI `https://<host>/api/auth/callback/google` |

Secrets live only in the host's secret manager — never in the repository or client code
(only `NEXT_PUBLIC_APP_URL` is exposed to the browser).

## 3. Build and migrate

```bash
npm ci
```

```bash
npx prisma migrate deploy
```

```bash
npm run build
```

```bash
npm start
```

Run `prisma migrate deploy` on every release before the new version takes traffic.
**Do not run `npm run db:seed` in production** — it deletes all data and loads demo content.

## 4. First administrator

With production data empty, create the first super admin from a one-off shell:

```bash
npx tsx scripts/create-admin.ts "Your Name" you@yourdomain.com
```

It prints a one-time password-reset link; open it to set the password. Further admins can be invited
from **Admin → Users → Invite administrator**.

## 5. Scheduled jobs

Call the job-alert endpoint hourly (daily/weekly alerts only send when due):

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://kazi.example/api/cron/job-alerts
```

Use cron, GitHub Actions on a schedule, or Vercel Cron.

## 6. Production hardening checklist

- [ ] HTTPS only (HSTS header is sent in production builds).
- [ ] Rate limiting is in-memory per instance. For multiple instances, back `src/lib/rate-limit.ts`
      with Redis/Upstash or enforce limits at the edge/WAF.
- [ ] Put the app behind a CDN/WAF; the app trusts `x-forwarded-for` for rate-limit keys.
- [ ] Database backups and point-in-time recovery enabled; test a restore.
- [ ] Bucket is private (no public ACLs); files are served only through `/api/files/[id]`.
- [ ] Configure SPF/DKIM/DMARC for the sending domain.
- [ ] Review `next.config.ts` CSP if you add third-party scripts or analytics.
- [ ] Error monitoring (e.g. self-hosted GlitchTip/Sentry) — not included by default.
- [ ] Legal review of `/privacy` and `/terms`; register with Uganda's PDPO as a data controller if required.
- [ ] Remove sample data (`isSample = true` records) before announcing launch.

## Prototype on Netlify + Neon (free tiers)

For client reviews. `DEMO_MODE=true` shows a prototype banner and the demo logins, and blocks indexing.
`STORAGE_DRIVER=database` keeps uploaded files in Postgres, so no bucket is needed.

1. Create a Neon project in **AWS Europe (Frankfurt)** (closest free region to East Africa). Copy the
   pooled and direct connection strings into `.env.neon` (gitignored; secrets are pre-generated there).
2. Load the schema and sample data into Neon from this machine (PowerShell):

   ```powershell
   Get-Content .env.neon | Where-Object { $_ -match '^\w+=' } | ForEach-Object { $k, $v = $_ -split '=', 2; Set-Item "env:$k" $v.Trim('"') }; npx prisma migrate deploy; npx prisma db seed
   ```

3. `netlify login`, then `netlify init` (or `netlify sites:create`) to create the site.
4. Set every variable from `.env.neon` with `netlify env:import .env.neon`, plus
   `NEXT_PUBLIC_APP_URL=https://<site>.netlify.app`.
5. `netlify deploy --build --prod`.

Re-run step 2 to reset the demo data after a review. Netlify's Functions region can be changed to
Frankfurt in Site configuration → Functions to sit next to the database.

## Vercel notes

Set the env vars in the project, use `STORAGE_DRIVER=s3`, add `prisma migrate deploy` to the build
command (`prisma migrate deploy && npm run build`), and add a cron entry for `/api/cron/job-alerts`
with the `Authorization` header via a small scheduled function or external scheduler.

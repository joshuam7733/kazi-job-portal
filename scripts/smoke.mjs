// Route smoke test: signs in as each seeded role and requests every page, reporting non-200 responses
// and rendered error pages. Usage: node scripts/smoke.mjs [baseUrl]   (requires seeded data)
const BASE = process.argv[2] ?? "http://localhost:3000";
const PASSWORD = "Kazi-demo-2026";

class Jar {
  cookies = new Map();
  absorb(res) {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      this.cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
  }
  header() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

async function signIn(email) {
  const jar = new Jar();
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  jar.absorb(csrfRes);
  const { csrfToken } = await csrfRes.json();
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: jar.header() },
    body: new URLSearchParams({ csrfToken, email, password: PASSWORD, callbackUrl: `${BASE}/` }),
  });
  jar.absorb(res);
  if (![...jar.cookies.keys()].some((k) => k.includes("session-token"))) throw new Error(`Sign-in failed for ${email}`);
  return jar;
}

async function firstId(jar, path, pattern) {
  const html = await (await fetch(`${BASE}${path}`, { headers: { Cookie: jar?.header() ?? "" } })).text();
  return html.match(pattern)?.[1];
}

async function check(label, jar, path, expect = 200) {
  const t = Date.now();
  const res = await fetch(`${BASE}${path}`, { headers: { Cookie: jar?.header() ?? "" }, redirect: "manual" });
  const body = res.status === 200 ? await res.text() : "";
  const errorPage = /This page didn(&#x27;|')t load|Application error|Unhandled Runtime Error/.test(body);
  const ok = res.status === expect && !errorPage;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status}  ${String(Date.now() - t).padStart(5)}ms  [${label}] ${path}${errorPage ? "  (error page rendered)" : ""}${res.status >= 300 && res.status < 400 ? ` -> ${res.headers.get("location")}` : ""}`);
  return ok;
}

const results = [];
const run = async (...args) => results.push(await check(...args));

// Public
const jobSlug = await firstId(null, "/jobs", /href="\/jobs\/([a-z0-9-]+)"/);
const companySlug = await firstId(null, "/companies", /href="\/companies\/([a-z0-9-]+)"/);
const articleSlug = await firstId(null, "/resources", /href="\/resources\/([a-z0-9-]+)"/);
for (const p of [
  "/",
  "/jobs",
  "/jobs?q=engineer&wp=remote,hybrid&sort=salary",
  "/jobs?type=internship&view=grid",
  "/jobs?salary=5000000&posted=7&exp=senior",
  `/jobs/${jobSlug}`,
  "/companies",
  `/companies/${companySlug}`,
  "/resources",
  `/resources/${articleSlug}`,
  "/employers",
  "/about",
  "/privacy",
  "/terms",
  "/trust",
  "/signin",
  "/signup",
  "/signup?role=employer",
  "/forgot-password",
  "/reset-password?token=invalid-token-value-123456",
  "/sitemap.xml",
  "/robots.txt",
]) await run("public", null, p);
await run("public", null, "/jobs/does-not-exist", 404);
await run("public", null, "/dashboard", 307);
await run("public", null, "/admin", 307);

// Job seeker
const seeker = await signIn("seeker@kazi.test");
const appId = await firstId(seeker, "/dashboard/applications", /href="\/dashboard\/applications\/([a-z0-9]+)"/);
const convoId = await firstId(seeker, "/messages", /href="\/messages\/([a-z0-9]+)"/);
for (const p of [
  "/dashboard",
  "/dashboard/applications",
  "/dashboard/applications?status=interview",
  `/dashboard/applications/${appId}`,
  "/dashboard/saved",
  "/dashboard/profile",
  "/dashboard/alerts",
  "/messages",
  `/messages/${convoId}`,
  "/notifications",
  "/settings",
  `/jobs/${jobSlug}`,
]) await run("seeker", seeker, p);
await run("seeker", seeker, "/employer", 307);
await run("seeker", seeker, "/admin", 307);

// Employer
const employer = await signIn("employer@kazi.test");
const empJobId = await firstId(employer, "/employer/jobs", /href="\/employer\/jobs\/([a-z0-9]+)\/pipeline"/);
const applicantId = await firstId(employer, "/employer/applicants", /href="\/employer\/applicants\/([a-z0-9]+)"/);
for (const p of [
  "/employer",
  "/employer/jobs",
  "/employer/jobs?status=DRAFT",
  "/employer/jobs/new",
  `/employer/jobs/${empJobId}/edit`,
  `/employer/jobs/${empJobId}/pipeline`,
  "/employer/applicants",
  `/employer/applicants/${applicantId}`,
  "/employer/company",
  "/messages",
  "/notifications",
  "/settings",
]) await run("employer", employer, p);
await run("employer", employer, "/dashboard", 307);

// Admin
const admin = await signIn("admin@kazi.test");
const postId = await firstId(admin, "/admin/content", /href="\/admin\/content\/([a-z0-9]{20,})"/);
for (const p of [
  "/admin",
  "/admin/verification",
  "/admin/verification?tab=history",
  "/admin/jobs",
  "/admin/jobs?tab=flagged",
  "/admin/jobs?tab=all",
  "/admin/reports",
  "/admin/users",
  "/admin/users?role=EMPLOYER",
  "/admin/companies",
  "/admin/taxonomy",
  "/admin/content",
  "/admin/content/new",
  `/admin/content/${postId}`,
  "/admin/announcements",
  "/admin/settings",
  "/admin/audit",
  "/notifications",
  "/settings",
]) await run("admin", admin, p);

// Content editor: limited permissions
const editor = await signIn("editor@kazi.test");
await run("editor", editor, "/admin/content");
await run("editor", editor, "/admin/users", 307);

// Private file access: CV is visible to owner, not to anonymous users
const cvId = await firstId(seeker, `/dashboard/applications/${appId}`, /href="\/api\/files\/([a-z0-9]+)"/);
await run("seeker", seeker, `/api/files/${cvId}`);
await run("public", null, `/api/files/${cvId}`, 404);
// The seeded seeker applied to Mwezi (employer@) with this CV, but never to Nile Ledger (hr@nileledger).
await run("employer", employer, `/api/files/${cvId}`);
await run("other-employer", await signIn("hr@nileledger.test"), `/api/files/${cvId}`, 404);
await run("seeker", seeker, "/api/account/export");
await run("public", null, "/api/account/export", 401);
await run("public", null, "/api/cron/job-alerts", 401);

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);

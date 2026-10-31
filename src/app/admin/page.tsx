import Link from "next/link";
import { redirect } from "next/navigation";
import { BarList, bucketByWeek, ColumnChart } from "@/components/app/charts";
import { StatCard } from "@/components/app/stat-card";
import { PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { daysAgo, timeAgo } from "@/lib/format";
import { publicJobWhere } from "@/lib/jobs/filters";
import { adminCan } from "@/lib/permissions";
import { requirePageUser } from "@/lib/session";

export const metadata = { title: "Overview" };

export default async function AdminOverview() {
  const user = await requirePageUser(["ADMIN"]);
  if (!adminCan(user.adminRole, "analytics:view")) redirect("/admin/content");
  const twelveWeeks = daysAgo(12 * 7);
  const live = publicJobWhere();

  const [seekers, employers, companies, verified, publishedJobs, applications, hires, pendingVerif, pendingJobs, openReports, signups, appDates, categories, statusGroups, audits] = await Promise.all([
    db.user.count({ where: { role: "JOB_SEEKER" } }),
    db.user.count({ where: { role: "EMPLOYER" } }),
    db.company.count(),
    db.company.count({ where: { verificationStatus: "VERIFIED" } }),
    db.job.count({ where: live }),
    db.application.count(),
    db.application.count({ where: { status: "HIRED" } }),
    db.companyVerification.count({ where: { status: "PENDING" } }),
    db.job.count({ where: { status: "PENDING_REVIEW" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.user.findMany({ where: { createdAt: { gte: twelveWeeks }, role: { not: "ADMIN" } }, select: { createdAt: true } }),
    db.application.findMany({ where: { createdAt: { gte: twelveWeeks } }, select: { createdAt: true } }),
    db.jobCategory.findMany({ select: { name: true, _count: { select: { jobs: { where: live } } } } }),
    db.application.groupBy({ by: ["status"], _count: true }),
    adminCan(user.adminRole, "audit:view") ? db.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { actor: { select: { name: true } } } }) : Promise.resolve([]),
  ]);
  const byCategory = categories
    .map((c) => ({ label: c.name, value: c._count.jobs }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const statusCount = (s: string) => statusGroups.find((g) => g.status === s)?._count ?? 0;
  const funnel = [
    { label: "Applied", value: applications },
    { label: "Reviewed or beyond", value: applications - statusCount("SUBMITTED") - statusCount("WITHDRAWN") },
    { label: "Interviewed or beyond", value: statusCount("INTERVIEW") + statusCount("OFFER") + statusCount("HIRED") },
    { label: "Offer or hired", value: statusCount("OFFER") + statusCount("HIRED") },
    { label: "Hired", value: hires },
  ];

  return (
    <div className="grid gap-8">
      <PageHeader title="Platform overview" description="Live figures from the KAZI database." />

      {pendingVerif + pendingJobs + openReports > 0 && (
        <section aria-label="Needs attention" className="grid gap-3 sm:grid-cols-3">
          <Queue href="/admin/verification" label="Company verifications waiting" count={pendingVerif} />
          <Queue href="/admin/jobs" label="Jobs waiting for review" count={pendingJobs} />
          <Queue href="/admin/reports" label="Open user reports" count={openReports} />
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Job seekers" value={seekers} href="/admin/users?role=JOB_SEEKER" />
        <StatCard label="Employers" value={employers} href="/admin/users?role=EMPLOYER" />
        <StatCard label="Companies" value={companies} hint={`${verified} verified`} href="/admin/companies" />
        <StatCard label="Live jobs" value={publishedJobs} href="/admin/jobs?tab=live" />
        <StatCard label="Applications" value={applications} />
        <StatCard label="Hires recorded" value={hires} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="New sign-ups per week" note={`${signups.length} in 12 weeks`}>
          <ColumnChart data={bucketByWeek(signups.map((s) => s.createdAt), 12)} label="New user sign-ups per week, last 12 weeks" valueLabel="sign-ups" />
        </Panel>
        <Panel title="Applications per week" note={`${appDates.length} in 12 weeks`}>
          <ColumnChart data={bucketByWeek(appDates.map((s) => s.createdAt), 12)} label="Applications submitted per week, last 12 weeks" valueLabel="applications" />
        </Panel>
        <Panel title="Live jobs by category">
          <BarList data={byCategory} label="Live jobs by category" />
        </Panel>
        <Panel title="Hiring funnel" note="All-time applications">
          <BarList data={funnel} label="Applications by furthest stage reached" />
        </Panel>
      </div>

      {audits.length > 0 && (
        <Panel
          title="Recent admin activity"
          note={
            <Link href="/admin/audit" className="font-semibold text-accent-ink hover:underline dark:text-accent">
              Full audit log
            </Link>
          }
        >
          <ul className="divide-y divide-line text-sm">
            {audits.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 py-2.5">
                <span>
                  <span className="font-semibold">{a.actor?.name ?? "System"}</span> <span className="text-muted">{a.action}</span> {a.summary}
                </span>
                <span className="shrink-0 text-muted">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function Queue({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link href={href} className={`flex items-center justify-between rounded-[14px] border p-4 ${count > 0 ? "border-sun/60 bg-sun-soft" : "border-line bg-surface"}`}>
      <span className="text-sm font-semibold">{label}</span>
      <span className="font-display text-2xl font-semibold tabular">{count}</span>
    </Link>
  );
}

function Panel({ title, note, children }: { title: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-sans text-base font-bold tracking-normal">{title}</h2>
        {note && <span className="text-sm text-muted">{note}</span>}
      </div>
      {children}
    </section>
  );
}

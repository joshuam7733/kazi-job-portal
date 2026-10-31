import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { bucketByDay, ColumnChart } from "@/components/app/charts";
import { StatCard } from "@/components/app/stat-card";
import { ApplicationStatusBadge, JobStatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { employerPageContext } from "@/lib/employer";
import { daysAgo, timeAgo } from "@/lib/format";

export const metadata = { title: "Overview" };

export default async function EmployerOverview() {
  const { company } = await employerPageContext();
  const since = daysAgo(30);
  const jobWhere = { companyId: company.id };
  const [activeJobs, totalApps, newApps, reviewing, interviewing, hired, recent, appDates, jobs] = await Promise.all([
    db.job.count({ where: { ...jobWhere, status: "PUBLISHED" } }),
    db.application.count({ where: { job: jobWhere } }),
    db.application.count({ where: { job: jobWhere, status: "SUBMITTED" } }),
    db.application.count({ where: { job: jobWhere, status: { in: ["SCREENING", "SHORTLISTED"] } } }),
    db.application.count({ where: { job: jobWhere, status: "INTERVIEW" } }),
    db.application.count({ where: { job: jobWhere, status: "HIRED" } }),
    db.application.findMany({
      where: { job: jobWhere },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { candidate: { select: { name: true, jobSeekerProfile: { select: { headline: true } } } }, job: { select: { title: true } } },
    }),
    db.application.findMany({ where: { job: jobWhere, createdAt: { gte: since } }, select: { createdAt: true } }),
    db.job.findMany({
      where: { ...jobWhere, status: { in: ["PUBLISHED", "PENDING_REVIEW", "PAUSED", "DRAFT"] } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { applications: true } } },
    }),
  ]);
  const activity = bucketByDay(
    appDates.map((a) => a.createdAt),
    30,
  );

  return (
    <div className="grid gap-8">
      <PageHeader
        title={company.name}
        description="Your hiring at a glance."
        actions={
          <Button asChild>
            <Link href="/employer/jobs/new">
              <Plus /> Post a job
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active jobs" value={activeJobs} href="/employer/jobs?status=PUBLISHED" />
        <StatCard label="Total applications" value={totalApps} href="/employer/applicants" />
        <StatCard label="New candidates" value={newApps} hint="Not yet reviewed" href="/employer/applicants?stage=SUBMITTED" />
        <StatCard label="In review" value={reviewing} href="/employer/applicants?stage=SCREENING" />
        <StatCard label="Interviewing" value={interviewing} href="/employer/applicants?stage=INTERVIEW" />
        <StatCard label="Hired" value={hired} href="/employer/applicants?stage=HIRED" />
      </div>

      <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-sans text-base font-bold tracking-normal">Applications received</h2>
          <p className="text-sm text-muted">Last 30 days, {appDates.length.toLocaleString("en")} total</p>
        </div>
        <ColumnChart className="mt-4" data={activity} label="Applications received per day over the last 30 days" valueLabel="applications" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[14px] border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-sans text-base font-bold tracking-normal">Latest applicants</h2>
            <Link href="/employer/applicants" className="text-sm font-semibold text-accent-ink hover:underline dark:text-accent">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState className="m-5" icon={Users} title="No applicants yet" description="When candidates apply, they'll appear here." />
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((a) => (
                <li key={a.id}>
                  <Link href={`/employer/applicants/${a.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2/60">
                    <Avatar name={a.candidate.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{a.candidate.name}</p>
                      <p className="truncate text-sm text-muted">
                        {a.job.title}, {timeAgo(a.createdAt)}
                      </p>
                    </div>
                    <ApplicationStatusBadge status={a.status} audience="employer" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-[14px] border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-sans text-base font-bold tracking-normal">Your jobs</h2>
            <Link href="/employer/jobs" className="text-sm font-semibold text-accent-ink hover:underline dark:text-accent">
              Manage jobs
            </Link>
          </div>
          {jobs.length === 0 ? (
            <EmptyState
              className="m-5"
              title="Post your first job"
              description="It takes about ten minutes. You can save a draft and finish later."
              action={
                <Button asChild>
                  <Link href="/employer/jobs/new">Post a job</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {jobs.map((j) => (
                <li key={j.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <Link href={`/employer/jobs/${j.id}/pipeline`} className="truncate font-semibold hover:underline">
                      {j.title}
                    </Link>
                    <p className="text-sm text-muted">
                      {j._count.applications} {j._count.applications === 1 ? "applicant" : "applicants"}, {j.viewCount.toLocaleString("en")} views
                    </p>
                  </div>
                  <JobStatusBadge status={j.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

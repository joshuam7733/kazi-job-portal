import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import type { JobStatus } from "@prisma/client";
import { JobStatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { employerPageContext } from "@/lib/employer";
import { JOB_STATUS_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { JobActions } from "./job-actions";
import { SavedToast } from "./saved-toast";

export const metadata = { title: "Jobs" };

const FILTERS: (JobStatus | "ALL")[] = ["ALL", "PUBLISHED", "PENDING_REVIEW", "DRAFT", "PAUSED", "CLOSED", "REJECTED"];

export default async function EmployerJobsPage({ searchParams }: { searchParams: Promise<{ status?: string; saved?: string }> }) {
  const { company } = await employerPageContext();
  const sp = await searchParams;
  const status = FILTERS.includes(sp.status as JobStatus) && sp.status !== "ALL" ? (sp.status as JobStatus) : undefined;
  const [jobs, counts] = await Promise.all([
    db.job.findMany({
      where: { companyId: company.id, ...(status ? { status } : {}) },
      orderBy: { updatedAt: "desc" },
      include: { location: true, _count: { select: { applications: true } } },
    }),
    db.job.groupBy({ by: ["status"], where: { companyId: company.id }, _count: true }),
  ]);
  const count = (s: JobStatus | "ALL") => (s === "ALL" ? counts.reduce((n, c) => n + c._count, 0) : counts.find((c) => c.status === s)?._count ?? 0);

  return (
    <div className="grid gap-6">
      <SavedToast saved={sp.saved} />
      <PageHeader
        title="Jobs"
        description="Create, publish and manage your vacancies."
        actions={
          <Button asChild>
            <Link href="/employer/jobs/new">
              <Plus /> Post a job
            </Link>
          </Button>
        }
      />
      <nav aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-1 border-b border-line">
          {FILTERS.filter((f) => f === "ALL" || count(f) > 0).map((f) => {
            const active = (f === "ALL" && !status) || f === status;
            return (
              <li key={f}>
                <Link
                  href={f === "ALL" ? "/employer/jobs" : `/employer/jobs?status=${f}`}
                  aria-current={active ? "page" : undefined}
                  className={cn("relative inline-flex h-11 items-center gap-2 px-3 text-sm font-semibold text-muted hover:text-ink", active && "text-ink after:absolute after:inset-x-2 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-accent")}
                >
                  {f === "ALL" ? "All" : JOB_STATUS_LABEL[f]}
                  <span className="rounded-full bg-surface-2 px-1.5 text-xs tabular">{count(f)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={status ? `No ${JOB_STATUS_LABEL[status].toLowerCase()} jobs` : "No jobs yet"}
          description="Post a job to start receiving applications."
          action={
            <Button asChild>
              <Link href="/employer/jobs/new">Post a job</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {jobs.map((j) => (
            <li key={j.id} className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-5 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/employer/jobs/${j.id}/pipeline`} className="text-[17px] font-bold hover:underline">
                    {j.title}
                  </Link>
                  <JobStatusBadge status={j.status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {j.location?.city ?? "No location"}
                  {j.deadline ? `, closes ${formatDate(j.deadline)}` : ""}
                  {j.publishedAt ? `, published ${formatDate(j.publishedAt)}` : `, updated ${formatDate(j.updatedAt)}`}
                </p>
                {j.status === "PENDING_REVIEW" && j.moderationNote && <p className="mt-2 text-sm text-[#7a5200] dark:text-sun">In review: {j.moderationNote}.</p>}
                {(j.status === "REJECTED" || j.status === "REMOVED") && j.moderationNote && <p className="mt-2 text-sm text-danger">Moderator note: {j.moderationNote}</p>}
              </div>
              <dl className="flex gap-6 text-sm">
                <div>
                  <dt className="text-muted">Applicants</dt>
                  <dd className="font-display text-xl font-semibold tabular">{j._count.applications}</dd>
                </div>
                <div>
                  <dt className="text-muted">Views</dt>
                  <dd className="font-display text-xl font-semibold tabular">{j.viewCount.toLocaleString("en")}</dd>
                </div>
              </dl>
              <JobActions job={{ id: j.id, slug: j.slug, status: j.status, title: j.title }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

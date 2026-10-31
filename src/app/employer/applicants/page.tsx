import Link from "next/link";
import { Users } from "lucide-react";
import type { ApplicationStatus, Prisma } from "@prisma/client";
import { ApplicationStatusBadge } from "@/components/app/status-badge";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { employerPageContext } from "@/lib/employer";
import { PIPELINE_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Applicants" };
const PAGE_SIZE = 20;
const STAGES = Object.keys(PIPELINE_LABEL) as ApplicationStatus[];

export default async function ApplicantsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { company } = await employerPageContext();
  const sp = await searchParams;
  const stage = STAGES.includes(sp.stage as ApplicationStatus) ? (sp.stage as ApplicationStatus) : undefined;
  const q = sp.q?.trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.ApplicationWhereInput = {
    job: { companyId: company.id, ...(sp.job ? { id: sp.job } : {}) },
    ...(stage ? { status: stage } : {}),
    ...(q ? { candidate: { name: { contains: q, mode: "insensitive" } } } : {}),
  };
  const [apps, total, jobs] = await Promise.all([
    db.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { candidate: { select: { name: true, jobSeekerProfile: { select: { headline: true } } } }, job: { select: { id: true, title: true } } },
    }),
    db.application.count({ where }),
    db.job.findMany({ where: { companyId: company.id, applications: { some: {} } }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const href = (p: number) => {
    const qs = new URLSearchParams();
    if (stage) qs.set("stage", stage);
    if (q) qs.set("q", q);
    if (sp.job) qs.set("job", sp.job);
    if (p > 1) qs.set("page", String(p));
    return `/employer/applicants${qs.toString() ? `?${qs}` : ""}`;
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="Applicants" description="Everyone who has applied to your jobs. Candidate details are only visible to your team." />
      <form className="grid gap-2 sm:grid-cols-[1fr_220px_200px_auto]" role="search" aria-label="Filter applicants">
        <label className="sr-only" htmlFor="ap-q">
          Candidate name
        </label>
        <input id="ap-q" name="q" defaultValue={q} placeholder="Search by candidate name" className="h-11 rounded-[10px] border border-line-strong bg-surface px-3.5" />
        <label className="sr-only" htmlFor="ap-job">
          Job
        </label>
        <select id="ap-job" name="job" defaultValue={sp.job ?? ""} className="h-11 rounded-[10px] border border-line-strong bg-surface px-3">
          <option value="">All jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="ap-stage">
          Stage
        </label>
        <select id="ap-stage" name="stage" defaultValue={stage ?? ""} className="h-11 rounded-[10px] border border-line-strong bg-surface px-3">
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {PIPELINE_LABEL[s]}
            </option>
          ))}
        </select>
        <button className="h-11 rounded-[10px] bg-ink px-5 font-semibold text-ink-contrast">Filter</button>
      </form>
      <p className="text-sm text-muted">
        <span className="font-semibold text-ink tabular">{total}</span> {total === 1 ? "applicant" : "applicants"}
      </p>
      {apps.length === 0 ? (
        <EmptyState icon={Users} title="No applicants match" description="Try a different stage or job." />
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
          <ul className="divide-y divide-line">
            {apps.map((a) => (
              <li key={a.id}>
                <Link href={`/employer/applicants/${a.id}`} className="grid gap-2 px-5 py-4 hover:bg-surface-2/60 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_110px] sm:items-center">
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={a.candidate.name} size={36} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{a.candidate.name}</span>
                      <span className="block truncate text-sm text-muted">{a.candidate.jobSeekerProfile?.headline}</span>
                    </span>
                  </span>
                  <span className="truncate text-sm">{a.job.title}</span>
                  <span>
                    <ApplicationStatusBadge status={a.status} audience="employer" />
                  </span>
                  <span className="text-sm text-muted tabular">{formatDate(a.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} href={href} />
    </div>
  );
}

import Link from "next/link";
import { FileText } from "lucide-react";
import type { ApplicationStatus } from "@prisma/client";
import { ApplicationStatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { CompanyLogo, EmptyState, PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { CANDIDATE_STATUS_FILTERS } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/format";
import { requirePageUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "My applications" };

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requirePageUser(["JOB_SEEKER"]);
  const { status } = await searchParams;
  const filter = CANDIDATE_STATUS_FILTERS.find((f) => f.value === status);
  const [apps, grouped] = await Promise.all([
    db.application.findMany({
      where: { candidateId: user.id, ...(filter ? { status: { in: filter.statuses as unknown as ApplicationStatus[] } } : {}) },
      orderBy: { updatedAt: "desc" },
      include: { job: { select: { title: true, slug: true, company: { select: { name: true, brandColor: true, logoUrl: true } }, location: { select: { city: true } } } } },
    }),
    db.application.groupBy({ by: ["status"], where: { candidateId: user.id }, _count: true }),
  ]);
  const countFor = (statuses: readonly string[]) => grouped.filter((g) => statuses.includes(g.status)).reduce((n, g) => n + g._count, 0);
  const total = grouped.reduce((n, g) => n + g._count, 0);

  return (
    <div className="grid gap-6">
      <PageHeader title="My applications" description="Every job you've applied for, and where each one stands." />
      <nav aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-1 border-b border-line">
          <Tab href="/dashboard/applications" active={!filter} label="All" count={total} />
          {CANDIDATE_STATUS_FILTERS.map((f) => (
            <Tab key={f.value} href={`/dashboard/applications?status=${f.value}`} active={filter?.value === f.value} label={f.label} count={countFor(f.statuses)} />
          ))}
        </ul>
      </nav>

      {apps.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={filter ? `No applications marked “${filter.label}”` : "You haven't applied for any jobs yet"}
          description={filter ? "Applications move between stages as employers review them." : "Find a role you like and apply in a few minutes."}
          action={
            <Button asChild>
              <Link href="/jobs">Find jobs</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="bg-surface-2 text-xs font-semibold text-muted">
              <tr>
                <th scope="col" className="px-5 py-3">Job</th>
                <th scope="col" className="px-5 py-3">Status</th>
                <th scope="col" className="px-5 py-3">Applied</th>
                <th scope="col" className="px-5 py-3">Last update</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-surface-2/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <CompanyLogo name={a.job.company.name} brandColor={a.job.company.brandColor} logoUrl={a.job.company.logoUrl} size={36} />
                      <div className="min-w-0">
                        <p className="font-semibold">{a.job.title}</p>
                        <p className="text-muted">
                          {a.job.company.name}
                          {a.job.location ? `, ${a.job.location.city}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <ApplicationStatusBadge status={a.status} />
                  </td>
                  <td className="px-5 py-4 text-muted tabular">{formatDate(a.createdAt)}</td>
                  <td className="px-5 py-4 text-muted">{timeAgo(a.updatedAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/dashboard/applications/${a.id}`} className="font-semibold text-accent-ink hover:underline dark:text-accent">
                      View<span className="sr-only"> application for {a.job.title}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-line md:hidden">
            {apps.map((a) => (
              <li key={a.id}>
                <Link href={`/dashboard/applications/${a.id}`} className="flex gap-3 p-4">
                  <CompanyLogo name={a.job.company.name} brandColor={a.job.company.brandColor} logoUrl={a.job.company.logoUrl} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.job.title}</p>
                    <p className="text-sm text-muted">{a.job.company.name}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <ApplicationStatusBadge status={a.status} />
                      <span className="text-xs text-muted">Applied {formatDate(a.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Tab({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative inline-flex h-11 items-center gap-2 px-3 text-sm font-semibold text-muted hover:text-ink",
          active && "text-ink after:absolute after:inset-x-2 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-accent",
        )}
      >
        {label}
        <span className="rounded-full bg-surface-2 px-1.5 text-xs tabular">{count}</span>
      </Link>
    </li>
  );
}

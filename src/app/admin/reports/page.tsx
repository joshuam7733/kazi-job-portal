import Link from "next/link";
import { Flag } from "lucide-react";
import { DecisionForm } from "@/components/admin/decision-form";
import { JobStatusBadge } from "@/components/app/status-badge";
import { Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { REPORT_REASON_LABEL } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/format";
import { requireAdminPage } from "@/lib/session";
import { moderateJobAction, resolveReportAction } from "@/server/admin-actions";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdminPage("reports:review");
  const { tab } = await searchParams;
  const closed = tab === "closed";
  const reports = await db.report.findMany({
    where: closed ? { status: { not: "OPEN" } } : { status: "OPEN" },
    orderBy: { createdAt: closed ? "desc" : "asc" },
    take: 50,
    include: {
      job: { select: { id: true, title: true, slug: true, status: true, company: { select: { name: true } }, _count: { select: { reports: true } } } },
      reporter: { select: { name: true, email: true } },
      resolvedBy: { select: { name: true } },
    },
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="User reports" description="Reports from job seekers about listings. Three open reports automatically pause a listing." />
      <div className="flex gap-2">
        {[
          ["", "Open", !closed],
          ["?tab=closed", "Handled", closed],
        ].map(([q, l, a]) => (
          <Link key={String(l)} href={`/admin/reports${q}`} aria-current={a ? "page" : undefined} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${a ? "border-ink bg-ink text-ink-contrast" : "border-line-strong"}`}>
            {l}
          </Link>
        ))}
      </div>
      {reports.length === 0 ? (
        <EmptyState icon={Flag} title={closed ? "No handled reports yet" : "No open reports"} />
      ) : (
        <ul className="grid gap-4">
          {reports.map((r) => (
            <li key={r.id} className="grid gap-5 rounded-[14px] border border-line bg-surface p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  <Badge tone="danger">{REPORT_REASON_LABEL[r.reason]}</Badge>
                  {r.job ? (
                    <>
                      {r.job.status === "PUBLISHED" ? (
                        <Link href={`/jobs/${r.job.slug}`} target="_blank" className="hover:underline">
                          {r.job.title}
                        </Link>
                      ) : (
                        r.job.title
                      )}
                      <JobStatusBadge status={r.job.status} />
                    </>
                  ) : (
                    "Listing deleted"
                  )}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {r.job?.company.name}, reported {timeAgo(r.createdAt)} by {r.reporter ? `${r.reporter.name} (${r.reporter.email})` : "a visitor"}
                  {r.job && r.job._count.reports > 1 ? `, ${r.job._count.reports} reports in total` : ""}
                </p>
                {r.details && <p className="mt-3 whitespace-pre-line rounded-[10px] bg-surface-2 p-3 text-sm">{r.details}</p>}
                {closed && (
                  <p className="mt-3 text-sm text-muted">
                    {r.status === "RESOLVED" ? "Resolved" : "Dismissed"} by {r.resolvedBy?.name ?? "an admin"}
                    {r.resolvedAt ? ` on ${formatDate(r.resolvedAt)}` : ""}
                    {r.resolution ? `: ${r.resolution}` : ""}
                  </p>
                )}
              </div>
              {!closed && (
                <div className="grid content-start gap-4">
                  {r.job && ["PUBLISHED", "PAUSED", "PENDING_REVIEW"].includes(r.job.status) && (
                    <div>
                      <p className="mb-2 text-sm font-semibold">Act on the listing</p>
                      <DecisionForm action={moderateJobAction} hidden={{ id: r.job.id }} choices={[{ name: "op", value: "remove", label: "Remove listing", variant: "danger" }]} notePlaceholder="Reason for removal (sent to the employer)" />
                    </div>
                  )}
                  <div>
                    <p className="mb-2 text-sm font-semibold">Close the report</p>
                    <DecisionForm
                      action={resolveReportAction}
                      hidden={{ id: r.id }}
                      noteLabel="Internal resolution note"
                      notePlaceholder="Internal note (optional)"
                      choices={[
                        { name: "outcome", value: "resolve", label: "Mark resolved", variant: "accent" },
                        { name: "outcome", value: "dismiss", label: "Dismiss", variant: "secondary" },
                      ]}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

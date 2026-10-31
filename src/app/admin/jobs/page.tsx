import Link from "next/link";
import { AlertTriangle, ListChecks } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { DecisionForm } from "@/components/admin/decision-form";
import { JobStatusBadge } from "@/components/app/status-badge";
import { Badge, CompanyLogo, EmptyState, PageHeader } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { formatSalary, timeAgo } from "@/lib/format";
import { requireAdminPage } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { moderateJobAction } from "@/server/admin-actions";
import { FeatureToggle } from "./feature-toggle";

export const metadata = { title: "Job moderation" };
const PAGE_SIZE = 20;

const TABS = [
  { key: "review", label: "Waiting for review" },
  { key: "flagged", label: "Live but flagged" },
  { key: "live", label: "Live" },
  { key: "all", label: "All jobs" },
] as const;

export default async function JobModeration({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; page?: string }> }) {
  await requireAdminPage("jobs:moderate");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab)?.key ?? "review";
  const page = Math.max(1, Number(sp.page) || 1);
  const settings = await getSettings();
  const q = sp.q?.trim().slice(0, 80);
  const base: Prisma.JobWhereInput =
    tab === "review"
      ? { status: "PENDING_REVIEW" }
      : tab === "flagged"
        ? { status: "PUBLISHED", OR: [{ riskScore: { gte: settings.riskThreshold } }, { reports: { some: { status: "OPEN" } } }] }
        : tab === "live"
          ? { status: "PUBLISHED" }
          : {};
  const where: Prisma.JobWhereInput = { ...base, ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { company: { name: { contains: q, mode: "insensitive" } } }] } : {}) };
  const [jobs, total] = await Promise.all([
    db.job.findMany({
      where,
      orderBy: tab === "review" ? [{ riskScore: "desc" }, { createdAt: "asc" }] : [{ updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { company: true, location: true, _count: { select: { reports: { where: { status: "OPEN" } }, applications: true } } },
    }),
    db.job.count({ where }),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader title="Job moderation" description={`Listings scoring ${settings.riskThreshold}+ on automatic screening, or from unverified companies, wait here before going live.`} />
      <nav aria-label="Moderation views" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/jobs?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${tab === t.key ? "border-ink bg-ink text-ink-contrast" : "border-line-strong"}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <form className="flex gap-2" role="search" aria-label="Search jobs">
        <input type="hidden" name="tab" value={tab} />
        <label htmlFor="mod-q" className="sr-only">
          Job title or company
        </label>
        <input id="mod-q" name="q" defaultValue={q} placeholder="Job title or company" className="h-10 flex-1 rounded-[10px] border border-line-strong bg-surface px-3" />
        <button className="h-10 rounded-[10px] bg-ink px-4 text-sm font-semibold text-ink-contrast">Search</button>
      </form>
      {jobs.length === 0 ? (
        <EmptyState icon={ListChecks} title="Nothing here" description={tab === "review" ? "The review queue is empty." : "No jobs match."} />
      ) : (
        <ul className="grid gap-4">
          {jobs.map((j) => (
            <li key={j.id} className="grid gap-5 rounded-[14px] border border-line bg-surface p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <CompanyLogo name={j.company.name} logoUrl={j.company.logoUrl} brandColor={j.company.brandColor} size={40} />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      {j.status === "PUBLISHED" ? (
                        <Link href={`/jobs/${j.slug}`} target="_blank" className="hover:underline">
                          {j.title}
                        </Link>
                      ) : (
                        j.title
                      )}
                      <JobStatusBadge status={j.status} />
                      {j.isSample && <Badge tone="outline">Sample</Badge>}
                    </p>
                    <p className="text-sm text-muted">
                      {j.company.name} ({j.company.verificationStatus.toLowerCase()}), {j.location?.city ?? "no location"}, {formatSalary(j) ?? "pay not shown"}, submitted {timeAgo(j.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone={j.riskScore >= settings.riskThreshold ? "danger" : j.riskScore >= 20 ? "sun" : "neutral"}>Risk score {j.riskScore}</Badge>
                  {j._count.reports > 0 && <Badge tone="danger">{j._count.reports} open reports</Badge>}
                  <span className="text-muted">{j._count.applications} applications</span>
                </div>
                {j.riskFlags.length > 0 && (
                  <ul className="mt-3 grid gap-1 text-sm">
                    {j.riskFlags.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-[#8a4b00] dark:text-sun">
                        <AlertTriangle className="size-3.5 shrink-0" aria-hidden /> {f}
                      </li>
                    ))}
                  </ul>
                )}
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-semibold text-muted hover:text-ink">Read the listing</summary>
                  <div className="mt-2 grid gap-2 whitespace-pre-line rounded-[10px] bg-surface-2 p-3">
                    <p className="font-semibold">{j.summary}</p>
                    <p>{j.description}</p>
                    <p>{j.requirements}</p>
                  </div>
                </details>
                {j.status === "PUBLISHED" && (
                  <div className="mt-3">
                    <FeatureToggle id={j.id} featured={j.isFeatured} />
                  </div>
                )}
              </div>
              <div>
                {j.status === "PENDING_REVIEW" ? (
                  <DecisionForm
                    action={moderateJobAction}
                    hidden={{ id: j.id }}
                    choices={[
                      { name: "op", value: "approve", label: "Approve and publish", variant: "accent" },
                      { name: "op", value: "reject", label: "Reject", variant: "secondary" },
                      { name: "op", value: "remove", label: "Remove as fraudulent", variant: "danger" },
                    ]}
                  />
                ) : j.status === "PUBLISHED" || j.status === "PAUSED" ? (
                  <DecisionForm action={moderateJobAction} hidden={{ id: j.id }} choices={[{ name: "op", value: "remove", label: "Remove listing", variant: "danger" }]} notePlaceholder="Reason for removal (sent to the employer)" />
                ) : j.moderationNote ? (
                  <p className="text-sm text-muted">Note: {j.moderationNote}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} href={(p) => `/admin/jobs?tab=${tab}${q ? `&q=${encodeURIComponent(q)}` : ""}&page=${p}`} />
    </div>
  );
}

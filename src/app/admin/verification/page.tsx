import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";
import { DecisionForm } from "@/components/admin/decision-form";
import { Badge, CompanyLogo, EmptyState, PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { COMPANY_SIZE_LABEL } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/format";
import { requireAdminPage } from "@/lib/session";
import { reviewVerificationAction } from "@/server/admin-actions";

export const metadata = { title: "Company verification" };

export default async function VerificationQueue({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdminPage("companies:verify");
  const { tab } = await searchParams;
  const history = tab === "history";
  const requests = await db.companyVerification.findMany({
    where: history ? { status: { not: "PENDING" } } : { status: "PENDING" },
    orderBy: { createdAt: history ? "desc" : "asc" },
    take: 50,
    include: {
      company: { include: { industry: true, location: true, _count: { select: { jobs: true } } } },
      requestedBy: { select: { name: true, email: true, createdAt: true } },
      reviewer: { select: { name: true } },
    },
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Company verification" description="Check registration details before granting the verified badge. Oldest requests first." />
      <div className="flex gap-2">
        <Tab href="/admin/verification" active={!history}>
          Waiting
        </Tab>
        <Tab href="/admin/verification?tab=history" active={history}>
          Reviewed
        </Tab>
      </div>
      {requests.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={history ? "Nothing reviewed yet" : "No requests waiting"} description={history ? undefined : "New verification requests will appear here."} />
      ) : (
        <ul className="grid gap-4">
          {requests.map((r) => (
            <li key={r.id} className="grid gap-5 rounded-[14px] border border-line bg-surface p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <CompanyLogo name={r.company.name} logoUrl={r.company.logoUrl} brandColor={r.company.brandColor} size={44} />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      {r.company.name}
                      {r.company.type === "AGENCY" && <Badge tone="info">Agency</Badge>}
                      {history && <Badge tone={r.status === "VERIFIED" ? "accent" : "danger"}>{r.status === "VERIFIED" ? "Approved" : "Rejected"}</Badge>}
                    </p>
                    <p className="text-sm text-muted">
                      {[r.company.industry?.name, r.company.location?.city, r.company.size ? COMPANY_SIZE_LABEL[r.company.size] : null].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <Row label="Registration number">{r.registrationNumber ?? "Not provided"}</Row>
                  <Row label="Requested">{timeAgo(r.createdAt)}</Row>
                  <Row label="Requested by">
                    {r.requestedBy?.name} ({r.requestedBy?.email})
                  </Row>
                  <Row label="Account created">{r.requestedBy ? formatDate(r.requestedBy.createdAt) : "—"}</Row>
                  <Row label="Website">
                    {r.company.website ? (
                      <a href={r.company.website} target="_blank" rel="noopener noreferrer nofollow" className="text-accent-ink underline dark:text-accent">
                        {r.company.website}
                      </a>
                    ) : (
                      "None"
                    )}
                  </Row>
                  <Row label="Contact">{[r.company.contactEmail, r.company.contactPhone].filter(Boolean).join(", ") || "—"}</Row>
                </dl>
                {r.notes && <p className="mt-3 whitespace-pre-line rounded-[10px] bg-surface-2 p-3 text-sm">{r.notes}</p>}
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  {r.documentFileId && (
                    <a href={`/api/files/${r.documentFileId}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 font-semibold text-accent-ink hover:underline dark:text-accent">
                      <FileText className="size-4" aria-hidden /> Open supporting document
                    </a>
                  )}
                  <Link href={`/admin/companies?q=${encodeURIComponent(r.company.name)}`} className="font-semibold text-muted hover:text-ink">
                    {r.company._count.jobs} jobs on record
                  </Link>
                </div>
              </div>
              <div>
                {history ? (
                  <p className="text-sm text-muted">
                    Reviewed by {r.reviewer?.name ?? "an admin"}
                    {r.reviewedAt ? ` on ${formatDate(r.reviewedAt)}` : ""}.{r.reviewNote ? ` Note: ${r.reviewNote}` : ""}
                  </p>
                ) : (
                  <DecisionForm
                    action={reviewVerificationAction}
                    hidden={{ id: r.id }}
                    choices={[
                      { name: "decision", value: "approve", label: "Approve and verify", variant: "accent" },
                      { name: "decision", value: "reject", label: "Reject", variant: "danger" },
                    ]}
                    notePlaceholder="Reason (required when rejecting) — sent to the employer"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words font-medium">{children}</dd>
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${active ? "border-ink bg-ink text-ink-contrast" : "border-line-strong"}`}>
      {children}
    </Link>
  );
}

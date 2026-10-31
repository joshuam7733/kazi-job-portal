import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Badge, CompanyLogo, PageHeader } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdminPage } from "@/lib/session";
import { CompanyToggles } from "./company-toggles";

export const metadata = { title: "Companies" };
const PAGE_SIZE = 25;

export default async function AdminCompanies({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdminPage("companies:verify");
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.CompanyWhereInput = q ? { name: { contains: q, mode: "insensitive" } } : {};
  const [companies, total] = await Promise.all([
    db.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { industry: true, _count: { select: { jobs: true, members: true, reports: true } } },
    }),
    db.company.count({ where }),
  ]);
  return (
    <div className="grid gap-6">
      <PageHeader title="Companies" description="Feature trusted employers on the homepage or suspend accounts that break the rules." />
      <form className="flex gap-2" role="search" aria-label="Search companies">
        <label htmlFor="c-q" className="sr-only">
          Company name
        </label>
        <input id="c-q" name="q" defaultValue={q} placeholder="Company name" className="h-10 flex-1 rounded-[10px] border border-line-strong bg-surface px-3" />
        <button className="h-10 rounded-[10px] bg-ink px-4 text-sm font-semibold text-ink-contrast">Search</button>
      </form>
      <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
        {companies.map((c) => (
          <li key={c.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <CompanyLogo name={c.name} logoUrl={c.logoUrl} brandColor={c.brandColor} size={40} />
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <Link href={`/companies/${c.slug}`} target="_blank" className="hover:underline">
                    {c.name}
                  </Link>
                  <Badge tone={c.verificationStatus === "VERIFIED" ? "accent" : c.verificationStatus === "PENDING" ? "sun" : c.verificationStatus === "REJECTED" ? "danger" : "outline"}>
                    {c.verificationStatus.toLowerCase()}
                  </Badge>
                  {c.isSuspended && <Badge tone="danger">Suspended</Badge>}
                  {c.isSample && <Badge tone="outline">Sample</Badge>}
                </p>
                <p className="text-sm text-muted">
                  {c.industry?.name ?? "No industry"}, {c._count.jobs} jobs, {c._count.members} members, {c._count.reports} reports, joined {formatDate(c.createdAt)}
                </p>
              </div>
            </div>
            <CompanyToggles id={c.id} name={c.name} featured={c.isFeatured} suspended={c.isSuspended} />
          </li>
        ))}
      </ul>
      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} href={(p) => `/admin/companies?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`} />
    </div>
  );
}

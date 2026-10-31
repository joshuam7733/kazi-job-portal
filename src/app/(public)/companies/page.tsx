import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Building2, MapPin } from "lucide-react";
import { Badge, CompanyLogo, EmptyState, SampleBadge } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { publicJobWhere } from "@/lib/jobs/filters";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Explore companies hiring in Uganda and East Africa",
  description: "Browse verified employers and recruitment agencies on KAZI, see what they do, and find their open roles.",
  alternates: { canonical: "/companies" },
};

const PAGE_SIZE = 18;

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 80);
  const industry = sp.industry;
  const page = Math.max(1, Math.min(200, Number(sp.page) || 1));
  const where: Prisma.CompanyWhereInput = {
    isSuspended: false,
    verificationStatus: "VERIFIED",
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(industry ? { industry: { slug: industry } } : {}),
  };
  const jobsWhere = publicJobWhere();
  const [companies, total, industries] = await Promise.all([
    db.company.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { industry: true, location: true, _count: { select: { jobs: { where: jobsWhere } } } },
    }),
    db.company.count({ where }),
    db.industry.findMany({ where: { isActive: true, companies: { some: { verificationStatus: "VERIFIED" } } }, orderBy: { name: "asc" } }),
  ]);

  const href = (p: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (industry) qs.set("industry", industry);
    if (p > 1) qs.set("page", String(p));
    return `/companies${qs.toString() ? `?${qs}` : ""}`;
  };

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Explore companies</h1>
      <p className="mt-1 max-w-2xl text-muted">Every company listed here has been verified by the KAZI team.</p>

      <form className="mt-6 flex flex-col gap-2 sm:flex-row" role="search" aria-label="Search companies">
        <label className="sr-only" htmlFor="company-q">
          Company name
        </label>
        <input
          id="company-q"
          name="q"
          defaultValue={q}
          placeholder="Search by company name"
          className="h-11 flex-1 rounded-[10px] border border-line-strong bg-surface px-3.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
        <label className="sr-only" htmlFor="company-industry">
          Industry
        </label>
        <select id="company-industry" name="industry" defaultValue={industry ?? ""} className="h-11 rounded-[10px] border border-line-strong bg-surface px-3 sm:w-56">
          <option value="">All industries</option>
          {industries.map((i) => (
            <option key={i.slug} value={i.slug}>
              {i.name}
            </option>
          ))}
        </select>
        <button className="h-11 rounded-[10px] bg-ink px-5 font-semibold text-ink-contrast">Search</button>
      </form>

      <p className="mt-6 text-sm text-muted">
        <span className="font-semibold text-ink tabular">{total}</span> {total === 1 ? "company" : "companies"}
      </p>
      {companies.length === 0 ? (
        <EmptyState className="mt-4" icon={Building2} title="No companies match" description="Try a different name or industry." />
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <li key={c.id}>
              <Link href={`/companies/${c.slug}`} className="flex h-full flex-col rounded-[14px] border border-line bg-surface p-5 transition-colors hover:border-line-strong">
                <div className="flex items-center gap-3">
                  <CompanyLogo name={c.name} logoUrl={c.logoUrl} brandColor={c.brandColor} size={48} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 font-bold">
                      <span className="truncate">{c.name}</span>
                      <BadgeCheck className="size-4 shrink-0 text-accent" aria-label="Verified" />
                    </p>
                    <p className="truncate text-sm text-muted">{c.industry?.name}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted">{c.tagline}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  {c.location && (
                    <span className="inline-flex items-center gap-1 text-muted">
                      <MapPin className="size-3.5" aria-hidden />
                      {c.location.city}
                    </span>
                  )}
                  {c.type === "AGENCY" && <Badge tone="info">Agency</Badge>}
                  <span className="ml-auto font-semibold text-accent-ink dark:text-accent">
                    {c._count.jobs} open {c._count.jobs === 1 ? "role" : "roles"}
                  </span>
                </div>
                {c.isSample && <SampleBadge className="mt-3 self-start" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} href={href} />
      </div>
    </div>
  );
}

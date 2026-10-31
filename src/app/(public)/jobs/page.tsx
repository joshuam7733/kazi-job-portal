import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { FilterPanel, MobileFilters, type Facets } from "@/components/jobs/filter-panel";
import { JobCard } from "@/components/jobs/job-card";
import { SaveSearchButton } from "@/components/jobs/save-search-button";
import { ResultsToolbar, SearchBar } from "@/components/jobs/search-bar";
import { PendingRegion, SearchStateProvider } from "@/components/jobs/search-state";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { activeFilterCount, filtersToSearchParams, parseJobFilters, publicJobWhere } from "@/lib/jobs/filters";
import { getSavedJobIds, searchJobs } from "@/lib/jobs/queries";
import { getSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = parseJobFilters(await searchParams);
  const [cat, loc] = await Promise.all([
    f.cat ? db.jobCategory.findUnique({ where: { slug: f.cat }, select: { name: true } }) : null,
    f.loc ? db.location.findUnique({ where: { slug: f.loc }, select: { city: true } }) : null,
  ]);
  const what = f.q ? `${f.q} jobs` : cat ? `${cat.name} jobs` : "Jobs";
  const where = loc ? ` in ${loc.city}` : " in Uganda and East Africa";
  const filtered = activeFilterCount(f) > 0 || f.q || f.page > 1;
  return {
    title: `${what}${where}`,
    description: `Browse ${what.toLowerCase()}${where} from verified employers on KAZI. Filter by salary, job type, experience and work arrangement.`,
    alternates: { canonical: "/jobs" },
    // Index the main listing and simple category/location pages; keep deep filter combinations out of the index.
    robots: filtered && !(Object.keys(await searchParams).length === 1 && (f.cat || f.loc)) ? { index: false, follow: true } : undefined,
  };
}

export default async function JobsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = parseJobFilters(raw);
  const user = await getSessionUser();
  const where = publicJobWhere();

  const [{ jobs, total, pageCount }, categories, industries, companies, locations, saved] = await Promise.all([
    searchJobs(filters),
    db.jobCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, _count: { select: { jobs: { where } } } },
    }),
    db.industry.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    db.company.findMany({
      where: { isSuspended: false, jobs: { some: where } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    db.location.findMany({ where: { isActive: true }, orderBy: [{ country: "desc" }, { city: "asc" }], select: { slug: true, city: true, country: true } }),
    getSavedJobIds(user?.role === "JOB_SEEKER" ? user.id : undefined),
  ]);

  const facets: Facets = {
    categories: categories.map((c) => ({ value: c.slug, label: c.name, count: c._count.jobs })),
    industries: industries.map((i) => ({ value: i.slug, label: i.name })),
    companies: companies.map((c) => ({ value: c.slug, label: c.name })),
  };
  const view = raw.view === "grid" ? "grid" : "list";
  const pageHref = (p: number) => {
    const qs = filtersToSearchParams(filters, { page: p > 1 ? String(p) : undefined, view: view === "grid" ? "grid" : undefined });
    return `/jobs${qs.toString() ? `?${qs}` : ""}`;
  };
  const count = activeFilterCount(filters);

  return (
    <SearchStateProvider>
      <div className="border-b border-line bg-surface/60">
        <div className="container-page py-8">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Find jobs</h1>
          <p className="mt-1 text-muted">Search open roles from employers across Uganda and East Africa.</p>
          <div className="mt-6">
            <SearchBar locations={locations.map((l) => ({ slug: l.slug, label: l.country === "Uganda" ? l.city : `${l.city}, ${l.country}` }))} />
          </div>
        </div>
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2">
            <FilterPanel facets={facets} />
          </div>
        </aside>

        <section aria-label="Results" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <MobileFilters facets={facets} activeCount={count} />
            <div className="ml-auto">
              {user?.role === "JOB_SEEKER" ? (
                <SaveSearchButton query={filtersToSearchParams({ ...filters, page: 1, sort: "newest" }).toString()} />
              ) : !user ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/signin?callbackUrl=${encodeURIComponent(pageHref(1))}`}>Sign in to create a job alert</Link>
                </Button>
              ) : null}
            </div>
          </div>
          <ResultsToolbar total={total} />
          <PendingRegion className="mt-4">
            {jobs.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No jobs match this search"
                description="Try a broader keyword, remove a filter, or set up an alert and we'll tell you when matching jobs are posted."
                action={
                  <Button asChild variant="secondary">
                    <Link href="/jobs">Clear search and filters</Link>
                  </Button>
                }
              />
            ) : (
              <div className={cn("grid gap-3", view === "grid" && "md:grid-cols-2")}>
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} saved={saved.has(job.id)} layout={view} />
                ))}
              </div>
            )}
            <div className="mt-8">
              <Pagination page={Math.min(filters.page, pageCount)} pageCount={pageCount} href={pageHref} />
            </div>
          </PendingRegion>
        </section>
      </div>
    </SearchStateProvider>
  );
}

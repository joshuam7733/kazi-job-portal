import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Building2, Calendar, Globe, MapPin, Users } from "lucide-react";
import { JobCard } from "@/components/jobs/job-card";
import { Badge, CompanyLogo, EmptyState, SampleBadge } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { COMPANY_SIZE_LABEL } from "@/lib/constants";
import { publicJobWhere } from "@/lib/jobs/filters";
import { getSavedJobIds, listPublicJobs } from "@/lib/jobs/queries";
import { getSessionUser } from "@/lib/session";

type Props = { params: Promise<{ slug: string }> };

async function getCompany(slug: string) {
  return db.company.findFirst({
    // Unverified companies only get a public page once they have a published (moderated) job.
    where: { slug, isSuspended: false, OR: [{ verificationStatus: "VERIFIED" }, { jobs: { some: publicJobWhere() } }] },
    include: { industry: true, location: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCompany(slug);
  if (!c) return { title: "Company not found", robots: { index: false } };
  return {
    title: `${c.name} — jobs and company profile`,
    description: c.tagline ?? c.description?.slice(0, 160) ?? `Open jobs at ${c.name}`,
    alternates: { canonical: `/companies/${c.slug}` },
    robots: c.verificationStatus === "VERIFIED" ? undefined : { index: false },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const user = await getSessionUser();
  const [jobs, saved] = await Promise.all([
    listPublicJobs({ companyId: company.id }, 50),
    getSavedJobIds(user?.role === "JOB_SEEKER" ? user.id : undefined),
  ]);
  const verified = company.verificationStatus === "VERIFIED";

  return (
    <>
      <div className="h-28 border-b border-line sm:h-36" style={{ background: `linear-gradient(135deg, ${company.brandColor ?? "#0F1B2D"} 0%, ${company.brandColor ?? "#0F1B2D"}cc 100%)` }} aria-hidden />
      <div className="container-page">
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
          <CompanyLogo name={company.name} logoUrl={company.logoUrl} brandColor={company.brandColor} size={88} className="ring-4 ring-canvas" />
          <div className="min-w-0 pb-1">
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">{company.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-muted">
              {company.tagline}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {verified ? (
            <Badge tone="accent">
              <BadgeCheck /> Verified employer
            </Badge>
          ) : (
            <Badge tone="outline">Verification pending</Badge>
          )}
          {company.type === "AGENCY" && <Badge tone="info">Recruitment agency</Badge>}
          {company.isSample && <SampleBadge />}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <section>
              <h2 className="text-2xl font-semibold">About</h2>
              <div className="mt-3 grid gap-3 leading-relaxed text-ink/90">
                {(company.description ?? "This company hasn't added a description yet.").split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
            <section className="mt-12">
              <h2 className="text-2xl font-semibold">
                Open roles <span className="text-muted tabular">({jobs.length})</span>
              </h2>
              <div className="mt-5 grid gap-3">
                {jobs.length === 0 ? (
                  <EmptyState icon={Building2} title="No open roles right now" description="Check back soon, or create a job alert to hear about new roles first." />
                ) : (
                  jobs.map((j) => <JobCard key={j.id} job={j} saved={saved.has(j.id)} />)
                )}
              </div>
            </section>
          </div>
          <aside>
            <dl className="grid gap-4 rounded-[14px] border border-line bg-surface p-6 text-[15px]">
              {company.industry && <Fact icon={Building2} label="Industry" value={company.industry.name} />}
              {company.location && <Fact icon={MapPin} label="Headquarters" value={`${company.location.city}, ${company.location.country}`} />}
              {company.size && <Fact icon={Users} label="Company size" value={COMPANY_SIZE_LABEL[company.size]} />}
              {company.foundedYear && <Fact icon={Calendar} label="Founded" value={String(company.foundedYear)} />}
              {company.website && (
                <div className="flex gap-3">
                  <Globe className="mt-0.5 size-[18px] shrink-0 text-muted" aria-hidden />
                  <div>
                    <dt className="text-sm text-muted">Website</dt>
                    <dd>
                      <a href={company.website} target="_blank" rel="noopener noreferrer nofollow" className="break-all font-semibold text-accent-ink hover:underline dark:text-accent">
                        {company.website.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </aside>
        </div>
      </div>
    </>
  );
}

function Fact({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-[18px] shrink-0 text-muted" aria-hidden />
      <div>
        <dt className="text-sm text-muted">{label}</dt>
        <dd className="font-semibold">{value}</dd>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import {
  BadgeCheck,
  Banknote,
  Briefcase,
  CalendarClock,
  ChevronRight,
  Clock,
  GraduationCap,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { JobCard } from "@/components/jobs/job-card";
import { ReportDialog } from "@/components/jobs/report-dialog";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { ShareButton } from "@/components/jobs/share-button";
import { Button } from "@/components/ui/button";
import { Badge, CompanyLogo, SampleBadge } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { COMPANY_SIZE_LABEL, EDUCATION_LABEL, EMPLOYMENT_TYPE_LABEL, EXPERIENCE_LABEL, WORKPLACE_LABEL } from "@/lib/constants";
import { daysUntil, formatDate, formatSalary, timeAgo } from "@/lib/format";
import { getPublicJob, getRelatedJobs, getSavedJobIds } from "@/lib/jobs/queries";
import { getSessionUser } from "@/lib/session";
import { absoluteUrl, toLines } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await getPublicJob(slug);
  if (!job) return { title: "Job not found", robots: { index: false } };
  const where = job.location ? ` in ${job.location.city}` : "";
  return {
    title: `${job.title} at ${job.company.name}${where}`,
    description: job.summary,
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: { type: "article", title: `${job.title} — ${job.company.name}`, description: job.summary, url: `/jobs/${job.slug}` },
  };
}

const EMPLOYMENT_SCHEMA: Record<string, string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
  INTERNSHIP: "INTERN",
  FREELANCE: "CONTRACTOR",
};

export default async function JobPage({ params }: Props) {
  const { slug } = await params;
  const job = await getPublicJob(slug);
  if (!job) notFound();

  const user = await getSessionUser();
  const [related, saved, application] = await Promise.all([
    getRelatedJobs(job),
    getSavedJobIds(user?.role === "JOB_SEEKER" ? user.id : undefined),
    user?.role === "JOB_SEEKER"
      ? db.application.findUnique({ where: { jobId_candidateId: { jobId: job.id, candidateId: user.id } }, select: { id: true, createdAt: true } })
      : null,
  ]);
  after(() => db.job.update({ where: { id: job.id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined));

  const salary = formatSalary(job, { compact: false });
  const verified = job.company.verificationStatus === "VERIFIED";
  const daysLeft = job.deadline ? daysUntil(job.deadline) : null;
  const skills = job.skills.map((s) => s.skill.name);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: [job.description, "Responsibilities:", job.responsibilities, "Requirements:", job.requirements].join("\n\n"),
    datePosted: (job.publishedAt ?? job.createdAt).toISOString(),
    validThrough: job.deadline?.toISOString(),
    employmentType: EMPLOYMENT_SCHEMA[job.employmentType],
    hiringOrganization: { "@type": "Organization", name: job.company.name, sameAs: job.company.website ?? undefined, logo: job.company.logoUrl ?? undefined },
    jobLocation: job.location
      ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location.city, addressRegion: job.location.region ?? undefined, addressCountry: job.location.country } }
      : undefined,
    jobLocationType: job.workplace === "REMOTE" ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements: job.workplace === "REMOTE" && job.location ? { "@type": "Country", name: job.location.country } : undefined,
    baseSalary:
      job.showSalary && (job.salaryMin || job.salaryMax)
        ? {
            "@type": "MonetaryAmount",
            currency: job.salaryCurrency,
            value: { "@type": "QuantitativeValue", minValue: job.salaryMin ?? undefined, maxValue: job.salaryMax ?? undefined, unitText: job.salaryPeriod === "YEAR" ? "YEAR" : "MONTH" },
          }
        : undefined,
    skills: skills.join(", ") || undefined,
    directApply: true,
    url: absoluteUrl(`/jobs/${job.slug}`),
  };

  const applyPanel = (
    <ApplyActions jobId={job.id} slug={job.slug} saved={saved.has(job.id)} role={user?.role} applicationId={application?.id} title={job.title} />
  );

  return (
    <>
      {/* JSON-LD for Google for Jobs. Escape "<" so content can't break out of the script tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="container-page pb-28 pt-6 lg:pb-0">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-muted">
          <Link href="/jobs" className="hover:text-ink">
            Jobs
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          {job.category && (
            <>
              <Link href={`/jobs?cat=${job.category.slug}`} className="hover:text-ink">
                {job.category.name}
              </Link>
              <ChevronRight className="size-3.5" aria-hidden />
            </>
          )}
          <span className="truncate text-ink" aria-current="page">
            {job.title}
          </span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="min-w-0">
            <header className="border-b border-line pb-8">
              <div className="flex items-start gap-4">
                <CompanyLogo name={job.company.name} logoUrl={job.company.logoUrl} brandColor={job.company.brandColor} size={64} />
                <div className="min-w-0">
                  <h1 className="font-display text-3xl font-semibold leading-tight sm:text-[40px]">{job.title}</h1>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
                    <Link href={`/companies/${job.company.slug}`} className="font-semibold hover:underline">
                      {job.company.name}
                    </Link>
                    {verified ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-ink dark:text-accent">
                        <BadgeCheck className="size-4" aria-hidden /> Verified employer
                      </span>
                    ) : (
                      <Badge tone="outline">Not yet verified</Badge>
                    )}
                    {job.company.type === "AGENCY" && <Badge tone="info">Recruitment agency</Badge>}
                  </p>
                </div>
              </div>
              <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 text-[15px] sm:grid-cols-2">
                <Meta icon={MapPin} label="Location">
                  {job.location ? `${job.location.city}, ${job.location.country}` : "Flexible"} ({WORKPLACE_LABEL[job.workplace]})
                </Meta>
                <Meta icon={Briefcase} label="Job type">
                  {EMPLOYMENT_TYPE_LABEL[job.employmentType]}
                  {job.openings > 1 ? `, ${job.openings} openings` : ""}
                </Meta>
                <Meta icon={TrendingUp} label="Experience">
                  {EXPERIENCE_LABEL[job.experienceLevel]}
                </Meta>
                <Meta icon={GraduationCap} label="Education">
                  {EDUCATION_LABEL[job.educationLevel]}
                </Meta>
                <Meta icon={Banknote} label="Salary">
                  {salary ? <span className="tabular font-semibold">{salary}</span> : <span className="text-muted">Not disclosed</span>}
                </Meta>
                <Meta icon={Clock} label="Posted">
                  {timeAgo(job.publishedAt ?? job.createdAt)}
                </Meta>
              </dl>
              {job.isSample && (
                <p className="mt-6 flex items-center gap-2 text-sm text-muted">
                  <SampleBadge /> This listing is demonstration content and not a real vacancy.
                </p>
              )}
            </header>

            <div className="prose-kazi mt-8 grid gap-10">
              <JobSection title="About the role">
                {job.description.split(/\n{2,}/).map((p, i) => (
                  <p key={i} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </JobSection>
              <ListSection title="What you'll do" items={toLines(job.responsibilities)} />
              <ListSection title="What you'll need" items={toLines(job.requirements)} />
              {job.preferredQualifications && <ListSection title="Nice to have" items={toLines(job.preferredQualifications)} />}
              {job.benefits && <ListSection title="Benefits" items={toLines(job.benefits)} />}
              {skills.length > 0 && (
                <JobSection title="Skills">
                  <ul className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <li key={s}>
                        <Link href={`/jobs?q=${encodeURIComponent(s)}`} className="inline-flex rounded-full bg-surface-2 px-3 py-1.5 text-sm font-semibold hover:bg-line">
                          {s}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </JobSection>
              )}

              <section className="rounded-[14px] border border-line bg-surface p-6">
                <div className="flex items-center gap-3">
                  <CompanyLogo name={job.company.name} logoUrl={job.company.logoUrl} brandColor={job.company.brandColor} size={44} />
                  <div>
                    <h2 className="font-sans text-lg font-bold tracking-normal">About {job.company.name}</h2>
                    <p className="text-sm text-muted">
                      {[job.company.industry?.name, job.company.size ? COMPANY_SIZE_LABEL[job.company.size] : null, job.company.location?.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
                {job.company.description && <p className="mt-4 line-clamp-4 leading-relaxed text-muted">{job.company.description}</p>}
                <Link href={`/companies/${job.company.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-ink hover:underline dark:text-accent">
                  <Users className="size-4" aria-hidden /> View company profile and {job.company._count.jobs} open {job.company._count.jobs === 1 ? "role" : "roles"}
                </Link>
              </section>

              <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
                <p className="flex items-center gap-2 text-sm text-muted">
                  <ShieldCheck className="size-4 text-accent" aria-hidden /> KAZI employers never ask for payment to apply.
                </p>
                <ReportDialog jobId={job.id} />
              </div>
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-[20px] border border-line bg-surface p-6">
              {salary && (
                <>
                  <p className="text-sm text-muted">Salary</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular">{salary}</p>
                </>
              )}
              {job.deadline && (
                <p className={`mt-4 flex items-center gap-2 text-sm ${daysLeft !== null && daysLeft <= 3 ? "font-semibold text-danger" : "text-muted"}`}>
                  <CalendarClock className="size-4" aria-hidden />
                  Apply by {formatDate(job.deadline)}
                  {daysLeft !== null && daysLeft >= 0 && ` (${daysLeft === 0 ? "today" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`})`}
                </p>
              )}
              <div className="mt-6 grid gap-2">{applyPanel}</div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-semibold">Similar jobs</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {related.map((r) => (
                <JobCard key={r.id} job={r} saved={saved.has(r.id)} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <div className="flex-1">
            <ApplyActions jobId={job.id} slug={job.slug} saved={saved.has(job.id)} role={user?.role} applicationId={application?.id} title={job.title} compact />
          </div>
        </div>
      </div>
    </>
  );
}

function ApplyActions({
  jobId,
  slug,
  saved,
  role,
  applicationId,
  title,
  compact,
}: {
  jobId: string;
  slug: string;
  saved: boolean;
  role?: string;
  applicationId?: string;
  title: string;
  compact?: boolean;
}) {
  const primary = applicationId ? (
    <Button asChild size="lg" variant="secondary" className="w-full">
      <Link href={`/dashboard/applications/${applicationId}`}>
        <BadgeCheck className="text-accent" /> Applied — view status
      </Link>
    </Button>
  ) : role && role !== "JOB_SEEKER" ? (
    <p className="rounded-[10px] bg-surface-2 p-3 text-sm text-muted">Sign in with a job seeker account to apply.</p>
  ) : (
    <Button asChild size="lg" variant="accent" className="w-full">
      <Link href={role ? `/jobs/${slug}/apply` : `/signin?callbackUrl=${encodeURIComponent(`/jobs/${slug}/apply`)}`}>Apply Now</Link>
    </Button>
  );
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1">{primary}</div>
        {(!role || role === "JOB_SEEKER") && <SaveJobButton jobId={jobId} saved={saved} />}
      </div>
    );
  }
  return (
    <>
      {primary}
      {(!role || role === "JOB_SEEKER") && <SaveJobButton jobId={jobId} saved={saved} variant="full" />}
      <ShareButton title={title} url={`/jobs/${slug}`} className="w-full" />
    </>
  );
}

function Meta({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-[18px] shrink-0 text-muted" aria-hidden />
      <div>
        <dt className="sr-only">{label}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}

function JobSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 grid gap-3 text-[16px] text-ink/90">{children}</div>
    </section>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <JobSection title={title}>
      <ul className="grid gap-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 leading-relaxed">
            <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-accent" />
            {item}
          </li>
        ))}
      </ul>
    </JobSection>
  );
}

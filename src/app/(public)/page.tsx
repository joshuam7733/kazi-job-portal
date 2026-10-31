import Link from "next/link";
import { BadgeCheck, Globe2, GraduationCap, ShieldCheck } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { HeroBoard } from "@/components/jobs/hero-board";
import { HeroSearch } from "@/components/jobs/hero-search";
import { JobCard } from "@/components/jobs/job-card";
import { SubscribeForm } from "@/components/site/subscribe-form";
import { Button } from "@/components/ui/button";
import { CompanyLogo, SampleBadge } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { EMPLOYMENT_TYPE_LABEL, WORKPLACE_LABEL } from "@/lib/constants";
import { formatSalary } from "@/lib/format";
import { publicJobWhere } from "@/lib/jobs/filters";
import { getSavedJobIds, listPublicJobs } from "@/lib/jobs/queries";
import { getSessionUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";

const FAQ = [
  {
    q: "Is KAZI free for job seekers?",
    a: "Yes. Creating a profile, applying for jobs, saving jobs and setting alerts are free. No genuine employer on KAZI will ever ask you to pay to apply — if one does, report the listing.",
  },
  {
    q: "How does KAZI check employers?",
    a: "Employers submit company registration details for review. Verified companies show a green check next to their name. New listings are also screened automatically for common scam patterns, and risky listings are held for manual review before anyone can see them.",
  },
  {
    q: "Who can see my CV?",
    a: "Only you, and the employers you choose to apply to. Recruiters can't browse or search candidate profiles, and CV files are never publicly accessible.",
  },
  {
    q: "Can I apply from my phone?",
    a: "Yes. Every part of KAZI — search, applications, messages and your dashboard — is designed to work well on mobile, including on slower connections.",
  },
  {
    q: "How do I post a job?",
    a: "Create an employer account, add your company profile and request verification. You can write job drafts straight away; listings from verified companies publish immediately unless they're flagged for review.",
  },
];

export default async function HomePage() {
  const user = await getSessionUser();
  const settings = await getSettings();
  const where = publicJobWhere();

  const [featured, recent, remote, early, categories, locations, companies, articles, liveCount, verifiedCount, saved] = await Promise.all([
    listPublicJobs({ isFeatured: true }, 6),
    listPublicJobs({}, 6),
    listPublicJobs({ workplace: { in: ["REMOTE", "HYBRID"] } }, 4),
    listPublicJobs({ OR: [{ employmentType: "INTERNSHIP" }, { experienceLevel: "ENTRY" }] }, 4),
    db.jobCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true, icon: true, _count: { select: { jobs: { where } } } },
    }),
    db.location.findMany({
      where: { isActive: true },
      select: { city: true, country: true, slug: true, isFeatured: true, _count: { select: { jobs: { where } } } },
    }),
    db.company.findMany({
      where: { verificationStatus: "VERIFIED", isSuspended: false, isFeatured: true },
      take: 6,
      select: { name: true, slug: true, tagline: true, logoUrl: true, brandColor: true, isSample: true, industry: { select: { name: true } }, _count: { select: { jobs: { where } } } },
    }),
    db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 3,
      select: { slug: true, title: true, excerpt: true, readingMinutes: true, category: { select: { name: true } } },
    }),
    db.job.count({ where }),
    db.company.count({ where: { verificationStatus: "VERIFIED", isSuspended: false } }),
    getSavedJobIds(user?.role === "JOB_SEEKER" ? user.id : undefined),
  ]);

  const trending = [...categories].sort((a, b) => b._count.jobs - a._count.jobs).slice(0, 8);
  const cityList = locations.filter((l) => l._count.jobs > 0 || l.isFeatured).sort((a, b) => b._count.jobs - a._count.jobs).slice(0, 10);
  const boardJobs = (featured.length >= 3 ? featured : recent).slice(0, 3).map((j) => ({
    slug: j.slug,
    title: j.title,
    company: j.company.name,
    brandColor: j.company.brandColor,
    logoUrl: j.company.logoUrl,
    verified: j.company.verificationStatus === "VERIFIED",
    place: j.location ? `${j.location.city}, ${WORKPLACE_LABEL[j.workplace]}` : WORKPLACE_LABEL[j.workplace],
    meta: EMPLOYMENT_TYPE_LABEL[j.employmentType],
    salary: formatSalary(j),
  }));
  const hasSample = featured.some((j) => j.isSample) || recent.some((j) => j.isSample);

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden border-b border-line">
        <div className="container-page grid items-center gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:py-20">
          <div>
            <h1 className="max-w-[13ch] font-display text-[44px] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-6xl lg:text-[76px]">
              {settings.heroHeadline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{settings.heroSubtext}</p>
            <div className="mt-8">
              <HeroSearch locations={locations.filter((l) => l.isFeatured || l._count.jobs > 0)} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="mr-1 text-muted">Popular:</span>
              {settings.popularSearches.map((s) => (
                <Link key={s} href={`/jobs?q=${encodeURIComponent(s)}`} className="rounded-full border border-line-strong bg-surface px-3 py-1.5 font-medium hover:border-ink/40">
                  {s}
                </Link>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
              <Link href="/jobs?wp=remote" className="inline-flex items-center gap-2 text-accent-ink hover:underline dark:text-accent">
                <Globe2 className="size-4" aria-hidden /> Remote jobs
              </Link>
              <Link href="/jobs?type=internship" className="inline-flex items-center gap-2 text-accent-ink hover:underline dark:text-accent">
                <GraduationCap className="size-4" aria-hidden /> Internships
              </Link>
              <span className="inline-flex items-center gap-2 text-muted">
                <ShieldCheck className="size-4" aria-hidden /> {verifiedCount} verified employers
              </span>
            </div>
          </div>
          {boardJobs.length > 0 && <HeroBoard jobs={boardJobs} liveCount={liveCount} />}
        </div>
      </section>

      {hasSample && (
        <div className="container-page mt-6 flex items-center gap-2 text-sm text-muted">
          <SampleBadge /> Listings on this page are demonstration content until real employers publish jobs.
        </div>
      )}

      {/* Featured jobs */}
      <Section title="Featured opportunities" description="Roles our team is highlighting this week." href="/jobs?sort=relevance" linkLabel="See all jobs">
        <div className="grid gap-3 md:grid-cols-2">
          {featured.map((job) => (
            <JobCard key={job.id} job={job} saved={saved.has(job.id)} />
          ))}
        </div>
      </Section>

      {/* Categories */}
      <Section title="Trending categories" description="Where employers are hiring most right now." href="/jobs" linkLabel="Browse all categories">
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((c) => (
            <li key={c.slug} className="bg-surface">
              <Link href={`/jobs?cat=${c.slug}`} className="flex h-full items-center gap-3 p-4 transition-colors hover:bg-surface-2">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent-ink">
                  <CategoryIcon name={c.icon} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{c.name}</span>
                  <span className="text-sm text-muted tabular">{c._count.jobs} open {c._count.jobs === 1 ? "role" : "roles"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Locations */}
      <Section title="Jobs by location" description="From Kampala to Kigali — find work close to home or further afield.">
        <ul className="flex flex-wrap gap-2">
          {cityList.map((l) => (
            <li key={l.slug}>
              <Link href={`/jobs?loc=${l.slug}`} className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface py-2 pl-4 pr-2 font-semibold hover:border-ink/40">
                {l.city}
                {l.country !== "Uganda" && <span className="font-normal text-muted">{l.country}</span>}
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs tabular text-muted">{l._count.jobs}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Companies */}
      <Section title="Companies hiring on KAZI" description="Verified employers with open roles." href="/companies" linkLabel="Explore companies">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link key={c.slug} href={`/companies/${c.slug}`} className="flex gap-4 rounded-[14px] border border-line bg-surface p-5 transition-colors hover:border-line-strong">
              <CompanyLogo name={c.name} logoUrl={c.logoUrl} brandColor={c.brandColor} size={48} />
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-bold">
                  <span className="truncate">{c.name}</span>
                  <BadgeCheck className="size-4 shrink-0 text-accent" aria-label="Verified employer" />
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">{c.tagline}</p>
                <p className="mt-2 text-sm font-semibold text-accent-ink dark:text-accent">
                  {c._count.jobs} open {c._count.jobs === 1 ? "role" : "roles"}
                  {c.industry && <span className="font-normal text-muted"> in {c.industry.name}</span>}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Recent */}
      <Section title="Recently posted" href="/jobs" linkLabel="See all new jobs">
        <div className="grid gap-3 md:grid-cols-2">
          {recent.map((job) => (
            <JobCard key={job.id} job={job} saved={saved.has(job.id)} />
          ))}
        </div>
      </Section>

      {/* Remote + early career */}
      <section className="container-page mt-20 grid gap-10 lg:grid-cols-2">
        <div>
          <SubHeading title="Remote and hybrid" href="/jobs?wp=remote,hybrid" />
          <div className="mt-5 grid gap-3">
            {remote.map((job) => (
              <JobCard key={job.id} job={job} saved={saved.has(job.id)} />
            ))}
          </div>
        </div>
        <div>
          <SubHeading title="Internships and graduate roles" href="/jobs?type=internship" />
          <div className="mt-5 grid gap-3">
            {early.map((job) => (
              <JobCard key={job.id} job={job} saved={saved.has(job.id)} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <Section title="How KAZI works">
        <ol className="grid gap-8 md:grid-cols-3">
          {[
            { t: "Create your profile", d: "Add your experience, skills and CV once. It takes about five minutes and you can finish it later." },
            { t: "Find the right roles", d: "Search by title, skill or place, filter by salary and work arrangement, and save searches as alerts." },
            { t: "Apply and track progress", d: "Apply in a few taps and follow every application from submitted to offer in your dashboard." },
          ].map((step, i) => (
            <li key={step.t} className="border-t-2 border-ink pt-5">
              <span className="font-display text-sm font-semibold text-muted tabular">Step {i + 1}</span>
              <h3 className="mt-2 text-xl font-semibold">{step.t}</h3>
              <p className="mt-2 leading-relaxed text-muted">{step.d}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Resources */}
      <Section title="Career advice" description="Practical guides written for job seekers in East Africa." href="/resources" linkLabel="All resources">
        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((a) => (
            <Link key={a.slug} href={`/resources/${a.slug}`} className="group block">
              <p className="text-sm font-semibold text-accent-ink dark:text-accent">{a.category?.name}</p>
              <h3 className="mt-2 text-xl font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{a.title}</h3>
              <p className="mt-2 line-clamp-3 leading-relaxed text-muted">{a.excerpt}</p>
              <p className="mt-3 text-sm text-muted">{a.readingMinutes} min read</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* Employers */}
      <section className="container-page mt-24">
        <div className="grid gap-10 rounded-[20px] bg-ink p-8 text-ink-contrast md:p-12 lg:grid-cols-[1.2fr_1fr] dark:bg-surface dark:text-ink dark:ring-1 dark:ring-line">
          <div>
            <h2 className="text-3xl font-semibold sm:text-4xl">Hiring? Reach candidates who are ready to work.</h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed opacity-80">
              Post jobs, screen applicants with your own questions, and move candidates through a clear pipeline — from applied to hired.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/signup?role=employer">Create employer account</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-ink-contrast hover:bg-white/10 dark:text-ink dark:hover:bg-surface-2">
                <Link href="/employers">How hiring on KAZI works</Link>
              </Button>
            </div>
          </div>
          <ul className="grid content-center gap-4 text-[15px]">
            {[
              "Verified company badge on every listing",
              "Applicant pipeline with private team notes",
              "Screening questions and interview scheduling",
              "Message candidates without sharing personal contacts",
            ].map((t) => (
              <li key={t} className="flex gap-3 border-b border-white/15 pb-4 last:border-0 dark:border-line">
                <BadgeCheck className="mt-0.5 size-5 shrink-0 text-[#3CCB8C]" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ + alerts */}
      <section className="container-page mt-24 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="text-3xl font-semibold">Questions people ask</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden className="text-2xl font-normal leading-none text-muted transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-5 pr-8 leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="self-start rounded-[20px] border border-line bg-surface p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">New jobs, once a week</h2>
          <p className="mt-2 text-muted">A short email with the week&apos;s new roles and one useful piece of career advice. Unsubscribe any time.</p>
          <div className="mt-6">
            <SubscribeForm />
          </div>
          <p className="mt-4 text-sm text-muted">
            Want alerts for a specific search?{" "}
            <Link href="/dashboard/alerts" className="font-semibold text-ink underline underline-offset-2">
              Create a job alert
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

function Section({
  title,
  description,
  href,
  linkLabel,
  children,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container-page mt-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold">{title}</h2>
          {description && <p className="mt-1.5 text-muted">{description}</p>}
        </div>
        {href && (
          <Link href={href} className="text-sm font-semibold text-accent-ink hover:underline dark:text-accent">
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function SubHeading({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-accent-ink hover:underline dark:text-accent">
        See more
      </Link>
    </div>
  );
}

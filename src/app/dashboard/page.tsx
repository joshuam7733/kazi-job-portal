import Link from "next/link";
import { ArrowUpRight, CalendarClock, FileText, Video } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/app/status-badge";
import { StatCard } from "@/components/app/stat-card";
import { JobCard } from "@/components/jobs/job-card";
import { Button } from "@/components/ui/button";
import { CompanyLogo, EmptyState, Progress } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { formatDate, timeAgo } from "@/lib/format";
import { getSavedJobIds, jobCardSelect } from "@/lib/jobs/queries";
import { suggestJobsFor } from "@/lib/jobs/suggest";
import { profileCompleteness } from "@/lib/profile";
import { requirePageUser } from "@/lib/session";

export const metadata = { title: "Overview" };

export default async function SeekerOverview() {
  const user = await requirePageUser(["JOB_SEEKER"]);
  const [dbUser, profile, counts, recentApps, savedJobs, interview, suggested] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true, emailVerified: true } }),
    db.jobSeekerProfile.findUnique({
      where: { userId: user.id },
      include: { _count: { select: { skills: true, experience: true, education: true } } },
    }),
    Promise.all([
      db.application.count({ where: { candidateId: user.id, status: { notIn: ["REJECTED", "WITHDRAWN", "HIRED"] } } }),
      db.application.count({ where: { candidateId: user.id, status: "INTERVIEW" } }),
      db.savedJob.count({ where: { userId: user.id } }),
      db.jobAlert.count({ where: { userId: user.id, isActive: true } }),
      db.resume.count({ where: { userId: user.id } }),
    ]),
    db.application.findMany({
      where: { candidateId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { job: { select: { title: true, slug: true, company: { select: { name: true, brandColor: true, logoUrl: true } } } } },
    }),
    db.savedJob.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 2, include: { job: { select: jobCardSelect } } }),
    db.interview.findFirst({
      where: { application: { candidateId: user.id, status: "INTERVIEW" }, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      include: { application: { include: { job: { include: { company: true } } } } },
    }),
    suggestJobsFor(user.id, 4),
  ]);
  const [active, interviews, saved, alerts, resumes] = counts;
  const completeness = profileCompleteness({
    name: dbUser.name,
    headline: profile?.headline,
    summary: profile?.summary,
    locationText: profile?.locationText,
    experienceLevel: profile?.experienceLevel,
    skills: profile?._count.skills ?? 0,
    experience: profile?._count.experience ?? 0,
    education: profile?._count.education ?? 0,
    resumes,
    preferredRoles: profile?.preferredRoles.length ?? 0,
    links: [profile?.portfolioUrl, profile?.linkedinUrl, profile?.githubUrl].filter(Boolean).length,
  });
  const firstName = dbUser.name?.split(" ")[0];
  const savedIds = await getSavedJobIds(user.id);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
        <p className="mt-1 text-muted">Here&apos;s where your job search stands today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active applications" value={active} href="/dashboard/applications" />
        <StatCard label="Interviews" value={interviews} href="/dashboard/applications?status=interview" />
        <StatCard label="Saved jobs" value={saved} href="/dashboard/saved" />
        <StatCard label="Active alerts" value={alerts} href="/dashboard/alerts" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 rounded-[14px] border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-sans text-base font-bold tracking-normal">Recent applications</h2>
            <Link href="/dashboard/applications" className="text-sm font-semibold text-accent-ink hover:underline dark:text-accent">
              View all
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <EmptyState
              className="m-5"
              icon={FileText}
              title="No applications yet"
              description="When you apply for a job, you can follow its progress here."
              action={
                <Button asChild>
                  <Link href="/jobs">Find jobs</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {recentApps.map((a) => (
                <li key={a.id}>
                  <Link href={`/dashboard/applications/${a.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-surface-2/60">
                    <CompanyLogo name={a.job.company.name} brandColor={a.job.company.brandColor} logoUrl={a.job.company.logoUrl} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{a.job.title}</p>
                      <p className="truncate text-sm text-muted">
                        {a.job.company.name}, updated {timeAgo(a.updatedAt)}
                      </p>
                    </div>
                    <ApplicationStatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid content-start gap-6">
          <section className="rounded-[14px] border border-line bg-surface p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-sans text-base font-bold tracking-normal">Profile strength</h2>
              <span className="font-display text-xl font-semibold tabular">{completeness.score}%</span>
            </div>
            <Progress value={completeness.score} label="Profile completeness" className="mt-3" />
            {completeness.missing.length > 0 ? (
              <ul className="mt-4 grid gap-1.5 text-sm">
                {completeness.missing.slice(0, 3).map((m) => (
                  <li key={m.label}>
                    <Link href={m.href} className="inline-flex items-center gap-1 font-semibold text-accent-ink hover:underline dark:text-accent">
                      {m.label} <ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">Your profile is complete. Employers see everything they need.</p>
            )}
          </section>

          {interview && (
            <section className="rounded-[14px] border border-sun/60 bg-sun-soft p-5">
              <h2 className="flex items-center gap-2 font-sans text-base font-bold tracking-normal">
                <CalendarClock className="size-4" aria-hidden /> Upcoming interview
              </h2>
              <p className="mt-2 font-semibold">{interview.application.job.title}</p>
              <p className="text-sm text-muted">{interview.application.job.company.name}</p>
              <p className="mt-3 flex items-center gap-2 text-sm">
                <Video className="size-4" aria-hidden />
                {formatDate(interview.scheduledAt, "EEE d MMM, HH:mm")} ({interview.durationMins} min)
              </p>
              <Link href={`/dashboard/applications/${interview.applicationId}`} className="mt-3 inline-block text-sm font-semibold underline">
                See interview details
              </Link>
            </section>
          )}
        </div>
      </div>

      {savedJobs.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Recently saved</h2>
            <Link href="/dashboard/saved" className="text-sm font-semibold text-accent-ink hover:underline dark:text-accent">
              All saved jobs
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {savedJobs.map((s) => (
              <JobCard key={s.id} job={s.job} saved />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">Suggested for you</h2>
            <p className="text-sm text-muted">Based on your skills, preferences and applications.</p>
          </div>
          <Link href="/jobs" className="text-sm font-semibold text-accent-ink hover:underline dark:text-accent">
            Browse all jobs
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {suggested.map((j) => (
            <JobCard key={j.id} job={j} saved={savedIds.has(j.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}

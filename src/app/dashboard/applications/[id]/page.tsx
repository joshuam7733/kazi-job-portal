import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Check, FileText, MapPin, MessageSquare, Phone, Video } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { candidateStatusLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { requirePageUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { AppliedBanner } from "./applied-banner";
import { WithdrawButton } from "./withdraw-button";

export const metadata = { title: "Application" };

const STAGES = ["Submitted", "Under review", "Interview", "Offer", "Hired"];

export default async function ApplicationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ applied?: string }> }) {
  const user = await requirePageUser(["JOB_SEEKER"]);
  const { id } = await params;
  const justApplied = (await searchParams).applied === "1";
  // Candidate view deliberately excludes private employer notes.
  const app = await db.application.findFirst({
    where: { id, candidateId: user.id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      coverLetter: true,
      answers: true,
      job: { select: { title: true, slug: true, status: true, company: { select: { name: true, slug: true, brandColor: true, logoUrl: true } }, location: { select: { city: true } } } },
      resume: { select: { label: true, file: { select: { id: true, originalName: true } } } },
      history: { orderBy: { createdAt: "asc" }, select: { toStatus: true, createdAt: true } },
      interviews: { orderBy: { scheduledAt: "asc" }, select: { id: true, scheduledAt: true, durationMins: true, mode: true, location: true, details: true } },
      conversations: { select: { id: true }, take: 1 },
    },
  });
  if (!app) notFound();

  // Collapse internal stages into what the candidate sees, keeping the first time each was reached.
  const timeline: { label: string; at: Date }[] = [];
  for (const h of app.history) {
    const label = candidateStatusLabel(h.toStatus);
    if (!timeline.some((t) => t.label === label)) timeline.push({ label, at: h.createdAt });
  }
  const currentLabel = candidateStatusLabel(app.status);
  const terminal = ["Not selected", "Withdrawn"].includes(currentLabel);
  const reachedIndex = STAGES.indexOf(currentLabel);
  const answers = (Array.isArray(app.answers) ? app.answers : []) as { label: string; answer: string }[];

  return (
    <div className="grid gap-8">
      <Link href="/dashboard/applications" className="text-sm font-semibold text-muted hover:text-ink">
        ← All applications
      </Link>
      {justApplied && <AppliedBanner company={app.job.company.name} title={app.job.title} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <CompanyLogo name={app.job.company.name} brandColor={app.job.company.brandColor} logoUrl={app.job.company.logoUrl} size={56} />
          <div>
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">{app.job.title}</h1>
            <p className="mt-1 text-muted">
              <Link href={`/companies/${app.job.company.slug}`} className="font-semibold text-ink hover:underline">
                {app.job.company.name}
              </Link>
              {app.job.location && (
                <>
                  {" "}
                  <MapPin className="inline size-3.5" aria-hidden /> {app.job.location.city}
                </>
              )}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <ApplicationStatusBadge status={app.status} />
              <span className="text-sm text-muted">Applied {formatDate(app.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {app.conversations[0] && (
            <Button asChild variant="secondary">
              <Link href={`/messages/${app.conversations[0].id}`}>
                <MessageSquare /> Messages
              </Link>
            </Button>
          )}
          {app.job.status === "PUBLISHED" && (
            <Button asChild variant="ghost">
              <Link href={`/jobs/${app.job.slug}`}>View job</Link>
            </Button>
          )}
        </div>
      </div>

      <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-sans text-base font-bold tracking-normal">Progress</h2>
        {terminal ? (
          <p className="mt-3 text-muted">
            {currentLabel === "Withdrawn"
              ? "You withdrew this application."
              : "The employer has decided not to move forward with this application. Keep going — new roles are posted every day."}
          </p>
        ) : (
          <ol className="mt-5 grid gap-4 sm:grid-cols-5 sm:gap-2">
            {STAGES.map((stage, i) => {
              const done = i <= reachedIndex;
              const at = timeline.find((t) => t.label === stage)?.at;
              return (
                <li key={stage} className="flex items-center gap-3 sm:flex-col sm:items-start" aria-current={i === reachedIndex ? "step" : undefined}>
                  <div className="flex items-center gap-2 sm:w-full">
                    <span className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold", done ? "border-accent bg-accent text-white dark:text-ink-contrast" : "border-line-strong text-muted")}>
                      {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
                    </span>
                    <span className={cn("hidden h-0.5 flex-1 rounded-full sm:block", i < reachedIndex ? "bg-accent" : "bg-line", i === STAGES.length - 1 && "invisible")} />
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold", !done && "text-muted")}>{stage}</p>
                    {at && <p className="text-xs text-muted">{formatDate(at)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {app.interviews.map((iv) => (
        <section key={iv.id} className="rounded-[14px] border border-sun/60 bg-sun-soft p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-sans text-base font-bold tracking-normal">
            <CalendarClock className="size-4" aria-hidden /> Interview
          </h2>
          <p className="mt-2 text-lg font-semibold">{formatDate(iv.scheduledAt, "EEEE d MMMM yyyy, HH:mm")}</p>
          <p className="mt-1 flex items-center gap-2 text-sm">
            {iv.mode === "VIDEO" ? <Video className="size-4" /> : iv.mode === "PHONE" ? <Phone className="size-4" /> : <MapPin className="size-4" />}
            {iv.mode === "VIDEO" ? "Video call" : iv.mode === "PHONE" ? "Phone call" : "In person"}, {iv.durationMins} minutes
            {iv.location ? ` — ${iv.location}` : ""}
          </p>
          {iv.details && <p className="mt-3 whitespace-pre-line text-sm">{iv.details}</p>}
        </section>
      ))}

      <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-sans text-base font-bold tracking-normal">What you sent</h2>
        <dl className="mt-4 grid gap-5 text-[15px]">
          <div>
            <dt className="text-sm font-semibold text-muted">CV</dt>
            <dd className="mt-1">
              {app.resume ? (
                <a href={`/api/files/${app.resume.file.id}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 font-semibold text-accent-ink hover:underline dark:text-accent">
                  <FileText className="size-4" aria-hidden /> {app.resume.label} ({app.resume.file.originalName})
                </a>
              ) : (
                <span className="text-muted">CV was deleted</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted">Cover letter</dt>
            <dd className="mt-1 whitespace-pre-line">{app.coverLetter || <span className="text-muted">None</span>}</dd>
          </div>
          {answers.map((a, i) => (
            <div key={i}>
              <dt className="text-sm font-semibold text-muted">{a.label}</dt>
              <dd className="mt-1 whitespace-pre-line">{a.answer || <span className="text-muted">No answer</span>}</dd>
            </div>
          ))}
        </dl>
      </section>

      {!["HIRED", "REJECTED", "WITHDRAWN"].includes(app.status) && (
        <div className="flex flex-col gap-3 rounded-[14px] border border-line p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">No longer interested? Withdrawing lets the employer know and can&apos;t be undone.</p>
          <WithdrawButton applicationId={app.id} jobTitle={app.job.title} />
        </div>
      )}
    </div>
  );
}

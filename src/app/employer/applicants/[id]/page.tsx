import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, ExternalLink, FileText, Lock, Mail, MapPin, Phone } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/app/status-badge";
import { Avatar, Badge } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { employerPageContext } from "@/lib/employer";
import { EDUCATION_LABEL, EXPERIENCE_LABEL, PIPELINE_LABEL } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/format";
import { ApplicantActions, NoteForm } from "./applicant-actions";

export const metadata = { title: "Applicant" };

export default async function ApplicantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await employerPageContext();
  const app = await db.application.findFirst({
    where: { id, job: { companyId: company.id } },
    include: {
      job: { select: { id: true, title: true } },
      resume: { include: { file: true } },
      candidate: {
        select: {
          name: true,
          email: true,
          jobSeekerProfile: {
            include: {
              skills: { include: { skill: true } },
              experience: { orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }] },
              education: { orderBy: { endYear: { sort: "desc", nulls: "first" } } },
            },
          },
        },
      },
      history: { orderBy: { createdAt: "asc" }, include: { changedBy: { select: { name: true } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      interviews: { orderBy: { scheduledAt: "asc" } },
      conversations: { select: { id: true }, take: 1 },
    },
  });
  if (!app) notFound();
  const p = app.candidate.jobSeekerProfile;
  const answers = (Array.isArray(app.answers) ? app.answers : []) as { label: string; answer: string }[];
  const links = [p?.portfolioUrl, p?.linkedinUrl, p?.githubUrl].filter(Boolean) as string[];

  return (
    <div className="grid gap-6">
      <Link href={`/employer/jobs/${app.job.id}/pipeline`} className="text-sm font-semibold text-muted hover:text-ink">
        ← {app.job.title} pipeline
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={app.candidate.name} size={56} />
          <div>
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">{app.candidate.name}</h1>
            {p?.headline && <p className="text-muted">{p.headline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <ApplicationStatusBadge status={app.status} audience="employer" />
              <span className="text-muted">
                Applied for {app.job.title}, {timeAgo(app.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <ApplicantActions
          applicationId={app.id}
          status={app.status}
          conversationId={app.conversations[0]?.id ?? null}
          canMessage={p?.allowEmployerMessages !== false}
          candidateName={app.candidate.name ?? "the candidate"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-6">
          <Card title="Application">
            <dl className="grid gap-5 text-[15px]">
              <div>
                <dt className="text-sm font-semibold text-muted">CV</dt>
                <dd className="mt-1">
                  {app.resume ? (
                    <a href={`/api/files/${app.resume.fileId}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 font-semibold text-accent-ink hover:underline dark:text-accent">
                      <FileText className="size-4" aria-hidden /> {app.resume.file.originalName}
                    </a>
                  ) : (
                    <span className="text-muted">The candidate deleted this CV.</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Cover letter</dt>
                <dd className="mt-1 whitespace-pre-line leading-relaxed">{app.coverLetter || <span className="text-muted">None provided</span>}</dd>
              </div>
              {answers.map((a, i) => (
                <div key={i}>
                  <dt className="text-sm font-semibold text-muted">{a.label}</dt>
                  <dd className="mt-1 whitespace-pre-line">{a.answer || <span className="text-muted">No answer</span>}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {p?.summary && (
            <Card title="Summary">
              <p className="whitespace-pre-line leading-relaxed">{p.summary}</p>
            </Card>
          )}

          <Card title="Experience">
            {p?.experience.length ? (
              <ul className="grid gap-4">
                {p.experience.map((e) => (
                  <li key={e.id}>
                    <p className="font-bold">{e.title}</p>
                    <p className="text-sm">
                      {e.company}
                      {e.location ? `, ${e.location}` : ""}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDate(e.startDate, "MMM yyyy")} – {e.isCurrent ? "Present" : e.endDate ? formatDate(e.endDate, "MMM yyyy") : ""}
                    </p>
                    {e.description && <p className="mt-1 whitespace-pre-line text-sm">{e.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Not added to profile.</p>
            )}
          </Card>

          <Card title="Education">
            {p?.education.length ? (
              <ul className="grid gap-3">
                {p.education.map((e) => (
                  <li key={e.id}>
                    <p className="font-bold">{e.qualification}</p>
                    <p className="text-sm">
                      {e.institution}
                      {e.level ? `, ${EDUCATION_LABEL[e.level]}` : ""}
                      {e.endYear ? `, ${e.endYear}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Not added to profile.</p>
            )}
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card title="Contact and details">
            <ul className="grid gap-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-muted" aria-hidden /> Reply through KAZI messages
              </li>
              {p?.showPhoneToEmployers && p.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-muted" aria-hidden /> {p.phone}
                </li>
              )}
              {p?.locationText && (
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted" aria-hidden /> {p.locationText}
                </li>
              )}
              {p?.experienceLevel && <li className="text-muted">{EXPERIENCE_LABEL[p.experienceLevel]}</li>}
              {links.map((l) => (
                <li key={l}>
                  <a href={l} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 break-all font-semibold text-accent-ink hover:underline dark:text-accent">
                    {l.replace(/^https?:\/\/(www\.)?/, "")} <ExternalLink className="size-3" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
            {p && p.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.skills.map((s) => (
                  <Badge key={s.skillId}>{s.skill.name}</Badge>
                ))}
              </div>
            )}
          </Card>

          {app.interviews.length > 0 && (
            <Card title="Interviews">
              <ul className="grid gap-3 text-sm">
                {app.interviews.map((iv) => (
                  <li key={iv.id} className="flex gap-2">
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    <span>
                      <span className="block font-semibold">{formatDate(iv.scheduledAt, "EEE d MMM yyyy, HH:mm")}</span>
                      {iv.mode.replace("_", " ").toLowerCase()}, {iv.durationMins} min{iv.location ? `, ${iv.location}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card
            title={
              <span className="flex items-center gap-2">
                <Lock className="size-4" aria-hidden /> Private team notes
              </span>
            }
          >
            <p className="-mt-2 mb-4 text-xs text-muted">Never shown to the candidate.</p>
            <NoteForm applicationId={app.id} />
            <ul className="mt-4 grid gap-3">
              {app.notes.map((n) => (
                <li key={n.id} className="rounded-[10px] bg-surface-2 p-3 text-sm">
                  <p className="whitespace-pre-line">{n.body}</p>
                  <p className="mt-1.5 text-xs text-muted">
                    {n.author?.name ?? "Former team member"}, {timeAgo(n.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="History">
            <ol className="grid gap-2 text-sm">
              {app.history.map((h) => (
                <li key={h.id} className="flex justify-between gap-2">
                  <span>
                    {PIPELINE_LABEL[h.toStatus]}
                    {h.changedBy?.name && <span className="text-muted"> by {h.changedBy.name}</span>}
                  </span>
                  <span className="shrink-0 text-muted tabular">{formatDate(h.createdAt, "d MMM")}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
      <h2 className="mb-4 font-sans text-base font-bold tracking-normal">{title}</h2>
      {children}
    </section>
  );
}

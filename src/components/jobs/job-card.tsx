import Link from "next/link";
import { BadgeCheck, Banknote, Briefcase, Clock, MapPin } from "lucide-react";
import { Badge, CompanyLogo, SampleBadge } from "@/components/ui/misc";
import { EMPLOYMENT_TYPE_LABEL, EXPERIENCE_LABEL, WORKPLACE_LABEL } from "@/lib/constants";
import { formatSalary, timeAgo } from "@/lib/format";
import type { JobCardData } from "@/lib/jobs/queries";
import { cn } from "@/lib/utils";
import { SaveJobButton } from "./save-job-button";

export function JobCard({
  job,
  saved,
  layout = "list",
  className,
  showSave = true,
}: {
  job: JobCardData;
  saved?: boolean;
  layout?: "list" | "grid";
  className?: string;
  showSave?: boolean;
}) {
  const salary = formatSalary(job);
  const verified = job.company.verificationStatus === "VERIFIED";
  return (
    <article
      className={cn(
        "group relative flex gap-4 rounded-[14px] border border-line bg-surface p-4 transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-[0_1px_0_var(--line-strong)] sm:p-5",
        layout === "grid" && "flex-col",
        className,
      )}
    >
      <CompanyLogo name={job.company.name} logoUrl={job.company.logoUrl} brandColor={job.company.brandColor} size={layout === "grid" ? 44 : 48} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-sans text-[17px] font-bold leading-snug tracking-normal">
              <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0 after:rounded-[14px] hover:underline hover:underline-offset-2">
                {job.title}
              </Link>
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
              <span className="truncate">{job.company.name}</span>
              {verified && <BadgeCheck className="size-4 shrink-0 text-accent" aria-label="Verified employer" />}
            </p>
          </div>
          {showSave && (
            <div className="relative z-10 -mr-1 -mt-1">
              <SaveJobButton jobId={job.id} saved={Boolean(saved)} />
            </div>
          )}
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
          <li className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden />
            {job.location ? `${job.location.city}, ${job.location.country}` : "Location flexible"}
            <span className="text-ink/80">({WORKPLACE_LABEL[job.workplace]})</span>
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Briefcase className="size-3.5" aria-hidden />
            {EMPLOYMENT_TYPE_LABEL[job.employmentType]}
          </li>
          {salary && (
            <li className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <Banknote className="size-3.5 text-muted" aria-hidden />
              <span className="tabular">{salary}</span>
            </li>
          )}
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {job.isFeatured && <Badge tone="sun">Featured</Badge>}
          <Badge tone="outline">{EXPERIENCE_LABEL[job.experienceLevel]}</Badge>
          {job.skills.slice(0, layout === "grid" ? 2 : 3).map((s) => (
            <Badge key={s.skill.name} tone="neutral" className="font-medium">
              {s.skill.name}
            </Badge>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden />
            Posted {timeAgo(job.publishedAt ?? job.createdAt)}
          </span>
          {job.isSample && <SampleBadge />}
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { CompanyLogo } from "@/components/ui/misc";

type BoardJob = {
  slug: string;
  title: string;
  company: string;
  brandColor: string | null;
  logoUrl: string | null;
  verified: boolean;
  place: string;
  meta: string;
  salary: string | null;
};

const POSES = [
  { rotate: -3, x: 0, y: 0 },
  { rotate: 2, x: 36, y: 118 },
  { rotate: -1, x: 8, y: 236 },
];

/**
 * The one orchestrated moment on the homepage: real published jobs settle into a loose stack.
 * Pure CSS so it renders before hydration; reduced-motion users get the final layout immediately.
 */
export function HeroBoard({ jobs, liveCount }: { jobs: BoardJob[]; liveCount: number }) {
  return (
    <div className="relative mx-auto h-[400px] w-full max-w-[460px] lg:h-[430px]" aria-label="A selection of open jobs" role="group">
      {jobs.slice(0, 3).map((job, i) => (
        <div
          key={job.slug}
          className="hero-card absolute left-0 top-0 w-[calc(100%-40px)]"
          style={
            {
              zIndex: 10 - i,
              "--x": `${POSES[i].x}px`,
              "--y": `${POSES[i].y}px`,
              "--r": `${POSES[i].rotate}deg`,
              animationDelay: `${150 + i * 120}ms`,
            } as React.CSSProperties
          }
        >
          <Link
            href={`/jobs/${job.slug}`}
            className="block rounded-[18px] border border-line bg-surface p-5 shadow-[0_24px_48px_-28px_rgb(15_27_45/0.45)] transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex items-center gap-3">
              <CompanyLogo name={job.company} brandColor={job.brandColor} logoUrl={job.logoUrl} size={40} />
              <div className="min-w-0">
                <p className="truncate font-bold">{job.title}</p>
                <p className="flex items-center gap-1 text-sm text-muted">
                  <span className="truncate">{job.company}</span>
                  {job.verified && <BadgeCheck className="size-3.5 shrink-0 text-accent" aria-label="Verified" />}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <MapPin className="size-3.5" aria-hidden /> {job.place}
              </span>
              {job.salary ? <span className="tabular font-semibold">{job.salary}</span> : <span className="text-muted">{job.meta}</span>}
            </div>
          </Link>
        </div>
      ))}
      <div className="hero-count absolute bottom-0 right-0 z-20 rounded-[14px] bg-ink px-4 py-3 text-ink-contrast shadow-[var(--shadow-overlay)]">
        <p className="font-display text-2xl font-semibold tabular leading-none">{liveCount.toLocaleString("en")}</p>
        <p className="mt-1 text-xs opacity-80">open roles right now</p>
      </div>
    </div>
  );
}

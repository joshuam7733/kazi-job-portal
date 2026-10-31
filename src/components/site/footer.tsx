import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SITE } from "@/lib/constants";

const COLUMNS = [
  {
    title: "Job seekers",
    links: [
      { href: "/jobs", label: "Browse jobs" },
      { href: "/jobs?wp=remote", label: "Remote jobs" },
      { href: "/jobs?type=internship", label: "Internships" },
      { href: "/dashboard/alerts", label: "Job alerts" },
      { href: "/signup", label: "Create a profile" },
    ],
  },
  {
    title: "Employers",
    links: [
      { href: "/employers", label: "Hire with KAZI" },
      { href: "/signup?role=employer", label: "Create employer account" },
      { href: "/employer/jobs/new", label: "Post a job" },
      { href: "/companies", label: "Company directory" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/resources", label: "Career resources" },
      { href: "/resources?category=cv-writing", label: "CV writing" },
      { href: "/resources?category=interviews", label: "Interview preparation" },
      { href: "/resources/spotting-fake-job-adverts", label: "Avoiding job scams" },
    ],
  },
  {
    title: "KAZI",
    links: [
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of use" },
      { href: "/trust", label: "Trust & safety" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-muted">{SITE.tagline} Jobs from verified employers across Uganda and East Africa.</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="font-sans text-sm font-bold tracking-normal">{col.title}</h2>
            <ul className="mt-3 grid gap-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} KAZI Job Portal. Listings marked “Sample data” are demonstration content.</p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}

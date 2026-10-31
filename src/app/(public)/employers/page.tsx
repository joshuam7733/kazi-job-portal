import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ClipboardCheck, KanbanSquare, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { publicJobWhere } from "@/lib/jobs/filters";

export const metadata: Metadata = {
  title: "Hire with KAZI — post jobs and manage applicants",
  description: "Post jobs, screen applicants and manage your hiring pipeline on KAZI, the recruitment platform for Uganda and East Africa.",
  alternates: { canonical: "/employers" },
};

const FEATURES = [
  { icon: BadgeCheck, title: "A verified badge job seekers trust", body: "Submit your registration details once. Verified companies publish straight away and stand out in search." },
  { icon: ClipboardCheck, title: "Screening questions built in", body: "Ask what matters for the role — availability, licences, experience — and read answers next to each CV." },
  { icon: KanbanSquare, title: "A pipeline your whole team can follow", body: "Move candidates from Applied to Hired, leave private notes, and schedule interviews in one place." },
  { icon: MessageSquare, title: "Messages without the inbox chaos", body: "Talk to applicants inside KAZI. Candidates get notified, and nobody's personal number is exposed." },
];

export default async function EmployersPage() {
  const [jobs, applications, companies] = await Promise.all([
    db.job.count({ where: publicJobWhere() }),
    db.application.count(),
    db.company.count({ where: { verificationStatus: "VERIFIED" } }),
  ]);
  return (
    <>
      <section className="border-b border-line">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-[1.2fr_1fr] lg:py-24">
          <div>
            <h1 className="max-w-[16ch] font-display text-5xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl">Hire the right people, faster.</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              KAZI gives employers and recruitment agencies in East Africa a clear, trustworthy way to find candidates and run hiring from first application to signed offer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup?role=employer">Create employer account</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/signin?callbackUrl=/employer">Sign in to your dashboard</Link>
              </Button>
            </div>
          </div>
          <dl className="grid content-center gap-6 border-l-2 border-ink pl-8">
            <Stat value={jobs} label="jobs live on KAZI today" />
            <Stat value={applications} label="applications submitted through KAZI" />
            <Stat value={companies} label="verified employers" />
          </dl>
        </div>
      </section>
      <section className="container-page mt-16 grid gap-x-10 gap-y-12 md:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-accent-soft text-accent-ink">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-2 leading-relaxed text-muted">{body}</p>
            </div>
          </div>
        ))}
      </section>
      <section className="container-page mt-20">
        <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <ShieldCheck className="mt-1 size-6 shrink-0 text-accent" aria-hidden />
            <div>
              <h2 className="text-xl font-semibold">Our standards for listings</h2>
              <p className="mt-1 max-w-2xl text-muted">
                Listings that ask candidates for fees, hide the employer, or promise guaranteed jobs abroad are removed. Read the full policy on our trust page.
              </p>
            </div>
          </div>
          <Button asChild variant="secondary">
            <Link href="/trust">Read listing standards</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block font-display text-4xl font-semibold tabular">{value.toLocaleString("en")}</span>
        <span className="text-muted">{label}</span>
      </dd>
    </div>
  );
}

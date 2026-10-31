import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { jobCardSelect } from "@/lib/jobs/queries";
import { requirePageUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { SavedJobRow } from "./saved-job-row";

export const metadata = { title: "Saved jobs" };

export default async function SavedJobsPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const user = await requirePageUser(["JOB_SEEKER"]);
  const { folder } = await searchParams;
  const [saved, applied] = await Promise.all([
    db.savedJob.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { job: { select: { ...jobCardSelect, status: true, deadline: true } } },
    }),
    db.application.findMany({ where: { candidateId: user.id }, select: { jobId: true } }),
  ]);
  const appliedIds = new Set(applied.map((a) => a.jobId));
  const folders = [...new Set(saved.map((s) => s.folder))].sort();
  const visible = folder ? saved.filter((s) => s.folder === folder) : saved;

  return (
    <div className="grid gap-6">
      <PageHeader title="Saved jobs" description="Jobs you've bookmarked. Organise them into folders and apply when you're ready." />
      {folders.length > 1 && (
        <nav aria-label="Folders" className="flex flex-wrap gap-2">
          <FolderLink href="/dashboard/saved" active={!folder} label={`All (${saved.length})`} />
          {folders.map((f) => (
            <FolderLink key={f} href={`/dashboard/saved?folder=${encodeURIComponent(f)}`} active={folder === f} label={`${f} (${saved.filter((s) => s.folder === f).length})`} />
          ))}
        </nav>
      )}
      {visible.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs yet"
          description="Tap the bookmark on any job to keep it here for later."
          action={
            <Button asChild>
              <Link href="/jobs">Browse jobs</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {visible.map((s) => {
            const open = s.job.status === "PUBLISHED" && (!s.job.deadline || s.job.deadline > new Date());
            return (
              <SavedJobRow
                key={s.id}
                savedId={s.id}
                folder={s.folder}
                folders={folders}
                job={s.job}
                open={open}
                applied={appliedIds.has(s.jobId)}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FolderLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("rounded-full border px-3.5 py-1.5 text-sm font-semibold", active ? "border-ink bg-ink text-ink-contrast" : "border-line-strong bg-surface hover:border-ink/40")}
    >
      {label}
    </Link>
  );
}

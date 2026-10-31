"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ExternalLink, FolderKanban, MoreHorizontal, Pause, Pencil, Play, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { JobStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { deleteDraftAction, setJobStatusAction } from "@/server/employer-actions";

export function JobActions({ job }: { job: { id: string; slug: string; status: JobStatus; title: string } }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string; message?: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else if (res.message) toast.success(res.message);
    });
  const editable = !["REMOVED"].includes(job.status);
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="secondary" size="sm">
        <Link href={`/employer/jobs/${job.id}/pipeline`}>
          <FolderKanban /> Pipeline
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`More actions for ${job.title}`} disabled={pending}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {editable && (
            <DropdownMenuItem asChild>
              <Link href={`/employer/jobs/${job.id}/edit`}>
                <Pencil /> Edit job
              </Link>
            </DropdownMenuItem>
          )}
          {job.status === "PUBLISHED" && (
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${job.slug}`} target="_blank">
                <ExternalLink /> View public listing
              </Link>
            </DropdownMenuItem>
          )}
          {job.status === "PUBLISHED" && (
            <DropdownMenuItem onSelect={() => run(() => setJobStatusAction(job.id, "pause"))}>
              <Pause /> Pause job
            </DropdownMenuItem>
          )}
          {job.status === "PAUSED" && (
            <DropdownMenuItem onSelect={() => run(() => setJobStatusAction(job.id, "resume"))}>
              <Play /> Resume job
            </DropdownMenuItem>
          )}
          {["PUBLISHED", "PAUSED", "PENDING_REVIEW"].includes(job.status) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => run(() => setJobStatusAction(job.id, "close"))}>
                <XCircle /> Close job
              </DropdownMenuItem>
            </>
          )}
          {job.status === "DRAFT" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => run(() => deleteDraftAction(job.id))}>
                <Trash2 /> Delete draft
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

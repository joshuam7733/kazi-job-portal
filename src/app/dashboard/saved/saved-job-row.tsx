"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FolderInput, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, CompanyLogo } from "@/components/ui/misc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/field";
import { EMPLOYMENT_TYPE_LABEL, WORKPLACE_LABEL } from "@/lib/constants";
import { formatSalary } from "@/lib/format";
import type { JobCardData } from "@/lib/jobs/queries";
import { moveSavedJobAction, removeSavedJobAction } from "@/server/job-actions";

export function SavedJobRow({
  savedId,
  folder,
  folders,
  job,
  open,
  applied,
}: {
  savedId: string;
  folder: string;
  folders: string[];
  job: JobCardData;
  open: boolean;
  applied: boolean;
}) {
  const [pending, start] = useTransition();
  const [folderDialog, setFolderDialog] = useState(false);
  const [newFolder, setNewFolder] = useState("");
  const salary = formatSalary(job);

  const move = (f: string) =>
    start(async () => {
      await moveSavedJobAction(savedId, f);
      toast.success(`Moved to “${f}”`);
      setFolderDialog(false);
    });

  return (
    <li className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-4 sm:flex-row sm:items-center sm:p-5" aria-busy={pending}>
      <div className="flex min-w-0 flex-1 gap-4">
        <CompanyLogo name={job.company.name} brandColor={job.company.brandColor} logoUrl={job.company.logoUrl} size={44} />
        <div className="min-w-0">
          <Link href={`/jobs/${job.slug}`} className="font-bold hover:underline">
            {job.title}
          </Link>
          <p className="text-sm text-muted">
            {job.company.name}
            {job.location ? `, ${job.location.city}` : ""} ({WORKPLACE_LABEL[job.workplace]}), {EMPLOYMENT_TYPE_LABEL[job.employmentType]}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone="outline">{folder}</Badge>
            {salary && <Badge tone="neutral">{salary}</Badge>}
            {!open && <Badge tone="danger">No longer accepting applications</Badge>}
            {applied && <Badge tone="accent">Applied</Badge>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {open && !applied && (
          <Button asChild variant="accent" size="sm">
            <Link href={`/jobs/${job.slug}/apply`}>Apply</Link>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`More actions for ${job.title}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {folders
              .filter((f) => f !== folder)
              .map((f) => (
                <DropdownMenuItem key={f} onSelect={() => move(f)}>
                  <FolderInput /> Move to {f}
                </DropdownMenuItem>
              ))}
            <DropdownMenuItem onSelect={() => setFolderDialog(true)}>
              <FolderInput /> Move to new folder…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() =>
                start(async () => {
                  await removeSavedJobAction(savedId);
                  toast.success("Removed from saved jobs");
                })
              }
            >
              <Trash2 /> Remove from saved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={folderDialog} onOpenChange={setFolderDialog}>
        <DialogContent title="Move to a new folder">
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (newFolder.trim()) move(newFolder.trim());
            }}
          >
            <label className="grid gap-1.5 text-sm font-semibold">
              Folder name
              <Input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} maxLength={40} placeholder="e.g. Apply this week" autoFocus />
            </label>
            <Button type="submit" loading={pending} disabled={!newFolder.trim()}>
              Move job
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </li>
  );
}

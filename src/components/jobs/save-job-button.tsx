"use client";

import { useOptimistic, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { toggleSaveJobAction } from "@/server/job-actions";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SaveJobButton({ jobId, saved, variant = "icon" }: { jobId: string; saved: boolean; variant?: "icon" | "full" }) {
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const onClick = () =>
    start(async () => {
      setOptimistic(!optimistic);
      const res = await toggleSaveJobAction(jobId);
      if (res.error === "signin") {
        router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.saved ? "Job saved" : "Removed from saved jobs", {
        action: res.saved ? { label: "View saved", onClick: () => router.push("/dashboard/saved") } : undefined,
      });
    });

  const label = optimistic ? "Remove from saved jobs" : "Save job";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={optimistic}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-surface px-4 text-sm font-semibold hover:bg-surface-2"
      >
        <Bookmark className={cn("size-4", optimistic && "fill-accent text-accent")} aria-hidden />
        {optimistic ? "Saved" : "Save job"}
      </button>
    );
  }

  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={optimistic}
        aria-label={label}
        className="inline-flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <Bookmark className={cn("size-[18px] transition-transform duration-150", optimistic && "scale-110 fill-accent text-accent")} />
      </button>
    </Tooltip>
  );
}

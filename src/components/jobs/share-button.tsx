"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ title, url, className }: { title: string; url: string; className?: string }) {
  const onClick = async () => {
    const full = new URL(url, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, url: full });
        return;
      } catch {
        // dismissed — fall back to copying
      }
    }
    try {
      await navigator.clipboard.writeText(full);
      toast.success("Link copied", { description: "Share it with someone who'd be a great fit." });
    } catch {
      toast.error("Couldn't copy the link. Copy it from the address bar instead.");
    }
  };
  return (
    <Button type="button" variant="secondary" onClick={onClick} className={className}>
      <Share2 /> Share job
    </Button>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, [string, string?]> = {
  draft: ["Draft saved", "Finish it any time from your jobs list."],
  published: ["Job published", "It's live in search now."],
  review: ["Submitted for review", "Our team will check it shortly. We'll notify you when it's live."],
};

/** Shows a confirmation after the job form redirects back, then cleans the URL. */
export function SavedToast({ saved }: { saved?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);
  useEffect(() => {
    if (!saved || shown.current || !MESSAGES[saved]) return;
    shown.current = true;
    const [title, description] = MESSAGES[saved];
    toast.success(title, { description });
    router.replace(pathname, { scroll: false });
  }, [saved, router, pathname]);
  return null;
}

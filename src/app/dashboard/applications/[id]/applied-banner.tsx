"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Submission confirmation shown once, right after applying. */
export function AppliedBanner({ company, title }: { company: string; title: string }) {
  return (
    <section role="status" className="flex flex-col items-start gap-4 rounded-[20px] border border-accent/40 bg-accent-soft p-6 sm:flex-row sm:items-center">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-white dark:text-ink-contrast"
      >
        <Check className="size-6" strokeWidth={3} aria-hidden />
      </motion.span>
      <div className="flex-1">
        <h2 className="font-display text-2xl font-semibold">Application sent</h2>
        <p className="mt-1 text-ink/80">
          {company} has your application for {title}. We&apos;ll notify you when your status changes.
        </p>
      </div>
      <Button asChild variant="secondary">
        <Link href="/jobs">Find more jobs</Link>
      </Button>
    </section>
  );
}

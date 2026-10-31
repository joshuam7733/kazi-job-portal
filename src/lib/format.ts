import { formatDistanceToNowStrict, format } from "date-fns";
import type { SalaryPeriod } from "@prisma/client";

export function compactMoney(amount: number) {
  if (amount >= 1_000_000) return `${+(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return amount.toLocaleString("en");
}

export function formatSalary(
  job: { salaryMin: number | null; salaryMax: number | null; salaryCurrency: string; salaryPeriod: SalaryPeriod; showSalary?: boolean },
  { compact = true }: { compact?: boolean } = {},
) {
  if (job.showSalary === false || (!job.salaryMin && !job.salaryMax)) return null;
  const fmt = (n: number) => (compact ? compactMoney(n) : n.toLocaleString("en"));
  const period = job.salaryPeriod === "YEAR" ? "/yr" : "/mo";
  if (job.salaryMin && job.salaryMax && job.salaryMin !== job.salaryMax)
    return `${job.salaryCurrency} ${fmt(job.salaryMin)}–${fmt(job.salaryMax)}${period}`;
  return `${job.salaryCurrency} ${fmt((job.salaryMin ?? job.salaryMax)!)}${period}`;
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  return `${formatDistanceToNowStrict(d)} ago`;
}

export function formatDate(date: Date | string, pattern = "d MMM yyyy") {
  return format(typeof date === "string" ? new Date(date) : date, pattern);
}

/** The moment `days` days before now (or after, for negative values). */
export function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

export function daysUntil(date: Date) {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

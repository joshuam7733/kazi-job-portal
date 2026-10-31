import "server-only";
import type { AlertFrequency, JobAlert } from "@prisma/client";
import { db } from "@/lib/db";
import { buildJobWhere, filtersToSearchParams, parseJobFilters } from "@/lib/jobs/filters";
import { sendMail } from "@/lib/mail";
import { layout } from "@/lib/mail/templates";
import { notify } from "@/lib/notify";

export function alertFilters(alert: Pick<JobAlert, "filters">) {
  const raw = (alert.filters ?? {}) as Record<string, string | string[]>;
  return parseJobFilters(Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : String(v)])));
}

export function alertSearchUrl(alert: Pick<JobAlert, "filters">) {
  const qs = filtersToSearchParams(alertFilters(alert)).toString();
  return `/jobs${qs ? `?${qs}` : ""}`;
}

/** Sends alerts that are due for the given frequency. Returns how many users were notified. */
export async function runJobAlerts(frequency: Exclude<AlertFrequency, "INSTANT">, now = new Date()) {
  const windowMs = frequency === "DAILY" ? 86_400_000 : 7 * 86_400_000;
  const due = await db.jobAlert.findMany({
    where: {
      isActive: true,
      frequency,
      OR: [{ lastSentAt: null }, { lastSentAt: { lte: new Date(now.getTime() - windowMs + 3_600_000) } }],
      user: { status: "ACTIVE" },
    },
    include: { user: true },
  });

  let sent = 0;
  for (const alert of due) {
    const since = alert.lastSentAt ?? alert.createdAt;
    const where = { AND: [buildJobWhere({ ...alertFilters(alert), page: 1 }, now), { publishedAt: { gt: since } }] };
    const jobs = await db.job.findMany({ where, orderBy: { publishedAt: "desc" }, take: 10, include: { company: true } });
    await db.jobAlert.update({ where: { id: alert.id }, data: { lastSentAt: now } });
    if (jobs.length === 0) continue;

    const link = alertSearchUrl(alert);
    await notify({
      userId: alert.userId,
      type: "JOB_ALERT",
      title: `${jobs.length} new ${jobs.length === 1 ? "job matches" : "jobs match"} “${alert.name}”`,
      body: jobs.slice(0, 3).map((j) => `${j.title} — ${j.company.name}`).join("\n"),
      link,
    });
    if (alert.user.emailJobAlerts) {
      const { html, text } = layout({
        heading: `New jobs for “${alert.name}”`,
        body: jobs.map((j) => `• ${j.title} — ${j.company.name}`).join("\n"),
        cta: { label: "See all matching jobs", href: link },
      });
      await sendMail({ to: alert.user.email, subject: `${jobs.length} new jobs for “${alert.name}”`, html, text });
    }
    sent++;
  }
  return sent;
}

/** Called when a job is published: notifies users with matching INSTANT alerts. */
export async function notifyInstantAlerts(jobId: string) {
  const alerts = await db.jobAlert.findMany({ where: { isActive: true, frequency: "INSTANT", user: { status: "ACTIVE" } } });
  if (alerts.length === 0) return 0;
  const job = await db.job.findUnique({ where: { id: jobId }, include: { company: true } });
  if (!job) return 0;
  let count = 0;
  for (const alert of alerts) {
    const match = await db.job.count({ where: { AND: [{ id: jobId }, buildJobWhere({ ...alertFilters(alert), page: 1 })] } });
    if (!match) continue;
    await notify({
      userId: alert.userId,
      type: "JOB_ALERT",
      title: `New match for “${alert.name}”`,
      body: `${job.title} — ${job.company.name}`,
      link: `/jobs/${job.slug}`,
      email: true,
    });
    await db.jobAlert.update({ where: { id: alert.id }, data: { lastSentAt: new Date() } });
    count++;
  }
  return count;
}

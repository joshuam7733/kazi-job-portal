import "server-only";
import type { Company } from "@prisma/client";
import { db } from "@/lib/db";
import { notifyInstantAlerts } from "@/lib/alerts";
import { getSettings } from "@/lib/settings";
import { scoreJobRisk, type RiskInput } from "./risk";

/**
 * Decides whether a submitted job can go live immediately or needs moderation.
 * Pure decision logic lives in `publishDecision` for testing.
 */
export function publishDecision(opts: { companyVerified: boolean; requireApproval: boolean; riskScore: number; threshold: number }) {
  if (!opts.companyVerified) return { status: "PENDING_REVIEW" as const, reason: "Company not yet verified" };
  if (opts.requireApproval) return { status: "PENDING_REVIEW" as const, reason: "All listings are reviewed before publishing" };
  if (opts.riskScore >= opts.threshold) return { status: "PENDING_REVIEW" as const, reason: "Flagged by automatic screening" };
  return { status: "PUBLISHED" as const, reason: null };
}

export async function evaluateJob(company: Company, input: Omit<RiskInput, "companyVerified" | "companyAgeDays">) {
  const settings = await getSettings();
  const risk = scoreJobRisk({
    ...input,
    companyVerified: company.verificationStatus === "VERIFIED",
    companyAgeDays: Math.floor((Date.now() - company.createdAt.getTime()) / 86_400_000),
  });
  const decision = publishDecision({
    companyVerified: company.verificationStatus === "VERIFIED",
    requireApproval: settings.requireJobApproval,
    riskScore: risk.score,
    threshold: settings.riskThreshold,
  });
  return { risk, decision };
}

/** Side effects when a job goes live. */
export async function onJobPublished(jobId: string) {
  await notifyInstantAlerts(jobId).catch((e) => console.error("[alerts] instant alert failed", e));
}

export async function notifyAdminsOfReviewQueue(title: string, body: string, link: string) {
  const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE", adminRole: { in: ["SUPER_ADMIN", "MODERATOR"] } }, select: { id: true } });
  if (admins.length === 0) return;
  await db.notification.createMany({ data: admins.map((a) => ({ userId: a.id, type: "JOB_MODERATION" as const, title, body, link })) });
}

"use server";

import type { AdminRole, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { runJobAlerts } from "@/lib/alerts";
import { audit } from "@/lib/audit";
import { onJobPublished } from "@/lib/jobs/publish";
import { sendMail } from "@/lib/mail";
import { layout } from "@/lib/mail/templates";
import { notify, notifyMany } from "@/lib/notify";
import { hashPassword } from "@/lib/password";
import { requireAdmin } from "@/lib/session";
import { saveSettings, settingsSchema } from "@/lib/settings";
import { saveUpload } from "@/lib/storage";
import { createAuthToken } from "@/lib/tokens";
import { randomSuffix, slugify } from "@/lib/utils";
import { handleActionError, zodFail, type ActionState } from "./action-utils";

const note = (fd: FormData) => String(fd.get("note") ?? "").trim().slice(0, 1000);

// ─── Company verification ───────────────────────────────────────────────────

export async function reviewVerificationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin("companies:verify");
    const id = String(fd.get("id"));
    const decision = fd.get("decision") === "approve" ? "VERIFIED" : "REJECTED";
    const reviewNote = note(fd);
    if (decision === "REJECTED" && reviewNote.length < 5) return { fieldErrors: { note: ["Tell the employer why, so they can fix it"] } };
    const req = await db.companyVerification.findUnique({ where: { id }, include: { company: { include: { members: true } } } });
    if (!req || req.status !== "PENDING") return { error: "This request has already been reviewed." };
    await db.$transaction([
      db.companyVerification.update({ where: { id }, data: { status: decision, reviewerId: admin.id, reviewNote: reviewNote || null, reviewedAt: new Date() } }),
      db.company.update({ where: { id: req.companyId }, data: { verificationStatus: decision, verifiedAt: decision === "VERIFIED" ? new Date() : null } }),
    ]);
    await Promise.all(
      req.company.members.map((m) =>
        notify({
          userId: m.userId,
          type: "COMPANY_VERIFICATION",
          title: decision === "VERIFIED" ? `${req.company.name} is now verified` : `Verification for ${req.company.name} wasn't approved`,
          body: decision === "VERIFIED" ? "Your listings now show the verified badge and publish without manual review." : reviewNote,
          link: "/employer/company#verification",
          email: true,
        }),
      ),
    );
    await audit({ actorId: admin.id, action: decision === "VERIFIED" ? "company.verify" : "company.reject_verification", entityType: "Company", entityId: req.companyId, summary: req.company.name, metadata: { note: reviewNote } });
    revalidatePath("/admin/verification");
    revalidatePath("/admin");
    return { ok: true, message: decision === "VERIFIED" ? "Company verified." : "Request rejected and the employer notified." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function setCompanyFlagsAction(companyId: string, flags: { isSuspended?: boolean; isFeatured?: boolean }): Promise<ActionState> {
  try {
    const admin = await requireAdmin("companies:verify");
    const data: Prisma.CompanyUpdateInput = {};
    if (typeof flags.isSuspended === "boolean") data.isSuspended = flags.isSuspended;
    if (typeof flags.isFeatured === "boolean") data.isFeatured = flags.isFeatured;
    const company = await db.company.update({ where: { id: companyId }, data, include: { members: true } });
    if (typeof flags.isSuspended === "boolean") {
      await Promise.all(
        company.members.map((m) =>
          notify({
            userId: m.userId,
            type: "SYSTEM",
            title: flags.isSuspended ? `${company.name} has been suspended` : `${company.name} has been reinstated`,
            body: flags.isSuspended ? "Your listings are hidden while we review the account. Contact support for details." : "Your listings are visible again.",
            email: true,
          }),
        ),
      );
    }
    await audit({ actorId: admin.id, action: "company.update_flags", entityType: "Company", entityId: companyId, summary: company.name, metadata: flags });
    revalidatePath("/admin/companies");
    return { ok: true, message: "Company updated." };
  } catch (err) {
    return handleActionError(err);
  }
}

// ─── Job moderation ─────────────────────────────────────────────────────────

export async function moderateJobAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin("jobs:moderate");
    const id = String(fd.get("id"));
    const op = String(fd.get("op"));
    const reason = note(fd);
    const job = await db.job.findUnique({ where: { id }, include: { company: { include: { members: true } } } });
    if (!job) return { error: "Job not found." };
    if ((op === "reject" || op === "remove") && reason.length < 5) return { fieldErrors: { note: ["Give the employer a reason"] } };

    let data: Prisma.JobUpdateInput;
    let title: string;
    if (op === "approve") {
      data = { status: "PUBLISHED", publishedAt: job.publishedAt ?? new Date(), moderationNote: null };
      title = `“${job.title}” is live`;
    } else if (op === "reject") {
      data = { status: "REJECTED", moderationNote: reason };
      title = `“${job.title}” wasn't approved`;
    } else if (op === "remove") {
      data = { status: "REMOVED", moderationNote: reason, closedAt: new Date() };
      title = `“${job.title}” was removed by KAZI`;
    } else return { error: "Unknown action." };

    await db.job.update({ where: { id }, data });
    if (op === "approve") await onJobPublished(id);
    await Promise.all(
      job.company.members.map((m) =>
        notify({ userId: m.userId, type: "JOB_MODERATION", title, body: op === "approve" ? "It's now visible in search." : reason, link: "/employer/jobs", email: true }),
      ),
    );
    await audit({ actorId: admin.id, action: `job.${op}`, entityType: "Job", entityId: id, summary: `${job.title} — ${job.company.name}`, metadata: { reason } });
    revalidatePath("/admin/jobs");
    revalidatePath("/admin");
    revalidatePath("/jobs");
    return { ok: true, message: op === "approve" ? "Job approved and published." : op === "reject" ? "Job rejected." : "Job removed." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function toggleJobFeaturedAction(id: string, isFeatured: boolean): Promise<ActionState> {
  try {
    const admin = await requireAdmin("jobs:moderate");
    const job = await db.job.update({ where: { id }, data: { isFeatured } });
    await audit({ actorId: admin.id, action: isFeatured ? "job.feature" : "job.unfeature", entityType: "Job", entityId: id, summary: job.title });
    revalidatePath("/admin/jobs");
    revalidatePath("/");
    return { ok: true, message: isFeatured ? "Job featured on the homepage." : "Job no longer featured." };
  } catch (err) {
    return handleActionError(err);
  }
}

// ─── Reports ────────────────────────────────────────────────────────────────

export async function resolveReportAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin("reports:review");
    const id = String(fd.get("id"));
    const outcome = fd.get("outcome") === "dismiss" ? "DISMISSED" : "RESOLVED";
    const resolution = note(fd);
    const report = await db.report.findUnique({ where: { id } });
    if (!report || report.status !== "OPEN") return { error: "This report has already been handled." };
    await db.report.update({ where: { id }, data: { status: outcome, resolution: resolution || null, resolvedById: admin.id, resolvedAt: new Date() } });
    if (report.reporterId) {
      await notify({
        userId: report.reporterId,
        type: "SYSTEM",
        title: "Thanks for your report",
        body: outcome === "RESOLVED" ? "We reviewed the listing you reported and took action." : "We reviewed the listing you reported and didn't find a policy problem.",
      });
    }
    await audit({ actorId: admin.id, action: `report.${outcome.toLowerCase()}`, entityType: "Report", entityId: id, metadata: { resolution } });
    revalidatePath("/admin/reports");
    return { ok: true, message: outcome === "RESOLVED" ? "Report resolved." : "Report dismissed." };
  } catch (err) {
    return handleActionError(err);
  }
}

// ─── Users & admins ─────────────────────────────────────────────────────────

export async function setUserStatusAction(userId: string, status: "ACTIVE" | "SUSPENDED"): Promise<ActionState> {
  try {
    const admin = await requireAdmin("users:manage");
    if (userId === admin.id) return { error: "You can't change your own status." };
    const target = await db.user.findUnique({ where: { id: userId } });
    if (!target) return { error: "User not found." };
    if (target.role === "ADMIN" && admin.adminRole !== "SUPER_ADMIN") return { error: "Only super admins can suspend administrators." };
    // Bumping sessionVersion signs the user out everywhere immediately.
    await db.user.update({ where: { id: userId }, data: { status, sessionVersion: { increment: 1 } } });
    await audit({ actorId: admin.id, action: status === "SUSPENDED" ? "user.suspend" : "user.reactivate", entityType: "User", entityId: userId, summary: target.email });
    revalidatePath("/admin/users");
    return { ok: true, message: status === "SUSPENDED" ? "User suspended and signed out." : "User reactivated." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function setAdminRoleAction(userId: string, adminRole: AdminRole | "NONE"): Promise<ActionState> {
  try {
    const admin = await requireAdmin("admins:manage");
    if (userId === admin.id) return { error: "You can't change your own admin role." };
    const target = await db.user.findUnique({ where: { id: userId } });
    if (!target) return { error: "User not found." };
    if (target.role !== "ADMIN") return { error: "Only administrator accounts have admin roles. Invite a new admin instead." };
    if (adminRole === "NONE") {
      await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED", sessionVersion: { increment: 1 } } });
    } else {
      await db.user.update({ where: { id: userId }, data: { adminRole, sessionVersion: { increment: 1 } } });
    }
    await audit({ actorId: admin.id, action: "admin.set_role", entityType: "User", entityId: userId, summary: target.email, metadata: { adminRole } });
    revalidatePath("/admin/users");
    return { ok: true, message: adminRole === "NONE" ? "Admin access revoked." : "Admin role updated." };
  } catch (err) {
    return handleActionError(err);
  }
}

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  adminRole: z.enum(["SUPER_ADMIN", "MODERATOR", "CONTENT_EDITOR", "SUPPORT"]),
});

export async function inviteAdminAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = inviteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const admin = await requireAdmin("admins:manage");
    if (await db.user.findUnique({ where: { email: parsed.data.email } })) return { fieldErrors: { email: ["An account already uses this email"] } };
    // Random unusable password; the invitee sets their own through the reset link.
    const user = await db.user.create({
      data: { ...parsed.data, role: "ADMIN", passwordHash: await hashPassword(randomSuffix(32)), onboardedAt: new Date() },
    });
    const token = await createAuthToken(user.email, "reset-password", 60 * 48);
    const { html, text } = layout({
      heading: "You've been invited to administer KAZI",
      body: `${admin.name ?? "An administrator"} added you as a KAZI administrator. Choose a password to activate your account. This link expires in 48 hours.`,
      cta: { label: "Set your password", href: `/reset-password?token=${token}` },
    });
    await sendMail({ to: user.email, subject: "Your KAZI administrator account", html, text });
    await audit({ actorId: admin.id, action: "admin.invite", entityType: "User", entityId: user.id, summary: user.email, metadata: { adminRole: parsed.data.adminRole } });
    revalidatePath("/admin/users");
    return { ok: true, message: `Invitation sent to ${user.email}.` };
  } catch (err) {
    return handleActionError(err);
  }
}

// ─── Taxonomy ───────────────────────────────────────────────────────────────

const nameSchema = z.string().trim().min(2, "Enter a name").max(60);

export async function saveCategoryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = z.object({ id: z.string().optional(), name: nameSchema, icon: z.string().max(40).optional(), sortOrder: z.coerce.number().int().min(0).max(999).default(0) }).safeParse({
    id: fd.get("id") || undefined,
    name: fd.get("name"),
    icon: fd.get("icon") || undefined,
    sortOrder: fd.get("sortOrder") || 0,
  });
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const admin = await requireAdmin("taxonomy:manage");
    const { id, ...data } = parsed.data;
    const row = id
      ? await db.jobCategory.update({ where: { id }, data })
      : await db.jobCategory.create({ data: { ...data, slug: slugify(data.name) || randomSuffix(6) } });
    await audit({ actorId: admin.id, action: id ? "category.update" : "category.create", entityType: "JobCategory", entityId: row.id, summary: row.name });
    revalidatePath("/admin/taxonomy");
    return { ok: true, message: "Category saved." };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") return { fieldErrors: { name: ["A category with this name already exists"] } };
    return handleActionError(err);
  }
}

export async function toggleTaxonomyAction(kind: "category" | "industry" | "location", id: string, field: "isActive" | "isFeatured", value: boolean): Promise<ActionState> {
  try {
    const admin = await requireAdmin("taxonomy:manage");
    if (kind === "category" && field === "isActive") await db.jobCategory.update({ where: { id }, data: { isActive: value } });
    else if (kind === "industry" && field === "isActive") await db.industry.update({ where: { id }, data: { isActive: value } });
    else if (kind === "location") await db.location.update({ where: { id }, data: { [field]: value } });
    else return { error: "Unsupported change." };
    await audit({ actorId: admin.id, action: `${kind}.${field}`, entityType: kind, entityId: id, metadata: { value } });
    revalidatePath("/admin/taxonomy");
    return { ok: true };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function addIndustryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = nameSchema.safeParse(fd.get("name"));
  if (!parsed.success) return { fieldErrors: { name: parsed.error.errors.map((e) => e.message) } };
  try {
    const admin = await requireAdmin("taxonomy:manage");
    const row = await db.industry.create({ data: { name: parsed.data, slug: slugify(parsed.data) } });
    await audit({ actorId: admin.id, action: "industry.create", entityType: "Industry", entityId: row.id, summary: row.name });
    revalidatePath("/admin/taxonomy");
    return { ok: true, message: "Industry added." };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") return { fieldErrors: { name: ["This industry already exists"] } };
    return handleActionError(err);
  }
}

export async function addLocationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = z.object({ city: nameSchema, region: z.string().trim().max(60).optional(), country: nameSchema }).safeParse({
    city: fd.get("city"),
    region: fd.get("region") || undefined,
    country: fd.get("country"),
  });
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const admin = await requireAdmin("taxonomy:manage");
    const base = slugify(parsed.data.city);
    const slug = (await db.location.findUnique({ where: { slug: base } })) ? `${base}-${slugify(parsed.data.country)}` : base;
    const row = await db.location.create({ data: { ...parsed.data, slug } });
    await audit({ actorId: admin.id, action: "location.create", entityType: "Location", entityId: row.id, summary: `${row.city}, ${row.country}` });
    revalidatePath("/admin/taxonomy");
    return { ok: true, message: "Location added." };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") return { fieldErrors: { city: ["This location already exists"] } };
    return handleActionError(err);
  }
}

// ─── Career resources ───────────────────────────────────────────────────────

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(5, "Enter a title").max(140),
  slug: z
    .string()
    .trim()
    .max(90)
    .optional()
    .transform((v) => (v ? slugify(v) : "")),
  excerpt: z.string().trim().min(20, "Write a short excerpt (at least 20 characters)").max(300),
  content: z.string().trim().min(100, "Write at least 100 characters").max(50_000),
  categoryId: z.string().optional().transform((v) => v || null),
  coverImageUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => v || null)
    .refine((v) => !v || /^https:\/\//.test(v) || v.startsWith("/"), "Use an https:// image address"),
  readingMinutes: z.coerce.number().int().min(1).max(60).default(4),
  seoTitle: z.string().trim().max(70).optional().transform((v) => v || null),
  seoDescription: z.string().trim().max(170).optional().transform((v) => v || null),
  isFeatured: z.boolean(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export async function savePostAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const parsed = postSchema.safeParse({ ...raw, id: raw.id || undefined, isFeatured: fd.get("isFeatured") === "on", status: fd.get("intent") === "publish" ? "PUBLISHED" : fd.get("intent") === "unpublish" ? "DRAFT" : raw.status || "DRAFT" });
  if (!parsed.success) return zodFail(parsed.error, raw);
  let id: string;
  try {
    const admin = await requireAdmin("content:manage");
    const { id: postId, slug: wanted, ...data } = parsed.data;
    const base = wanted || slugify(data.title);
    const clash = await db.blogPost.findFirst({ where: { slug: base, ...(postId ? { id: { not: postId } } : {}) } });
    const slug = clash ? `${base}-${randomSuffix(4)}` : base;
    let coverImageId: string | undefined;
    const cover = fd.get("coverImage");
    if (cover instanceof File && cover.size > 0) coverImageId = (await saveUpload({ file: cover, purpose: "ARTICLE_IMAGE", ownerId: admin.id, visibility: "PUBLIC" })).id;
    const existing = postId ? await db.blogPost.findUnique({ where: { id: postId } }) : null;
    const payload = {
      ...data,
      slug,
      ...(coverImageId ? { coverImageId } : {}),
      publishedAt: data.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : null,
      isSample: false,
    };
    const post = postId ? await db.blogPost.update({ where: { id: postId }, data: payload }) : await db.blogPost.create({ data: { ...payload, authorId: admin.id } });
    id = post.id;
    await audit({ actorId: admin.id, action: postId ? "post.update" : "post.create", entityType: "BlogPost", entityId: post.id, summary: `${post.title} (${post.status})` });
    revalidatePath("/resources");
    revalidatePath(`/resources/${post.slug}`);
    revalidatePath("/admin/content");
  } catch (err) {
    return { ...handleActionError(err), values: raw };
  }
  redirect(`/admin/content/${id}?saved=1`);
}

export async function deletePostAction(id: string): Promise<ActionState> {
  try {
    const admin = await requireAdmin("content:manage");
    const post = await db.blogPost.delete({ where: { id } });
    await audit({ actorId: admin.id, action: "post.delete", entityType: "BlogPost", entityId: id, summary: post.title });
    revalidatePath("/admin/content");
    revalidatePath("/resources");
  } catch (err) {
    return handleActionError(err);
  }
  redirect("/admin/content");
}

export async function addResourceCategoryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = nameSchema.safeParse(fd.get("name"));
  if (!parsed.success) return { fieldErrors: { name: parsed.error.errors.map((e) => e.message) } };
  try {
    const admin = await requireAdmin("content:manage");
    const row = await db.resourceCategory.create({ data: { name: parsed.data, slug: slugify(parsed.data) } });
    await audit({ actorId: admin.id, action: "resource_category.create", entityType: "ResourceCategory", entityId: row.id, summary: row.name });
    revalidatePath("/admin/content");
    return { ok: true, message: "Category added." };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") return { fieldErrors: { name: ["This category already exists"] } };
    return handleActionError(err);
  }
}

// ─── Announcements & settings ───────────────────────────────────────────────

export async function sendAnnouncementAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = z
    .object({ title: z.string().trim().min(5, "Enter a title").max(120), body: z.string().trim().min(10, "Write the announcement").max(2000), audience: z.enum(["ALL", "JOB_SEEKERS", "EMPLOYERS"]) })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const admin = await requireAdmin("announcements:send");
    const roleFilter = parsed.data.audience === "JOB_SEEKERS" ? { role: "JOB_SEEKER" as const } : parsed.data.audience === "EMPLOYERS" ? { role: "EMPLOYER" as const } : { role: { in: ["JOB_SEEKER", "EMPLOYER"] as ("JOB_SEEKER" | "EMPLOYER")[] } };
    const users = await db.user.findMany({ where: { status: "ACTIVE", ...roleFilter }, select: { id: true } });
    const ann = await db.announcement.create({ data: { ...parsed.data, createdById: admin.id } });
    const count = await notifyMany(
      users.map((u) => u.id),
      { type: "ANNOUNCEMENT", title: parsed.data.title, body: parsed.data.body },
    );
    await audit({ actorId: admin.id, action: "announcement.send", entityType: "Announcement", entityId: ann.id, summary: parsed.data.title, metadata: { audience: parsed.data.audience, recipients: count } });
    revalidatePath("/admin/announcements");
    return { ok: true, message: `Announcement sent to ${count.toLocaleString("en")} ${count === 1 ? "person" : "people"}.` };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function saveSettingsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = {
    requireJobApproval: fd.get("requireJobApproval") === "on",
    allowEmployerSignup: fd.get("allowEmployerSignup") === "on",
    allowSeekerSignup: fd.get("allowSeekerSignup") === "on",
    maintenanceBanner: String(fd.get("maintenanceBanner") ?? "").trim(),
    heroHeadline: String(fd.get("heroHeadline") ?? "").trim(),
    heroSubtext: String(fd.get("heroSubtext") ?? "").trim(),
    popularSearches: String(fd.get("popularSearches") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    riskThreshold: Number(fd.get("riskThreshold")),
    supportEmail: String(fd.get("supportEmail") ?? "").trim(),
  };
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const admin = await requireAdmin("settings:manage");
    await saveSettings(parsed.data);
    await audit({ actorId: admin.id, action: "settings.update", entityType: "PlatformSettings", metadata: parsed.data });
    revalidatePath("/", "layout");
    return { ok: true, message: "Platform settings saved." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function runAlertsNowAction(): Promise<ActionState> {
  try {
    const admin = await requireAdmin("settings:manage");
    const [daily, weekly] = await Promise.all([runJobAlerts("DAILY"), runJobAlerts("WEEKLY")]);
    await audit({ actorId: admin.id, action: "alerts.run", entityType: "JobAlert", metadata: { daily, weekly } });
    return { ok: true, message: `Job alerts processed: ${daily} daily and ${weekly} weekly alerts had new matches.` };
  } catch (err) {
    return handleActionError(err);
  }
}

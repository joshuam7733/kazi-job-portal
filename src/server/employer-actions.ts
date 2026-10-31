"use server";

import type { ApplicationStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { candidateStatusLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { evaluateJob, notifyAdminsOfReviewQueue, onJobPublished } from "@/lib/jobs/publish";
import { notify } from "@/lib/notify";
import { limitAction } from "@/lib/rate-limit";
import { requireEmployerCompany } from "@/lib/session";
import { saveUpload } from "@/lib/storage";
import { randomSuffix, slugify } from "@/lib/utils";
import { companySchema, jobSchema, lenientJobParse, verificationSchema, type JobInput } from "@/lib/validation/company";
import { formValues, handleActionError, zodFail, type ActionState } from "./action-utils";

// ─── Company ────────────────────────────────────────────────────────────────

export async function updateCompanyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const keys = ["name", "type", "tagline", "description", "industryId", "locationId", "size", "website", "contactEmail", "contactPhone", "foundedYear", "brandColor"];
  const values = formValues(fd, keys);
  const parsed = companySchema.safeParse(values);
  if (!parsed.success) return zodFail(parsed.error, values);
  try {
    const { user, company } = await requireEmployerCompany();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { industryId, locationId, jobTitle, ...rest } = parsed.data;
    const data: Prisma.CompanyUpdateInput = { ...rest, industry: { connect: { id: industryId } }, location: { connect: { id: locationId } } };
    const logo = fd.get("logo");
    if (logo instanceof File && logo.size > 0) {
      const stored = await saveUpload({ file: logo, purpose: "LOGO", ownerId: user.id, visibility: "PUBLIC" });
      data.logoUrl = `/api/files/${stored.id}`;
    }
    // Changing the legal name of a verified company sends it back for review.
    if (company.verificationStatus === "VERIFIED" && parsed.data.name.trim().toLowerCase() !== company.name.trim().toLowerCase()) {
      data.verificationStatus = "PENDING";
      await db.companyVerification.create({
        data: { companyId: company.id, requestedById: user.id, notes: `Company renamed from “${company.name}” to “${parsed.data.name}”.`, status: "PENDING" },
      });
      await notifyAdminsOfReviewQueue("Company renamed — re-verification needed", parsed.data.name, "/admin/verification");
    }
    await db.company.update({ where: { id: company.id }, data });
    revalidatePath("/employer/company");
    revalidatePath(`/companies/${company.slug}`);
    return { ok: true, message: "Company profile saved." };
  } catch (err) {
    return { ...handleActionError(err), values };
  }
}

export async function requestVerificationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = verificationSchema.safeParse({ registrationNumber: fd.get("registrationNumber") ?? "", notes: fd.get("notes") ?? "" });
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const { user, company } = await requireEmployerCompany();
    if (company.verificationStatus === "VERIFIED") return { error: "Your company is already verified." };
    if (company.verificationStatus === "PENDING") return { error: "A verification request is already being reviewed." };
    let documentFileId: string | null = null;
    const doc = fd.get("document");
    if (doc instanceof File && doc.size > 0) documentFileId = (await saveUpload({ file: doc, purpose: "VERIFICATION_DOC", ownerId: user.id })).id;
    await db.$transaction([
      db.companyVerification.create({ data: { companyId: company.id, requestedById: user.id, ...parsed.data, documentFileId } }),
      db.company.update({ where: { id: company.id }, data: { verificationStatus: "PENDING" } }),
    ]);
    await notifyAdminsOfReviewQueue("New company verification request", company.name, "/admin/verification");
    revalidatePath("/employer/company");
    revalidatePath("/employer");
    return { ok: true, message: "Verification requested. We'll notify you when it's reviewed." };
  } catch (err) {
    return handleActionError(err);
  }
}

// ─── Jobs ───────────────────────────────────────────────────────────────────

function parseJobForm(fd: FormData): Record<string, unknown> {
  const questions: { id: string; label: string; type: "text" | "yesno"; required: boolean }[] = [];
  const labels = fd.getAll("q_label").map(String);
  const types = fd.getAll("q_type").map(String);
  const required = fd.getAll("q_required").map(String);
  labels.forEach((label, i) => {
    if (label.trim()) questions.push({ id: `q${i + 1}`, label: label.trim(), type: types[i] === "yesno" ? "yesno" : "text", required: required[i] === "true" });
  });
  return {
    ...Object.fromEntries([...fd.entries()].filter(([k]) => !k.startsWith("q_") && typeof fd.get(k) === "string")),
    showSalary: fd.get("showSalary") === "on",
    questions,
  };
}

export async function saveJobAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const intent = fd.get("intent") === "submit" ? "submit" : "draft";
  const jobId = String(fd.get("jobId") ?? "") || null;
  const raw = parseJobForm(fd);
  const values = Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === "string")) as unknown as Record<string, string>;

  // Drafts only need a title; everything else is validated on submit.
  const parsed = intent === "submit" ? jobSchema.safeParse(raw) : null;
  if (parsed && !parsed.success) return zodFail(parsed.error, values);
  if (intent === "draft" && String(values.title ?? "").trim().length < 3) return { fieldErrors: { title: ["Enter a job title to save a draft"] }, values };

  let destination: string;
  try {
    const { user, company } = await requireEmployerCompany();
    if (!(await limitAction("job-save", 60, 60 * 60_000, user.id)).ok) return { error: "Too many saves in a short time. Try again shortly.", values };

    const existing = jobId ? await db.job.findFirst({ where: { id: jobId, companyId: company.id } }) : null;
    if (jobId && !existing) return { error: "Job not found." };
    if (existing && ["REMOVED"].includes(existing.status)) return { error: "This job was removed by KAZI moderators and can't be edited." };

    // Build data — for drafts, fall back to safe defaults for anything missing.
    const d: Partial<JobInput> = parsed?.success ? parsed.data : lenientJobParse(raw);
    const str = (k: string) => String(values[k] ?? "");
    const data = {
      title: (d.title ?? str("title")).trim(),
      categoryId: d.categoryId || null,
      locationId: d.locationId || null,
      workplace: d.workplace ?? "ONSITE",
      employmentType: d.employmentType ?? "FULL_TIME",
      experienceLevel: d.experienceLevel ?? "MID",
      educationLevel: d.educationLevel ?? "NONE",
      openings: d.openings ?? 1,
      salaryMin: d.salaryMin ?? null,
      salaryMax: d.salaryMax ?? null,
      salaryCurrency: d.salaryCurrency ?? "UGX",
      salaryPeriod: d.salaryPeriod ?? "MONTH",
      showSalary: d.showSalary ?? true,
      summary: d.summary ?? str("summary").slice(0, 220),
      description: d.description ?? str("description").slice(0, 8000),
      responsibilities: d.responsibilities ?? str("responsibilities").slice(0, 5000),
      requirements: d.requirements ?? str("requirements").slice(0, 5000),
      preferredQualifications: d.preferredQualifications ?? null,
      benefits: d.benefits ?? null,
      deadline: d.deadline ?? null,
      questions: (d.questions ?? []) as Prisma.InputJsonValue,
    };

    let status = existing?.status ?? "DRAFT";
    let riskScore = existing?.riskScore ?? 0;
    let riskFlags = existing?.riskFlags ?? [];
    let publishedAt = existing?.publishedAt ?? null;
    let moderationNote = existing?.moderationNote ?? null;
    let wentLive = false;
    let queued = false;

    if (intent === "submit") {
      const { risk, decision } = await evaluateJob(company, data);
      riskScore = risk.score;
      riskFlags = risk.flags;
      if (decision.status === "PUBLISHED") {
        wentLive = existing?.status !== "PUBLISHED";
        status = "PUBLISHED";
        publishedAt = publishedAt ?? new Date();
        moderationNote = null;
      } else {
        status = "PENDING_REVIEW";
        moderationNote = decision.reason;
        queued = true;
      }
    } else if (existing && existing.status !== "DRAFT") {
      // Editing a live/paused job as "save" keeps its status but re-screens it.
      const { risk, decision } = await evaluateJob(company, data);
      riskScore = risk.score;
      riskFlags = risk.flags;
      if (existing.status === "PUBLISHED" && decision.status !== "PUBLISHED") {
        status = "PENDING_REVIEW";
        moderationNote = decision.reason;
        queued = true;
      }
    }

    const skills = (d.skills ?? []) as string[];
    const saved = await db.$transaction(async (tx) => {
      const job = existing
        ? await tx.job.update({ where: { id: existing.id }, data: { ...data, status, riskScore, riskFlags, publishedAt, moderationNote } })
        : await tx.job.create({
            data: {
              ...data,
              slug: `${slugify(data.title) || "job"}-${randomSuffix(6)}`,
              companyId: company.id,
              postedById: user.id,
              status,
              riskScore,
              riskFlags,
              publishedAt,
              moderationNote,
            },
          });
      if (intent === "submit" || skills.length) {
        await tx.jobSkill.deleteMany({ where: { jobId: job.id } });
        for (const name of skills) {
          const slug = slugify(name);
          if (!slug) continue;
          const skill = await tx.skill.upsert({ where: { slug }, create: { name, slug }, update: {} });
          await tx.jobSkill.create({ data: { jobId: job.id, skillId: skill.id } });
        }
      }
      return job;
    });

    if (wentLive) await onJobPublished(saved.id);
    if (queued) await notifyAdminsOfReviewQueue("Job waiting for review", `${saved.title} — ${company.name}`, "/admin/jobs");
    revalidatePath("/employer/jobs");
    revalidatePath("/jobs");
    destination = `/employer/jobs?saved=${intent === "draft" ? "draft" : status === "PUBLISHED" ? "published" : "review"}`;
  } catch (err) {
    return { ...handleActionError(err), values };
  }
  redirect(destination);
}

const STATUS_TRANSITIONS: Record<string, { from: string[]; to: "PAUSED" | "PUBLISHED" | "CLOSED" }> = {
  pause: { from: ["PUBLISHED"], to: "PAUSED" },
  resume: { from: ["PAUSED"], to: "PUBLISHED" },
  close: { from: ["PUBLISHED", "PAUSED", "PENDING_REVIEW"], to: "CLOSED" },
};

export async function setJobStatusAction(jobId: string, op: "pause" | "resume" | "close"): Promise<ActionState> {
  try {
    const { company } = await requireEmployerCompany();
    const t = STATUS_TRANSITIONS[op];
    if (!t) return { error: "Unknown action." };
    const job = await db.job.findFirst({ where: { id: jobId, companyId: company.id } });
    if (!job) return { error: "Job not found." };
    if (!t.from.includes(job.status)) return { error: "That change isn't available for this job right now." };
    if (op === "resume" && job.deadline && job.deadline < new Date()) return { error: "The deadline has passed. Edit the job to set a new deadline first." };
    await db.job.update({ where: { id: job.id }, data: { status: t.to, closedAt: t.to === "CLOSED" ? new Date() : null } });
    revalidatePath("/employer/jobs");
    revalidatePath(`/jobs/${job.slug}`);
    return { ok: true, message: op === "pause" ? "Job paused — it's hidden from search." : op === "resume" ? "Job is live again." : "Job closed." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteDraftAction(jobId: string): Promise<ActionState> {
  try {
    const { company } = await requireEmployerCompany();
    const res = await db.job.deleteMany({ where: { id: jobId, companyId: company.id, status: "DRAFT" } });
    if (!res.count) return { error: "Only drafts can be deleted. Close published jobs instead." };
    revalidatePath("/employer/jobs");
    return { ok: true, message: "Draft deleted." };
  } catch (err) {
    return handleActionError(err);
  }
}

// ─── Applicant tracking ─────────────────────────────────────────────────────

async function ownedApplication(applicationId: string) {
  const { user, company } = await requireEmployerCompany();
  const app = await db.application.findFirst({
    where: { id: applicationId, job: { companyId: company.id } },
    include: { job: true, candidate: { select: { id: true, name: true, jobSeekerProfile: { select: { allowEmployerMessages: true } } } } },
  });
  if (!app) throw Object.assign(new Error("Application not found."), { name: "UserFacingError" });
  return { user, company, app };
}

const STAGES: ApplicationStatus[] = ["SUBMITTED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

export async function moveApplicationAction(applicationId: string, to: ApplicationStatus): Promise<ActionState> {
  try {
    if (!STAGES.includes(to)) return { error: "Unknown stage." };
    const { user, company, app } = await ownedApplication(applicationId);
    if (app.status === "WITHDRAWN") return { error: "The candidate withdrew this application." };
    if (app.status === to) return { ok: true };
    await db.application.update({
      where: { id: app.id },
      data: { status: to, history: { create: { fromStatus: app.status, toStatus: to, changedById: user.id } } },
    });
    // Notify only when the candidate-facing label actually changes.
    if (candidateStatusLabel(app.status) !== candidateStatusLabel(to)) {
      const label = candidateStatusLabel(to);
      await notify({
        userId: app.candidateId,
        type: "APPLICATION_STATUS",
        title: to === "REJECTED" ? `Update on your application to ${company.name}` : `Your application is now: ${label}`,
        body:
          to === "REJECTED"
            ? `${company.name} has decided not to move forward with your application for ${app.job.title}. Thank you for applying.`
            : `${app.job.title} at ${company.name}`,
        link: `/dashboard/applications/${app.id}`,
        email: true,
      });
    }
    revalidatePath(`/employer/jobs/${app.jobId}/pipeline`);
    revalidatePath(`/employer/applicants/${app.id}`);
    return { ok: true, message: `Moved to ${to === "SUBMITTED" ? "Applied" : to.charAt(0) + to.slice(1).toLowerCase()}.` };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function addNoteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const body = String(fd.get("body") ?? "").trim();
  const applicationId = String(fd.get("applicationId") ?? "");
  if (body.length < 2) return { fieldErrors: { body: ["Write a note first"] } };
  if (body.length > 2000) return { fieldErrors: { body: ["Keep notes under 2,000 characters"] } };
  try {
    const { user, app } = await ownedApplication(applicationId);
    await db.applicationNote.create({ data: { applicationId: app.id, authorId: user.id, body } });
    revalidatePath(`/employer/applicants/${app.id}`);
    return { ok: true, message: "Note added. Only your team can see it." };
  } catch (err) {
    return handleActionError(err);
  }
}

const interviewSchema = z.object({
  applicationId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time"),
  durationMins: z.coerce.number().int().min(10).max(480),
  mode: z.enum(["IN_PERSON", "VIDEO", "PHONE"]),
  location: z.string().trim().max(300).optional(),
  details: z.string().trim().max(2000).optional(),
});

export async function scheduleInterviewAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = interviewSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const { user, company, app } = await ownedApplication(parsed.data.applicationId);
    const scheduledAt = new Date(`${parsed.data.date}T${parsed.data.time}:00+03:00`); // East Africa Time
    if (scheduledAt < new Date()) return { fieldErrors: { date: ["Choose a time in the future"] } };
    await db.$transaction([
      db.interview.create({
        data: {
          applicationId: app.id,
          scheduledAt,
          durationMins: parsed.data.durationMins,
          mode: parsed.data.mode,
          location: parsed.data.location || null,
          details: parsed.data.details || null,
          createdById: user.id,
        },
      }),
      db.application.update({
        where: { id: app.id },
        data: {
          status: "INTERVIEW",
          ...(app.status !== "INTERVIEW" ? { history: { create: { fromStatus: app.status, toStatus: "INTERVIEW", changedById: user.id } } } : {}),
        },
      }),
    ]);
    await notify({
      userId: app.candidateId,
      type: "INTERVIEW_INVITE",
      title: `Interview invitation from ${company.name}`,
      body: `${app.job.title} — ${formatDate(scheduledAt, "EEEE d MMMM, HH:mm")} EAT (${parsed.data.mode === "VIDEO" ? "video call" : parsed.data.mode === "PHONE" ? "phone call" : "in person"}).`,
      link: `/dashboard/applications/${app.id}`,
      email: true,
    });
    revalidatePath(`/employer/applicants/${app.id}`);
    return { ok: true, message: "Interview scheduled and the candidate has been notified." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function messageCandidateAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const applicationId = String(fd.get("applicationId") ?? "");
  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 2 || body.length > 4000) return { fieldErrors: { body: ["Write a message between 2 and 4,000 characters"] } };
  let conversationId: string;
  try {
    const { user, company, app } = await ownedApplication(applicationId);
    if (app.candidate.jobSeekerProfile?.allowEmployerMessages === false)
      return { error: "This candidate has turned off employer messages. Use the interview invitation instead." };
    if (!(await limitAction("message", 60, 60 * 60_000, user.id)).ok) return { error: "You're sending messages too quickly. Try again shortly." };
    const existing = await db.conversation.findFirst({ where: { applicationId: app.id } });
    const convo =
      existing ??
      (await db.conversation.create({
        data: { subject: `${app.job.title} — ${company.name}`, applicationId: app.id, participants: { create: [{ userId: user.id, lastReadAt: new Date() }, { userId: app.candidateId }] } },
      }));
    // Make sure every company member who writes is a participant.
    await db.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: convo.id, userId: user.id } },
      create: { conversationId: convo.id, userId: user.id, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    });
    await db.message.create({ data: { conversationId: convo.id, senderId: user.id, body } });
    await db.conversation.update({ where: { id: convo.id }, data: { updatedAt: new Date() } });
    await notify({ userId: app.candidateId, type: "MESSAGE", title: `New message from ${company.name}`, body: body.slice(0, 140), link: `/messages/${convo.id}`, email: true });
    conversationId = convo.id;
  } catch (err) {
    return handleActionError(err);
  }
  redirect(`/messages/${conversationId}`);
}

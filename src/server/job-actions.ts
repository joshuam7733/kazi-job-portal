"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { publicJobWhere } from "@/lib/jobs/filters";
import { smtpConfigured } from "@/lib/mail";
import { notify } from "@/lib/notify";
import { limitAction } from "@/lib/rate-limit";
import { getSessionUser, requireUser } from "@/lib/session";
import { saveUpload } from "@/lib/storage";
import { applicationSchema, parseQuestions, reportSchema, validateAnswers } from "@/lib/validation/application";
import { handleActionError, zodFail, type ActionState } from "./action-utils";

export async function toggleSaveJobAction(jobId: string): Promise<{ saved?: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "signin" };
  if (user.role !== "JOB_SEEKER") return { error: "Only job seeker accounts can save jobs." };
  if (typeof jobId !== "string" || !jobId) return { error: "That job is no longer available." };
  const existing = await db.savedJob.findUnique({ where: { userId_jobId: { userId: user.id, jobId } } });
  if (existing) {
    await db.savedJob.delete({ where: { id: existing.id } });
    revalidatePath("/dashboard/saved");
    return { saved: false };
  }
  const job = await db.job.findFirst({ where: { id: jobId, ...publicJobWhere() }, select: { id: true } });
  if (!job) return { error: "That job is no longer available." };
  await db.savedJob.create({ data: { userId: user.id, jobId } });
  revalidatePath("/dashboard/saved");
  return { saved: true };
}

export async function moveSavedJobAction(savedId: string, folder: string) {
  const user = await requireUser(["JOB_SEEKER"]);
  const clean = folder.trim().slice(0, 40) || "Saved";
  await db.savedJob.updateMany({ where: { id: savedId, userId: user.id }, data: { folder: clean } });
  revalidatePath("/dashboard/saved");
}

export async function removeSavedJobAction(savedId: string) {
  const user = await requireUser(["JOB_SEEKER"]);
  await db.savedJob.deleteMany({ where: { id: savedId, userId: user.id } });
  revalidatePath("/dashboard/saved");
  revalidatePath("/dashboard");
}

export async function reportJobAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = reportSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const user = await getSessionUser();
    if (!(await limitAction("report", 5, 60 * 60_000, user?.id)).ok) return { error: "You've sent several reports recently. Try again later." };
    const job = await db.job.findUnique({ where: { id: parsed.data.jobId }, select: { id: true, companyId: true } });
    if (!job) return { error: "That job no longer exists." };
    await db.report.create({
      data: { jobId: job.id, companyId: job.companyId, reporterId: user?.id, reason: parsed.data.reason, details: parsed.data.details },
    });
    // Three or more open reports automatically pull a listing into review.
    const open = await db.report.count({ where: { jobId: job.id, status: "OPEN" } });
    if (open >= 3) {
      await db.job.updateMany({
        where: { id: job.id, status: "PUBLISHED" },
        data: { status: "PENDING_REVIEW", moderationNote: "Automatically paused after multiple user reports." },
      });
    }
    return { ok: true, message: "Thanks — our trust & safety team will review this listing." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function applyToJobAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = applicationSchema.safeParse({
    jobId: fd.get("jobId"),
    resumeId: fd.get("resumeId") || undefined,
    coverLetter: fd.get("coverLetter") || undefined,
  });
  if (!parsed.success) return zodFail(parsed.error);

  let destination: string;
  try {
    const user = await requireUser(["JOB_SEEKER"]);
    if (!(await limitAction("apply", 20, 60 * 60_000, user.id)).ok) return { error: "You've submitted many applications in the last hour. Try again later." };

    const dbUser = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    if (process.env.REQUIRE_EMAIL_VERIFICATION === "true" && smtpConfigured() && !dbUser.emailVerified)
      return { error: "Confirm your email address before applying. You can resend the email from Settings." };

    const job = await db.job.findFirst({
      where: { id: parsed.data.jobId, ...publicJobWhere() },
      include: { company: { include: { members: { select: { userId: true } } } } },
    });
    if (!job) return { error: "This job is closed or no longer accepting applications." };
    if (job.deadline && job.deadline < new Date()) return { error: "The application deadline for this job has passed." };

    const already = await db.application.findUnique({ where: { jobId_candidateId: { jobId: job.id, candidateId: user.id } } });
    if (already) return { error: "You've already applied for this job. Track it in My Applications." };

    const { errors, answers } = validateAnswers(parseQuestions(job.questions), fd);
    if (Object.keys(errors).length) return { error: "Answer the required questions.", fieldErrors: errors };

    // CV: either an existing resume of this user, or a fresh upload.
    let resumeId: string | undefined;
    const upload = fd.get("resumeFile");
    if (upload instanceof File && upload.size > 0) {
      const file = await saveUpload({ file: upload, purpose: "RESUME", ownerId: user.id });
      const hasResumes = await db.resume.count({ where: { userId: user.id } });
      const resume = await db.resume.create({
        data: { userId: user.id, fileId: file.id, label: upload.name.replace(/\.[^.]+$/, "").slice(0, 60) || "CV", isDefault: hasResumes === 0 },
      });
      resumeId = resume.id;
    } else if (parsed.data.resumeId) {
      const resume = await db.resume.findFirst({ where: { id: parsed.data.resumeId, userId: user.id } });
      if (!resume) return { fieldErrors: { resumeId: ["Choose one of your CVs"] }, error: "Choose a CV to send." };
      resumeId = resume.id;
    } else {
      return { fieldErrors: { resumeId: ["Attach a CV"] }, error: "Attach a CV to apply." };
    }

    let applicationId: string;
    try {
      const app = await db.application.create({
        data: {
          jobId: job.id,
          candidateId: user.id,
          resumeId,
          coverLetter: parsed.data.coverLetter,
          answers,
          history: { create: { toStatus: "SUBMITTED", changedById: user.id } },
        },
      });
      applicationId = app.id;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
        return { error: "You've already applied for this job. Track it in My Applications." };
      throw e;
    }

    await Promise.all([
      ...job.company.members.map((m) =>
        notify({
          userId: m.userId,
          type: "APPLICATION_RECEIVED",
          title: `New application: ${job.title}`,
          body: `${dbUser.name ?? "A candidate"} applied.`,
          link: `/employer/applicants/${applicationId}`,
          email: true,
        }),
      ),
      notify({
        userId: user.id,
        type: "APPLICATION_STATUS",
        title: `Application sent to ${job.company.name}`,
        body: `${job.title} — we'll let you know when the status changes.`,
        link: `/dashboard/applications/${applicationId}`,
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/applications");
    destination = `/dashboard/applications/${applicationId}?applied=1`;
  } catch (err) {
    return handleActionError(err);
  }
  redirect(destination);
}

export async function withdrawApplicationAction(applicationId: string): Promise<ActionState> {
  try {
    const user = await requireUser(["JOB_SEEKER"]);
    const app = await db.application.findFirst({
      where: { id: applicationId, candidateId: user.id },
      include: { job: { include: { company: { include: { members: true } } } } },
    });
    if (!app) return { error: "Application not found." };
    if (["HIRED", "REJECTED", "WITHDRAWN"].includes(app.status)) return { error: "This application can no longer be withdrawn." };
    await db.application.update({
      where: { id: app.id },
      data: {
        status: "WITHDRAWN",
        withdrawnAt: new Date(),
        history: { create: { fromStatus: app.status, toStatus: "WITHDRAWN", changedById: user.id } },
      },
    });
    await Promise.all(
      app.job.company.members.map((m) =>
        notify({ userId: m.userId, type: "APPLICATION_STATUS", title: `A candidate withdrew from ${app.job.title}`, link: `/employer/jobs/${app.jobId}/pipeline` }),
      ),
    );
    revalidatePath("/dashboard/applications");
    revalidatePath(`/dashboard/applications/${app.id}`);
    return { ok: true, message: "Application withdrawn." };
  } catch (err) {
    return handleActionError(err);
  }
}

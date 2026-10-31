"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { limitAction } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";
import { deleteStoredFile, saveUpload } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import {
  educationSchema,
  experienceSchema,
  personalSchema,
  preferencesSchema,
  privacySchema,
  skillsSchema,
  summarySchema,
} from "@/lib/validation/profile";
import { formValues, handleActionError, zodFail, type ActionState } from "./action-utils";

async function seekerProfile() {
  const user = await requireUser(["JOB_SEEKER"]);
  const profile = await db.jobSeekerProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  return { user, profile };
}

const done = (message = "Saved."): ActionState => {
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true, message };
};

export async function savePersonalAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd, ["name", "headline", "locationText", "phone", "portfolioUrl", "linkedinUrl", "githubUrl"]);
  const parsed = personalSchema.safeParse(values);
  if (!parsed.success) return zodFail(parsed.error, values);
  try {
    const { user, profile } = await seekerProfile();
    const { name, ...rest } = parsed.data;
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { name } }),
      db.jobSeekerProfile.update({ where: { id: profile.id }, data: rest }),
    ]);
    return done("Personal details saved.");
  } catch (err) {
    return handleActionError(err);
  }
}

export async function saveSummaryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = summarySchema.safeParse({ summary: fd.get("summary") ?? "" });
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const { profile } = await seekerProfile();
    await db.jobSeekerProfile.update({ where: { id: profile.id }, data: { summary: parsed.data.summary } });
    return done("Summary saved.");
  } catch (err) {
    return handleActionError(err);
  }
}

export async function savePreferencesAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = preferencesSchema.safeParse({
    experienceLevel: fd.get("experienceLevel") ?? "",
    preferredRoles: fd.get("preferredRoles") ?? "",
    preferredWorkplace: fd.getAll("preferredWorkplace"),
    salaryExpectation: fd.get("salaryExpectation") ?? "",
    openToWork: fd.get("openToWork") === "on",
  });
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const { profile } = await seekerProfile();
    await db.jobSeekerProfile.update({
      where: { id: profile.id },
      data: {
        experienceLevel: parsed.data.experienceLevel ?? null,
        preferredRoles: parsed.data.preferredRoles,
        preferredWorkplace: parsed.data.preferredWorkplace,
        salaryExpectation: parsed.data.salaryExpectation,
      },
    });
    return done("Preferences saved.");
  } catch (err) {
    return handleActionError(err);
  }
}

export async function saveSkillsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = skillsSchema.safeParse({ skills: fd.get("skills") ?? "" });
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const { profile } = await seekerProfile();
    const skillIds: string[] = [];
    for (const name of parsed.data.skills) {
      const slug = slugify(name);
      if (!slug) continue;
      const skill = await db.skill.upsert({ where: { slug }, create: { name, slug }, update: {} });
      skillIds.push(skill.id);
    }
    await db.$transaction([
      db.jobSeekerSkill.deleteMany({ where: { profileId: profile.id } }),
      db.jobSeekerSkill.createMany({ data: [...new Set(skillIds)].map((skillId) => ({ profileId: profile.id, skillId })) }),
    ]);
    return done("Skills saved.");
  } catch (err) {
    return handleActionError(err);
  }
}

export async function saveExperienceAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd, ["id", "title", "company", "location", "startDate", "endDate", "isCurrent", "description"]);
  const parsed = experienceSchema.safeParse({ ...values, isCurrent: fd.get("isCurrent") ?? undefined, id: values.id || undefined });
  if (!parsed.success) return zodFail(parsed.error, values);
  try {
    const { profile } = await seekerProfile();
    const { id, ...data } = parsed.data;
    const payload = { ...data, endDate: data.isCurrent ? null : data.endDate };
    if (id) {
      const res = await db.workExperience.updateMany({ where: { id, profileId: profile.id }, data: payload });
      if (!res.count) return { error: "That entry no longer exists." };
    } else {
      if ((await db.workExperience.count({ where: { profileId: profile.id } })) >= 20) return { error: "You can add up to 20 roles." };
      await db.workExperience.create({ data: { ...payload, profileId: profile.id } });
    }
    return done("Experience saved.");
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteExperienceAction(id: string) {
  const { profile } = await seekerProfile();
  await db.workExperience.deleteMany({ where: { id, profileId: profile.id } });
  revalidatePath("/dashboard/profile");
}

export async function saveEducationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd, ["id", "institution", "qualification", "field", "level", "startYear", "endYear"]);
  const parsed = educationSchema.safeParse({ ...values, id: values.id || undefined });
  if (!parsed.success) return zodFail(parsed.error, values);
  try {
    const { profile } = await seekerProfile();
    const { id, ...data } = parsed.data;
    const payload = { ...data, level: data.level ?? null };
    if (id) {
      const res = await db.education.updateMany({ where: { id, profileId: profile.id }, data: payload });
      if (!res.count) return { error: "That entry no longer exists." };
    } else {
      if ((await db.education.count({ where: { profileId: profile.id } })) >= 10) return { error: "You can add up to 10 qualifications." };
      await db.education.create({ data: { ...payload, profileId: profile.id } });
    }
    return done("Education saved.");
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteEducationAction(id: string) {
  const { profile } = await seekerProfile();
  await db.education.deleteMany({ where: { id, profileId: profile.id } });
  revalidatePath("/dashboard/profile");
}

export async function uploadResumeAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser(["JOB_SEEKER"]);
    if (!(await limitAction("upload", 20, 60 * 60_000, user.id)).ok) return { error: "Too many uploads. Try again later." };
    const file = fd.get("file");
    if (!(file instanceof File)) return { error: "Choose a file to upload." };
    if ((await db.resume.count({ where: { userId: user.id } })) >= 5) return { error: "You can keep up to 5 CVs. Delete one to upload another." };
    const label = String(fd.get("label") ?? "").trim().slice(0, 60) || file.name.replace(/\.[^.]+$/, "").slice(0, 60);
    const stored = await saveUpload({ file, purpose: "RESUME", ownerId: user.id });
    const hasDefault = await db.resume.count({ where: { userId: user.id, isDefault: true } });
    await db.resume.create({ data: { userId: user.id, fileId: stored.id, label, isDefault: hasDefault === 0 } });
    revalidatePath("/dashboard/profile");
    return { ok: true, message: "CV uploaded." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function setDefaultResumeAction(id: string) {
  const user = await requireUser(["JOB_SEEKER"]);
  const resume = await db.resume.findFirst({ where: { id, userId: user.id } });
  if (!resume) return;
  await db.$transaction([
    db.resume.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.resume.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/dashboard/profile");
}

export async function deleteResumeAction(id: string): Promise<ActionState> {
  const user = await requireUser(["JOB_SEEKER"]);
  const resume = await db.resume.findFirst({ where: { id, userId: user.id }, include: { _count: { select: { applications: { where: { status: { notIn: ["REJECTED", "WITHDRAWN", "HIRED"] } } } } } } });
  if (!resume) return { error: "CV not found." };
  if (resume._count.applications > 0)
    return { error: "This CV is attached to active applications. Employers still need it until those applications close." };
  await deleteStoredFile(resume.fileId);
  if (resume.isDefault) {
    const next = await db.resume.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    if (next) await db.resume.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  revalidatePath("/dashboard/profile");
  return { ok: true, message: "CV deleted." };
}

export async function savePrivacyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = privacySchema.safeParse({
    showPhoneToEmployers: fd.get("showPhoneToEmployers") === "on",
    allowEmployerMessages: fd.get("allowEmployerMessages") === "on",
    openToWork: fd.get("openToWork") === "on",
  });
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const { profile } = await seekerProfile();
    await db.jobSeekerProfile.update({ where: { id: profile.id }, data: parsed.data });
    return done("Privacy settings saved.");
  } catch (err) {
    return handleActionError(err);
  }
}

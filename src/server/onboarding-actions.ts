"use server";

import { redirect } from "next/navigation";
import { unstable_update } from "@/auth";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { saveUpload } from "@/lib/storage";
import { randomSuffix, slugify } from "@/lib/utils";
import { companySchema, verificationSchema } from "@/lib/validation/company";
import { personalSchema, preferencesSchema, skillsSchema } from "@/lib/validation/profile";
import { formValues, handleActionError, zodFail, type ActionState } from "./action-utils";

/** Saves one onboarding step for a job seeker. Every step is optional except the name. */
export async function saveSeekerStepAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const step = String(fd.get("step"));
  try {
    const user = await requireUser(["JOB_SEEKER"]);
    const profile = await db.jobSeekerProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });

    if (step === "about") {
      const values = formValues(fd, ["name", "headline", "locationText"]);
      const parsed = personalSchema.pick({ name: true, headline: true, locationText: true }).safeParse(values);
      if (!parsed.success) return zodFail(parsed.error, values);
      const level = String(fd.get("experienceLevel") ?? "");
      await db.$transaction([
        db.user.update({ where: { id: user.id }, data: { name: parsed.data.name } }),
        db.jobSeekerProfile.update({
          where: { id: profile.id },
          data: {
            headline: parsed.data.headline,
            locationText: parsed.data.locationText,
            experienceLevel: ["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"].includes(level) ? (level as never) : null,
          },
        }),
      ]);
    } else if (step === "preferences") {
      const skills = skillsSchema.safeParse({ skills: fd.get("skills") ?? "" });
      const prefs = preferencesSchema.safeParse({
        preferredRoles: fd.get("preferredRoles") ?? "",
        preferredWorkplace: fd.getAll("preferredWorkplace"),
        salaryExpectation: fd.get("salaryExpectation") ?? "",
      });
      if (!skills.success) return zodFail(skills.error);
      if (!prefs.success) return zodFail(prefs.error);
      const ids: string[] = [];
      for (const name of skills.data.skills) {
        const slug = slugify(name);
        if (slug) ids.push((await db.skill.upsert({ where: { slug }, create: { name, slug }, update: {} })).id);
      }
      await db.$transaction([
        db.jobSeekerSkill.deleteMany({ where: { profileId: profile.id } }),
        db.jobSeekerSkill.createMany({ data: [...new Set(ids)].map((skillId) => ({ profileId: profile.id, skillId })) }),
        db.jobSeekerProfile.update({
          where: { id: profile.id },
          data: { preferredRoles: prefs.data.preferredRoles, preferredWorkplace: prefs.data.preferredWorkplace, salaryExpectation: prefs.data.salaryExpectation },
        }),
      ]);
    } else if (step === "background") {
      const title = String(fd.get("expTitle") ?? "").trim();
      const company = String(fd.get("expCompany") ?? "").trim();
      const start = String(fd.get("expStart") ?? "");
      if (title || company) {
        if (!title || !company || !/^\d{4}-\d{2}$/.test(start))
          return { error: "To add a role, fill in the title, employer and start month — or skip this for now.", fieldErrors: { expTitle: !title ? ["Required"] : undefined, expCompany: !company ? ["Required"] : undefined, expStart: !/^\d{4}-\d{2}$/.test(start) ? ["Choose a month"] : undefined } };
        await db.workExperience.create({
          data: { profileId: profile.id, title: title.slice(0, 100), company: company.slice(0, 100), startDate: new Date(`${start}-01T00:00:00Z`), isCurrent: fd.get("expCurrent") === "on" },
        });
      }
      const institution = String(fd.get("eduInstitution") ?? "").trim();
      const qualification = String(fd.get("eduQualification") ?? "").trim();
      if (institution || qualification) {
        if (!institution || !qualification) return { error: "To add education, fill in both the institution and qualification — or skip this for now." };
        const endYear = Number(fd.get("eduEndYear")) || null;
        await db.education.create({
          data: { profileId: profile.id, institution: institution.slice(0, 120), qualification: qualification.slice(0, 120), endYear: endYear && endYear > 1950 && endYear < 2040 ? endYear : null },
        });
      }
    } else if (step === "cv") {
      const links = personalSchema.pick({ portfolioUrl: true, linkedinUrl: true }).safeParse(formValues(fd, ["portfolioUrl", "linkedinUrl"]));
      if (!links.success) return zodFail(links.error);
      await db.jobSeekerProfile.update({ where: { id: profile.id }, data: links.data });
      const file = fd.get("cv");
      if (file instanceof File && file.size > 0) {
        const stored = await saveUpload({ file, purpose: "RESUME", ownerId: user.id });
        const count = await db.resume.count({ where: { userId: user.id } });
        await db.resume.create({ data: { userId: user.id, fileId: stored.id, label: "My CV", isDefault: count === 0 } });
      }
    }
    return { ok: true, data: { step } };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function completeOnboardingAction() {
  const user = await requireUser(["JOB_SEEKER", "EMPLOYER"]);
  await db.user.update({ where: { id: user.id }, data: { onboardedAt: new Date() } });
  await unstable_update({});
  redirect(user.role === "EMPLOYER" ? "/employer" : "/dashboard");
}

export async function createCompanyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const keys = ["name", "type", "tagline", "description", "industryId", "locationId", "size", "website", "contactEmail", "contactPhone", "foundedYear", "brandColor", "jobTitle"];
  const values = formValues(fd, keys);
  const parsed = companySchema.safeParse(values);
  if (!parsed.success) return zodFail(parsed.error, values);
  try {
    const user = await requireUser(["EMPLOYER"]);
    const existing = await db.employerProfile.findUnique({ where: { userId: user.id } });
    if (existing?.companyId) return { error: "You already have a company profile." };
    const [industry, location] = await Promise.all([
      db.industry.findUnique({ where: { id: parsed.data.industryId } }),
      db.location.findUnique({ where: { id: parsed.data.locationId } }),
    ]);
    if (!industry || !location) return { error: "Choose an industry and location from the lists." };

    let logoUrl: string | null = null;
    const logo = fd.get("logo");
    if (logo instanceof File && logo.size > 0) {
      const stored = await saveUpload({ file: logo, purpose: "LOGO", ownerId: user.id, visibility: "PUBLIC" });
      logoUrl = `/api/files/${stored.id}`;
    }
    const { jobTitle, ...company } = parsed.data;
    const base = slugify(company.name) || "company";
    const slug = (await db.company.findUnique({ where: { slug: base } })) ? `${base}-${randomSuffix(4)}` : base;
    const created = await db.company.create({ data: { ...company, slug, logoUrl } });
    await db.employerProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, companyId: created.id, jobTitle, isOwner: true },
      update: { companyId: created.id, jobTitle, isOwner: true },
    });

    // Optional verification request in the same step.
    const reg = String(fd.get("registrationNumber") ?? "").trim();
    if (reg) {
      const v = verificationSchema.safeParse({ registrationNumber: reg, notes: fd.get("verificationNotes") ?? "" });
      if (v.success) {
        let documentFileId: string | null = null;
        const doc = fd.get("verificationDoc");
        if (doc instanceof File && doc.size > 0) documentFileId = (await saveUpload({ file: doc, purpose: "VERIFICATION_DOC", ownerId: user.id })).id;
        await db.companyVerification.create({ data: { companyId: created.id, requestedById: user.id, ...v.data, documentFileId } });
        await db.company.update({ where: { id: created.id }, data: { verificationStatus: "PENDING" } });
      }
    }
    await db.user.update({ where: { id: user.id }, data: { onboardedAt: new Date() } });
  } catch (err) {
    return { ...handleActionError(err), values };
  }
  await unstable_update({});
  redirect("/employer");
}

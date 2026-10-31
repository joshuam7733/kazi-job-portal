import { PageHeader, Progress } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { profileCompleteness } from "@/lib/profile";
import { requirePageUser } from "@/lib/session";
import { EducationSection, ExperienceSection, PersonalSection, PreferencesSection, PrivacySection, ResumeSection, SkillsSection, SummarySection } from "./sections";

export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const user = await requirePageUser(["JOB_SEEKER"]);
  const [dbUser, profile, resumes] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true, email: true } }),
    db.jobSeekerProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
      include: {
        skills: { include: { skill: true } },
        experience: { orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }] },
        education: { orderBy: [{ endYear: { sort: "desc", nulls: "first" } }] },
      },
    }),
    db.resume.findMany({ where: { userId: user.id }, include: { file: true, _count: { select: { applications: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  const completeness = profileCompleteness({
    name: dbUser.name,
    headline: profile.headline,
    summary: profile.summary,
    locationText: profile.locationText,
    experienceLevel: profile.experienceLevel,
    skills: profile.skills.length,
    experience: profile.experience.length,
    education: profile.education.length,
    resumes: resumes.length,
    preferredRoles: profile.preferredRoles.length,
    links: [profile.portfolioUrl, profile.linkedinUrl, profile.githubUrl].filter(Boolean).length,
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="My profile" description="Employers you apply to see this profile alongside your CV." />
      <div className="rounded-[14px] border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-semibold">Profile strength</p>
          <p className="font-display text-xl font-semibold tabular">{completeness.score}%</p>
        </div>
        <Progress value={completeness.score} label="Profile completeness" className="mt-3" />
        {completeness.missing.length > 0 && <p className="mt-2 text-sm text-muted">Next: {completeness.missing[0].label.toLowerCase()}.</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <PersonalSection
          email={dbUser.email}
          values={{
            name: dbUser.name ?? "",
            headline: profile.headline ?? "",
            locationText: profile.locationText ?? "",
            phone: profile.phone ?? "",
            portfolioUrl: profile.portfolioUrl ?? "",
            linkedinUrl: profile.linkedinUrl ?? "",
            githubUrl: profile.githubUrl ?? "",
          }}
        />
        <div className="grid content-start gap-6">
          <SummarySection summary={profile.summary ?? ""} />
          <PreferencesSection
            values={{
              experienceLevel: profile.experienceLevel ?? "",
              preferredRoles: profile.preferredRoles.join(", "),
              preferredWorkplace: profile.preferredWorkplace,
              salaryExpectation: profile.salaryExpectation ? String(profile.salaryExpectation) : "",
            }}
          />
        </div>
      </div>
      <SkillsSection skills={profile.skills.map((s) => s.skill.name)} />
      <ExperienceSection
        items={profile.experience.map((e) => ({
          id: e.id,
          title: e.title,
          company: e.company,
          location: e.location ?? "",
          startDate: e.startDate.toISOString().slice(0, 7),
          endDate: e.endDate ? e.endDate.toISOString().slice(0, 7) : "",
          isCurrent: e.isCurrent,
          description: e.description ?? "",
        }))}
      />
      <EducationSection
        items={profile.education.map((e) => ({
          id: e.id,
          institution: e.institution,
          qualification: e.qualification,
          field: e.field ?? "",
          level: e.level ?? "",
          startYear: e.startYear ? String(e.startYear) : "",
          endYear: e.endYear ? String(e.endYear) : "",
        }))}
      />
      <ResumeSection
        resumes={resumes.map((r) => ({ id: r.id, label: r.label, fileId: r.fileId, fileName: r.file.originalName, size: r.file.size, isDefault: r.isDefault, createdAt: r.createdAt.toISOString(), used: r._count.applications }))}
      />
      <PrivacySection values={{ showPhoneToEmployers: profile.showPhoneToEmployers, allowEmployerMessages: profile.allowEmployerMessages, openToWork: profile.openToWork }} />
    </div>
  );
}

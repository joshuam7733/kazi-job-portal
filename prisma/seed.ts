import { PrismaClient, type ApplicationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ARTICLE_CATEGORIES,
  ARTICLES,
  CATEGORIES,
  CATEGORY_TEMPLATES,
  COMPANIES,
  INDUSTRIES,
  JOBS,
  LOCATIONS,
  SEEKER_NAMES,
} from "./seed-data";
import { scoreJobRisk } from "../src/lib/jobs/risk";

const db = new PrismaClient();

/** Demo password for every seeded account (documented in README). */
const DEMO_PASSWORD = "Kazi-demo-2026";
const DAY = 86_400_000;

// Deterministic PRNG so seeded data is stable between runs.
let state = 42;
const rand = () => ((state = (state * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

const slug = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);

// A tiny but valid one-page PDF used as each sample CV.
function samplePdf(name: string) {
  const text = `Sample CV - ${name} - KAZI demo data`.replace(/[()\\]/g, "");
  const stream = `BT /F1 18 Tf 72 720 Td (${text}) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  body += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body, "latin1");
}

async function writeUpload(key: string, data: Buffer) {
  if (process.env.STORAGE_DRIVER === "database") {
    await db.fileBlob.upsert({ where: { key }, create: { key, data: new Uint8Array(data) }, update: { data: new Uint8Array(data) } });
    return;
  }
  const full = path.resolve(process.cwd(), "storage", "uploads", key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}

async function reset() {
  // Order respects foreign keys.
  await db.$transaction([
    db.message.deleteMany(),
    db.conversationParticipant.deleteMany(),
    db.conversation.deleteMany(),
    db.notification.deleteMany(),
    db.interview.deleteMany(),
    db.applicationNote.deleteMany(),
    db.applicationStatusHistory.deleteMany(),
    db.application.deleteMany(),
    db.resume.deleteMany(),
    db.savedJob.deleteMany(),
    db.jobAlert.deleteMany(),
    db.report.deleteMany(),
    db.jobSkill.deleteMany(),
    db.job.deleteMany(),
    db.companyVerification.deleteMany(),
    db.employerProfile.deleteMany(),
    db.company.deleteMany(),
    db.jobSeekerSkill.deleteMany(),
    db.workExperience.deleteMany(),
    db.education.deleteMany(),
    db.jobSeekerProfile.deleteMany(),
    db.blogPost.deleteMany(),
    db.resourceCategory.deleteMany(),
    db.storedFile.deleteMany(),
    db.announcement.deleteMany(),
    db.adminAuditLog.deleteMany(),
    db.authToken.deleteMany(),
    db.account.deleteMany(),
    db.session.deleteMany(),
    db.user.deleteMany(),
    db.skill.deleteMany(),
    db.jobCategory.deleteMany(),
    db.industry.deleteMany(),
    db.location.deleteMany(),
    db.platformSetting.deleteMany(),
    db.newsletterSubscriber.deleteMany(),
    db.fileBlob.deleteMany(),
  ]);
}

async function main() {
  console.log("Resetting data…");
  await reset();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = Date.now();

  // ── Taxonomy ──
  const categories = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await db.jobCategory.create({ data: { ...c, sortOrder: i } });
    categories.set(c.slug, row.id);
  }
  const industries = new Map<string, string>();
  for (const name of INDUSTRIES) {
    const row = await db.industry.create({ data: { name, slug: slug(name) } });
    industries.set(name, row.id);
  }
  const locations = new Map<string, string>();
  for (const l of LOCATIONS) {
    const row = await db.location.create({
      data: { city: l.city, region: l.region, country: l.country, slug: slug(l.city), isFeatured: l.featured },
    });
    locations.set(l.city, row.id);
  }
  const skillIds = new Map<string, string>();
  const ensureSkill = async (name: string) => {
    if (skillIds.has(name)) return skillIds.get(name)!;
    const row = await db.skill.create({ data: { name, slug: slug(name) } });
    skillIds.set(name, row.id);
    return row.id;
  };

  // ── Admins ──
  const admin = await db.user.create({
    data: { name: "KAZI Admin", email: "admin@kazi.test", passwordHash, role: "ADMIN", adminRole: "SUPER_ADMIN", emailVerified: new Date(), onboardedAt: new Date(), isSample: true },
  });
  await db.user.create({
    data: { name: "Mariam Moderator", email: "moderator@kazi.test", passwordHash, role: "ADMIN", adminRole: "MODERATOR", emailVerified: new Date(), onboardedAt: new Date(), isSample: true },
  });
  await db.user.create({
    data: { name: "Edwin Editor", email: "editor@kazi.test", passwordHash, role: "ADMIN", adminRole: "CONTENT_EDITOR", emailVerified: new Date(), onboardedAt: new Date(), isSample: true },
  });

  // ── Companies & employer users ──
  const companyIds = new Map<string, { id: string; ownerId: string; verified: boolean; createdAt: Date; benefits: string[] }>();
  for (const c of COMPANIES) {
    const createdAt = new Date(now - (c.verified === "UNVERIFIED" ? 1 : 120 + Math.floor(rand() * 200)) * DAY);
    const owner = await db.user.create({
      data: {
        name: c.owner.name,
        email: c.owner.email,
        passwordHash,
        role: "EMPLOYER",
        emailVerified: new Date(),
        onboardedAt: createdAt,
        isSample: true,
        createdAt,
      },
    });
    const company = await db.company.create({
      data: {
        name: c.name,
        slug: slug(c.name),
        type: c.type ?? "EMPLOYER",
        tagline: c.tagline,
        description: c.description,
        website: `https://${slug(c.name)}.example`,
        contactEmail: c.owner.email,
        size: c.size,
        foundedYear: c.founded,
        brandColor: c.brandColor,
        industryId: industries.get(c.industry),
        locationId: locations.get(c.city),
        verificationStatus: c.verified,
        verifiedAt: c.verified === "VERIFIED" ? createdAt : null,
        isFeatured: c.featured ?? false,
        isSample: true,
        createdAt,
      },
    });
    await db.employerProfile.create({
      data: { userId: owner.id, companyId: company.id, jobTitle: c.owner.title, isOwner: true },
    });
    if (c.verified !== "UNVERIFIED") {
      await db.companyVerification.create({
        data: {
          companyId: company.id,
          requestedById: owner.id,
          registrationNumber: `80020000${Math.floor(rand() * 90000 + 10000)}`,
          notes: "Certificate of incorporation available on request.",
          status: c.verified,
          reviewerId: c.verified === "VERIFIED" ? admin.id : null,
          reviewedAt: c.verified === "VERIFIED" ? createdAt : null,
          createdAt,
        },
      });
    }
    companyIds.set(c.key, { id: company.id, ownerId: owner.id, verified: c.verified === "VERIFIED", createdAt, benefits: c.benefits });
  }

  // ── Jobs ──
  const jobIds: { id: string; companyKey: string; status: string; title: string; slug: string; questions: { id: string; label: string; type: string; required: boolean }[] }[] = [];
  for (const j of JOBS) {
    const co = companyIds.get(j.company)!;
    const tpl = CATEGORY_TEMPLATES[j.category];
    const status = j.status ?? "PUBLISHED";
    const publishedAt = status === "PUBLISHED" || status === "CLOSED" ? new Date(now - j.daysAgo * DAY - Math.floor(rand() * 8) * 3_600_000) : null;
    const questions = (j.questions ?? []).map((q, i) => ({ id: `q${i + 1}`, ...q }));
    const description = `${j.summary}\n\nYou'll join ${COMPANIES.find((c) => c.key === j.company)!.name} as a ${j.title.replace(/ \(.*\)$/, "")}, working closely with a supportive team that values clear communication and steady growth.${j.extraDescription ? `\n\n${j.extraDescription}` : ""}`;
    const risk = scoreJobRisk({
      title: j.title,
      summary: j.summary,
      description,
      requirements: tpl.requirements.join("\n"),
      responsibilities: tpl.responsibilities.join("\n"),
      benefits: co.benefits.join("\n"),
      salaryMin: j.salary?.[0],
      salaryMax: j.salary?.[1],
      salaryPeriod: "MONTH",
      companyVerified: co.verified,
      companyAgeDays: Math.floor((now - co.createdAt.getTime()) / DAY),
    });
    const jobSlug = `${slug(j.title)}-${slug(COMPANIES.find((c) => c.key === j.company)!.name).split("-")[0]}-${jobIds.length + 1}`;
    const job = await db.job.create({
      data: {
        slug: jobSlug,
        title: j.title,
        companyId: co.id,
        postedById: co.ownerId,
        categoryId: categories.get(j.category),
        locationId: locations.get(j.city),
        workplace: j.workplace,
        employmentType: j.type,
        experienceLevel: j.exp,
        educationLevel: j.edu,
        salaryMin: j.salary?.[0] ?? null,
        salaryMax: j.salary?.[1] ?? null,
        salaryCurrency: j.currency ?? "UGX",
        showSalary: Boolean(j.salary),
        summary: j.summary,
        description,
        responsibilities: tpl.responsibilities.join("\n"),
        requirements: tpl.requirements.join("\n"),
        preferredQualifications: tpl.preferred.join("\n"),
        benefits: co.benefits.join("\n"),
        questions,
        deadline: j.deadlineIn !== undefined ? new Date(now + j.deadlineIn * DAY) : null,
        status,
        isFeatured: j.featured ?? false,
        riskScore: risk.score,
        riskFlags: risk.flags,
        publishedAt,
        closedAt: status === "CLOSED" ? new Date(now - 10 * DAY) : null,
        viewCount: status === "PUBLISHED" ? 40 + Math.floor(rand() * 900) : 0,
        isSample: true,
        createdAt: new Date(now - (j.daysAgo + 1) * DAY),
      },
    });
    for (const s of j.skills) {
      await db.jobSkill.create({ data: { jobId: job.id, skillId: await ensureSkill(s) } });
    }
    jobIds.push({ id: job.id, companyKey: j.company, status, title: j.title, slug: jobSlug, questions });
  }

  // ── Job seekers ──
  const seekerEmails: string[] = [];
  const seekers: { id: string; name: string; resumeId: string }[] = [];
  const allNames = ["Alex Mukasa", ...SEEKER_NAMES];
  for (const [i, name] of allNames.entries()) {
    const isMain = i === 0;
    const email = isMain ? "seeker@kazi.test" : `${slug(name).replace(/-/g, ".")}@example.test`;
    seekerEmails.push(email);
    const createdAt = new Date(now - (isMain ? 60 : Math.floor(rand() * 175) + 1) * DAY);
    const user = await db.user.create({
      data: { name, email, passwordHash, role: "JOB_SEEKER", emailVerified: createdAt, onboardedAt: createdAt, isSample: true, createdAt, lastLoginAt: new Date(now - Math.floor(rand() * 20) * DAY) },
    });
    const headline = isMain
      ? "Frontend developer building accessible web apps"
      : pick(["Accountant (ACCA part-qualified)", "Registered nurse", "Software developer", "Sales and marketing professional", "Logistics coordinator", "Data analyst", "Graduate — Bachelor of Commerce", "Customer service specialist"]);
    const profile = await db.jobSeekerProfile.create({
      data: {
        userId: user.id,
        headline,
        summary: isMain
          ? "Frontend developer with three years of experience building React applications for fintech and logistics companies. I care about accessible, fast interfaces that work well on low-end Android phones and slow networks."
          : `${headline} based in ${pick(["Kampala", "Mbarara", "Gulu", "Jinja", "Entebbe"])}, looking for my next opportunity.`,
        locationText: isMain ? "Kampala, Uganda" : `${pick(["Kampala", "Mbarara", "Gulu", "Jinja", "Entebbe"])}, Uganda`,
        experienceLevel: isMain ? "MID" : pick(["ENTRY", "JUNIOR", "MID", "SENIOR"] as const),
        preferredRoles: isMain ? ["Frontend Developer", "Product Engineer"] : [headline.split(" (")[0]],
        preferredWorkplace: isMain ? ["HYBRID", "REMOTE"] : [pick(["ONSITE", "HYBRID", "REMOTE"] as const)],
        salaryExpectation: isMain ? 6_000_000 : null,
        portfolioUrl: isMain ? "https://alex-mukasa.example" : null,
        linkedinUrl: isMain ? "https://www.linkedin.com/in/alex-mukasa-example" : null,
        phone: isMain ? "+256 700 000 101" : null,
      },
    });
    if (isMain) {
      for (const s of ["React", "TypeScript", "Tailwind CSS", "Accessibility", "JavaScript", "Git"]) {
        await db.jobSeekerSkill.create({ data: { profileId: profile.id, skillId: await ensureSkill(s) } });
      }
      await db.workExperience.createMany({
        data: [
          { profileId: profile.id, title: "Frontend Developer", company: "Riverbank Digital (sample)", location: "Kampala", startDate: new Date("2023-02-01"), isCurrent: true, description: "Built a React component library used across four products.\nCut dashboard load time by 40% on 3G connections." },
          { profileId: profile.id, title: "Junior Web Developer", company: "Copperline Studio (sample)", location: "Kampala", startDate: new Date("2021-06-01"), endDate: new Date("2023-01-31"), description: "Delivered marketing sites and e-commerce stores for 20+ clients." },
        ],
      });
      await db.education.create({
        data: { profileId: profile.id, institution: "Makerere University", qualification: "BSc Computer Science", field: "Computer Science", level: "BACHELORS", startYear: 2017, endYear: 2021 },
      });
    }
    const key = `resume/sample-${slug(name)}.pdf`;
    const pdf = samplePdf(name);
    await writeUpload(key, pdf);
    const file = await db.storedFile.create({
      data: { key, originalName: `${name.replace(/\s+/g, "_")}_CV.pdf`, mimeType: "application/pdf", size: pdf.length, purpose: "RESUME", visibility: "PRIVATE", ownerId: user.id },
    });
    const resume = await db.resume.create({ data: { userId: user.id, fileId: file.id, label: isMain ? "Frontend CV — 2026" : "My CV", isDefault: true } });
    seekers.push({ id: user.id, name, resumeId: resume.id });
  }

  // ── Applications ──
  const published = jobIds.filter((j) => j.status === "PUBLISHED");
  const mainSeeker = seekers[0];
  const mweziOwner = companyIds.get("mwezi")!.ownerId;
  const flow: ApplicationStatus[] = ["SUBMITTED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"];

  async function apply(seeker: (typeof seekers)[number], job: (typeof jobIds)[number], status: ApplicationStatus, daysAgo: number, cover?: string) {
    const createdAt = new Date(now - daysAgo * DAY);
    const app = await db.application.create({
      data: {
        jobId: job.id,
        candidateId: seeker.id,
        resumeId: seeker.resumeId,
        coverLetter: cover ?? `Dear hiring team,\n\nI'm excited to apply for the ${job.title} role. My experience matches what you're looking for and I'd welcome the chance to discuss it.\n\nKind regards,\n${seeker.name}`,
        answers: job.questions.map((q) => ({ questionId: q.id, label: q.label, answer: q.type === "yesno" ? "Yes" : "I led the rollback and post-incident review for a payments outage in 2025." })),
        status,
        withdrawnAt: status === "WITHDRAWN" ? new Date(createdAt.getTime() + DAY) : null,
        createdAt,
      },
    });
    await db.applicationStatusHistory.create({ data: { applicationId: app.id, toStatus: "SUBMITTED", createdAt } });
    const target = flow.indexOf(status);
    const path = target > 0 ? flow.slice(1, target + 1) : status === "REJECTED" ? (["SCREENING", "REJECTED"] as ApplicationStatus[]) : status === "WITHDRAWN" ? (["WITHDRAWN"] as ApplicationStatus[]) : [];
    let prev: ApplicationStatus = "SUBMITTED";
    for (const [i, s] of path.entries()) {
      await db.applicationStatusHistory.create({
        data: { applicationId: app.id, fromStatus: prev, toStatus: s, changedById: s === "WITHDRAWN" ? seeker.id : companyIds.get(job.companyKey)!.ownerId, createdAt: new Date(createdAt.getTime() + (i + 1) * DAY * 0.8) },
      });
      prev = s;
    }
    return app;
  }

  const byTitle = (t: string) => published.find((j) => j.title === t)!;
  const mainApps = [
    await apply(mainSeeker, byTitle("Frontend Developer (React)"), "INTERVIEW", 9),
    await apply(mainSeeker, byTitle("Product Designer"), "SCREENING", 5),
    await apply(mainSeeker, byTitle("Growth Marketing Lead"), "SUBMITTED", 1),
    await apply(mainSeeker, byTitle("Mobile Engineer (Flutter)"), "REJECTED", 14),
    await apply(mainSeeker, byTitle("Fleet Data Analyst"), "WITHDRAWN", 6),
  ];

  // Populate other pipelines
  for (const seeker of seekers.slice(1)) {
    const picks = [...published].sort(() => rand() - 0.5).slice(0, 2 + Math.floor(rand() * 3));
    for (const job of picks) {
      const r = rand();
      const status: ApplicationStatus = r < 0.4 ? "SUBMITTED" : r < 0.6 ? "SCREENING" : r < 0.72 ? "SHORTLISTED" : r < 0.82 ? "INTERVIEW" : r < 0.87 ? "OFFER" : r < 0.9 ? "HIRED" : "REJECTED";
      await apply(seeker, job, status, Math.floor(rand() * 40) + 1).catch(() => undefined);
    }
  }

  // Private recruiter notes & interview for the main seeker's interview-stage application
  await db.applicationNote.create({
    data: { applicationId: mainApps[0].id, authorId: mweziOwner, body: "Strong portfolio — accessible component library is exactly what we need. Check React Server Components experience in the interview." },
  });
  const interviewAt = new Date(now + 3 * DAY);
  interviewAt.setHours(10, 0, 0, 0);
  await db.interview.create({
    data: { applicationId: mainApps[0].id, scheduledAt: interviewAt, durationMins: 60, mode: "VIDEO", location: "Video link will be shared by email", details: "Technical conversation with two engineers. No preparation needed beyond your portfolio.", createdById: mweziOwner },
  });

  // Conversation
  const convo = await db.conversation.create({
    data: {
      subject: "Frontend Developer (React) — interview",
      applicationId: mainApps[0].id,
      participants: { create: [{ userId: mainSeeker.id, lastReadAt: new Date(now - 2 * DAY) }, { userId: mweziOwner, lastReadAt: new Date() }] },
    },
  });
  await db.message.createMany({
    data: [
      { conversationId: convo.id, senderId: mweziOwner, body: "Hi Alex, thanks for applying. We'd love to invite you to a technical conversation. I've scheduled it for later this week — does that time work for you?", createdAt: new Date(now - 2 * DAY) },
      { conversationId: convo.id, senderId: mainSeeker.id, body: "Thank you, Grace! That time works well. Looking forward to it.", createdAt: new Date(now - 2 * DAY + 3_600_000) },
      { conversationId: convo.id, senderId: mweziOwner, body: "Great. You'll get the video link by email the day before.", createdAt: new Date(now - DAY) },
    ],
  });

  // Saved jobs, alerts, notifications for main seeker
  for (const t of ["Senior Backend Engineer", "Data Engineer", "Software Engineering Intern", "Health Data Analyst"]) {
    await db.savedJob.create({ data: { userId: mainSeeker.id, jobId: byTitle(t).id, folder: t.includes("Data") ? "Data roles" : "Saved" } });
  }
  await db.jobAlert.createMany({
    data: [
      { userId: mainSeeker.id, name: "Remote React jobs", filters: { q: "React", wp: ["remote", "hybrid"] }, frequency: "DAILY" },
      { userId: mainSeeker.id, name: "Software jobs in Kampala", filters: { cat: "software-it", loc: "kampala" }, frequency: "WEEKLY" },
    ],
  });
  await db.notification.createMany({
    data: [
      { userId: mainSeeker.id, type: "INTERVIEW_INVITE", title: "Interview invitation from Mwezi Software Labs", body: "Frontend Developer (React) — video interview scheduled.", link: `/dashboard/applications/${mainApps[0].id}`, createdAt: new Date(now - 2 * DAY) },
      { userId: mainSeeker.id, type: "MESSAGE", title: "New message from Grace Nakato", body: "You'll get the video link by email the day before.", link: `/messages/${convo.id}`, createdAt: new Date(now - DAY) },
      { userId: mainSeeker.id, type: "APPLICATION_STATUS", title: "Your application is under review", body: "Product Designer at Mwezi Software Labs", link: `/dashboard/applications/${mainApps[1].id}`, createdAt: new Date(now - 4 * DAY), readAt: new Date(now - 3 * DAY) },
      { userId: mainSeeker.id, type: "ANNOUNCEMENT", title: "Welcome to KAZI", body: "Complete your profile to get better job suggestions.", link: "/dashboard/profile", createdAt: new Date(now - 60 * DAY), readAt: new Date(now - 59 * DAY) },
      { userId: mweziOwner, type: "APPLICATION_RECEIVED", title: "New application: Growth Marketing Lead", body: "Alex Mukasa applied.", link: "/employer/jobs", createdAt: new Date(now - DAY) },
    ],
  });

  // ── Reports & verification queue ──
  const scam = jobIds.find((j) => j.companyKey === "quick-placements")!;
  await db.report.create({
    data: { jobId: scam.id, reporterId: seekers[3].id, reason: "ASKS_FOR_PAYMENT", details: "The advert asks for a registration fee before any interview." },
  });

  // ── Career resources ──
  const resCats = new Map<string, string>();
  for (const c of ARTICLE_CATEGORIES) {
    const row = await db.resourceCategory.create({ data: c });
    resCats.set(c.slug, row.id);
  }
  for (const [i, a] of ARTICLES.entries()) {
    await db.blogPost.create({
      data: {
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        content: a.content,
        categoryId: resCats.get(a.category),
        authorId: admin.id,
        status: "PUBLISHED",
        readingMinutes: a.minutes,
        isFeatured: a.featured ?? false,
        seoDescription: a.excerpt,
        isSample: true,
        publishedAt: new Date(now - (i * 6 + 2) * DAY),
      },
    });
  }

  // ── Settings & audit ──
  const settings = {
    requireJobApproval: false,
    allowEmployerSignup: true,
    allowSeekerSignup: true,
    maintenanceBanner: "",
    heroHeadline: "Your Next Opportunity Starts Here.",
    heroSubtext: "Discover meaningful career opportunities, connect with trusted employers, and take the next step toward your future.",
    popularSearches: ["Accountant", "Software developer", "Nurse", "Sales", "Data analyst", "Internship"],
    riskThreshold: 40,
    supportEmail: "support@kazi.example",
  };
  for (const [key, value] of Object.entries(settings)) await db.platformSetting.create({ data: { key, value } });
  await db.adminAuditLog.create({ data: { actorId: admin.id, action: "seed.run", entityType: "System", summary: "Loaded sample data" } });

  console.log(`Seeded ${jobIds.length} jobs, ${COMPANIES.length} companies, ${seekers.length} job seekers.`);
  console.log(`Demo accounts use password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

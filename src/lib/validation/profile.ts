import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
  .pipe(z.union([z.literal(""), z.string().url("Enter a valid web address")]))
  .optional()
  .transform((v) => v || null);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

export const personalSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  headline: optionalText(120),
  locationText: optionalText(80),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+\d\s()-]*$/, "Use digits, spaces and + only")
    .optional()
    .transform((v) => v || null),
  portfolioUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
});

export const summarySchema = z.object({ summary: optionalText(3000) });

export const preferencesSchema = z.object({
  experienceLevel: z.enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"]).optional().or(z.literal("").transform(() => undefined)),
  preferredRoles: z
    .string()
    .max(300)
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5),
    ),
  preferredWorkplace: z.array(z.enum(["ONSITE", "REMOTE", "HYBRID"])).default([]),
  salaryExpectation: z
    .string()
    .optional()
    .transform((v) => (v ? Number(String(v).replace(/[^\d]/g, "")) : null))
    .pipe(z.number().int().min(0).max(1_000_000_000).nullable()),
  openToWork: z.boolean().default(true),
});

export const skillsSchema = z.object({
  skills: z
    .string()
    .max(600)
    .transform((v) =>
      [...new Set(v.split(",").map((s) => s.trim().replace(/\s+/g, " ")).filter((s) => s.length >= 1 && s.length <= 40))].slice(0, 25),
    ),
});

const monthInput = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Choose a month")
  .transform((v) => new Date(`${v}-01T00:00:00Z`));

export const experienceSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(2, "Enter your job title").max(100),
    company: z.string().trim().min(2, "Enter the employer").max(100),
    location: optionalText(80),
    startDate: monthInput,
    endDate: z.union([z.literal("").transform(() => null), monthInput]).optional().transform((v) => v ?? null),
    isCurrent: z.literal("on").optional().transform(Boolean),
    description: optionalText(2000),
  })
  .refine((d) => d.isCurrent || d.endDate, { path: ["endDate"], message: "Add an end date, or tick “I work here now”" })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, { path: ["endDate"], message: "End date must be after the start date" });

const year = z
  .string()
  .optional()
  .transform((v) => (v ? Number(v) : null))
  .pipe(z.number().int().min(1950).max(2040).nullable());

export const educationSchema = z
  .object({
    id: z.string().optional(),
    institution: z.string().trim().min(2, "Enter the institution").max(120),
    qualification: z.string().trim().min(2, "Enter the qualification").max(120),
    field: optionalText(120),
    level: z.enum(["NONE", "CERTIFICATE", "DIPLOMA", "BACHELORS", "MASTERS", "DOCTORATE"]).optional().or(z.literal("").transform(() => undefined)),
    startYear: year,
    endYear: year,
  })
  .refine((d) => !d.startYear || !d.endYear || d.endYear >= d.startYear, { path: ["endYear"], message: "End year must be after the start year" });

export const privacySchema = z.object({
  showPhoneToEmployers: z.boolean(),
  allowEmployerMessages: z.boolean(),
  openToWork: z.boolean(),
});

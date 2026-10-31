import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

export const companySchema = z.object({
  name: z.string().trim().min(2, "Enter the company name").max(100),
  type: z.enum(["EMPLOYER", "AGENCY"]).default("EMPLOYER"),
  tagline: optionalText(140),
  description: z.string().trim().min(40, "Describe the company in at least 40 characters").max(4000),
  industryId: z.string().min(1, "Choose an industry"),
  locationId: z.string().min(1, "Choose a location"),
  size: z.enum(["S1_10", "S11_50", "S51_200", "S201_500", "S501_1000", "S1000_PLUS"], { errorMap: () => ({ message: "Choose a company size" }) }),
  website: z
    .string()
    .trim()
    .max(200)
    .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
    .pipe(z.union([z.literal(""), z.string().url("Enter a valid web address")]))
    .optional()
    .transform((v) => v || null),
  contactEmail: z.string().trim().toLowerCase().email("Enter a valid email"),
  contactPhone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+\d\s()-]*$/, "Use digits, spaces and + only")
    .optional()
    .transform((v) => v || null),
  foundedYear: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .pipe(z.number().int().min(1800).max(new Date().getFullYear()).nullable()),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  jobTitle: optionalText(80),
});

export const verificationSchema = z.object({
  registrationNumber: z.string().trim().min(4, "Enter your registration number").max(60),
  notes: optionalText(1000),
});

export const jobBaseSchema = z.object({
    title: z.string().trim().min(3, "Enter a job title").max(120),
    categoryId: z.string().min(1, "Choose a category"),
    locationId: z.string().min(1, "Choose a location"),
    workplace: z.enum(["ONSITE", "REMOTE", "HYBRID"]),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"]),
    experienceLevel: z.enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"]),
    educationLevel: z.enum(["NONE", "CERTIFICATE", "DIPLOMA", "BACHELORS", "MASTERS", "DOCTORATE"]),
    openings: z.coerce.number().int().min(1).max(500).default(1),
    salaryMin: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v.replace(/[^\d]/g, "")) : null))
      .pipe(z.number().int().min(0).max(10_000_000_000).nullable()),
    salaryMax: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v.replace(/[^\d]/g, "")) : null))
      .pipe(z.number().int().min(0).max(10_000_000_000).nullable()),
    salaryCurrency: z.enum(["UGX", "KES", "TZS", "RWF", "USD"]).default("UGX"),
    salaryPeriod: z.enum(["MONTH", "YEAR"]).default("MONTH"),
    showSalary: z.boolean().default(true),
    summary: z.string().trim().min(20, "Write a one-sentence summary (at least 20 characters)").max(220),
    description: z.string().trim().min(80, "Describe the role in at least 80 characters").max(8000),
    responsibilities: z.string().trim().min(20, "List the main responsibilities").max(5000),
    requirements: z.string().trim().min(20, "List the requirements").max(5000),
    preferredQualifications: optionalText(3000),
    benefits: optionalText(3000),
    skills: z
      .string()
      .max(500)
      .optional()
      .transform((v) =>
        [...new Set((v ?? "").split(",").map((s) => s.trim()).filter((s) => s.length > 0 && s.length <= 40))].slice(0, 12),
      ),
    deadline: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(`${v}T23:59:59`) : null)),
    questions: z
      .array(z.object({ id: z.string(), label: z.string().trim().min(3).max(200), type: z.enum(["text", "yesno"]), required: z.boolean() }))
      .max(8)
      .default([]),
  });

export const jobSchema = jobBaseSchema
  .refine((d) => !d.salaryMin || !d.salaryMax || d.salaryMax >= d.salaryMin, { path: ["salaryMax"], message: "Maximum must be at least the minimum" })
  .refine((d) => !d.deadline || d.deadline > new Date(), { path: ["deadline"], message: "Choose a date in the future" });

export type JobInput = z.infer<typeof jobSchema>;

/** For drafts: keep every field that parses on its own and drop the rest. */
export function lenientJobParse(raw: Record<string, unknown>): Partial<JobInput> {
  const out: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(jobBaseSchema.shape)) {
    const r = (schema as z.ZodTypeAny).safeParse(raw[key]);
    if (r.success && r.data !== undefined) out[key] = r.data;
  }
  return out as Partial<JobInput>;
}

import "server-only";
import { cache } from "react";
import { z } from "zod";
import { db } from "@/lib/db";

export const settingsSchema = z.object({
  /** Jobs from unverified companies, or with a high risk score, always go to review. When true, every job does. */
  requireJobApproval: z.boolean().default(false),
  allowEmployerSignup: z.boolean().default(true),
  allowSeekerSignup: z.boolean().default(true),
  maintenanceBanner: z.string().max(200).default(""),
  heroHeadline: z.string().min(5).max(80).default("Your Next Opportunity Starts Here."),
  heroSubtext: z
    .string()
    .min(10)
    .max(220)
    .default(
      "Discover meaningful career opportunities, connect with trusted employers, and take the next step toward your future.",
    ),
  popularSearches: z.array(z.string().min(1).max(40)).max(8).default(["Accountant", "Software developer", "Nurse", "Sales", "Data analyst", "Teacher"]),
  riskThreshold: z.number().int().min(10).max(100).default(40),
  supportEmail: z.string().email().default("support@kazi.example"),
});

export type PlatformSettings = z.infer<typeof settingsSchema>;

export const getSettings = cache(async (): Promise<PlatformSettings> => {
  const rows = await db.platformSetting.findMany();
  const raw = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const parsed = settingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : settingsSchema.parse({});
});

export async function saveSettings(values: Partial<PlatformSettings>) {
  const current = await getSettings();
  const next = settingsSchema.parse({ ...current, ...values });
  await db.$transaction(
    Object.entries(next).map(([key, value]) =>
      db.platformSetting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );
  return next;
}

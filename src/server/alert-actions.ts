"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { filtersToSearchParams, parseJobFilters } from "@/lib/jobs/filters";
import { requireUser } from "@/lib/session";
import { handleActionError, zodFail, type ActionState } from "./action-utils";

const alertSchema = z.object({
  name: z.string().trim().min(2, "Give the alert a name").max(60),
  frequency: z.enum(["INSTANT", "DAILY", "WEEKLY"]),
  query: z.string().max(1000).default(""),
});

/** Stores only normalised, known filter keys. */
function normaliseQuery(query: string) {
  const f = parseJobFilters(Object.fromEntries(new URLSearchParams(query)));
  return Object.fromEntries(filtersToSearchParams({ ...f, page: 1, sort: "newest" }));
}

export async function createAlertAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = alertSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const user = await requireUser(["JOB_SEEKER"]);
    const count = await db.jobAlert.count({ where: { userId: user.id } });
    if (count >= 20) return { error: "You can have up to 20 alerts. Delete one to add another." };
    await db.jobAlert.create({
      data: { userId: user.id, name: parsed.data.name, frequency: parsed.data.frequency, filters: normaliseQuery(parsed.data.query) },
    });
    revalidatePath("/dashboard/alerts");
    return { ok: true, message: "Alert created. We'll notify you about new matching jobs." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function updateAlertAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("id") ?? "");
  const parsed = alertSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const user = await requireUser(["JOB_SEEKER"]);
    const res = await db.jobAlert.updateMany({
      where: { id, userId: user.id },
      data: { name: parsed.data.name, frequency: parsed.data.frequency, filters: normaliseQuery(parsed.data.query) },
    });
    if (!res.count) return { error: "Alert not found." };
    revalidatePath("/dashboard/alerts");
    return { ok: true, message: "Alert updated." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function toggleAlertAction(id: string, isActive: boolean) {
  const user = await requireUser(["JOB_SEEKER"]);
  await db.jobAlert.updateMany({ where: { id, userId: user.id }, data: { isActive: Boolean(isActive) } });
  revalidatePath("/dashboard/alerts");
}

export async function deleteAlertAction(id: string) {
  const user = await requireUser(["JOB_SEEKER"]);
  await db.jobAlert.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/alerts");
}

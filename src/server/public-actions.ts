"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { limitAction } from "@/lib/rate-limit";
import { handleActionError, type ActionState } from "./action-utils";

export async function subscribeAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = z.string().trim().toLowerCase().email().safeParse(fd.get("email"));
  if (!parsed.success) return { fieldErrors: { email: ["Enter a valid email address"] } };
  try {
    if (!(await limitAction("subscribe", 5, 60 * 60_000)).ok) return { error: "Too many requests. Try again later." };
    await db.newsletterSubscriber.upsert({ where: { email: parsed.data }, create: { email: parsed.data }, update: {} });
    return { ok: true, message: "You're subscribed. We'll send a weekly round-up of new jobs and career advice." };
  } catch (err) {
    return handleActionError(err);
  }
}

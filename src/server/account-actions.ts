"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { verifyPassword } from "@/lib/password";
import { limitAction } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";
import { deleteStoredFile } from "@/lib/storage";
import { handleActionError, type ActionState } from "./action-utils";

// ─── Notifications ──────────────────────────────────────────────────────────

export async function markNotificationReadAction(id: string) {
  const user = await requireUser();
  await db.notification.updateMany({ where: { id, userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}

// ─── Messages ───────────────────────────────────────────────────────────────

export async function sendMessageAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const conversationId = String(fd.get("conversationId") ?? "");
  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 1) return { fieldErrors: { body: ["Write a message first"] } };
  if (body.length > 4000) return { fieldErrors: { body: ["Keep messages under 4,000 characters"] } };
  try {
    const user = await requireUser(["JOB_SEEKER", "EMPLOYER"]);
    if (!(await limitAction("message", 60, 60 * 60_000, user.id)).ok) return { error: "You're sending messages too quickly. Try again shortly." };
    const convo = await db.conversation.findFirst({
      where: { id: conversationId, participants: { some: { userId: user.id } } },
      include: { participants: true, application: { include: { job: { include: { company: true } } } } },
    });
    if (!convo) return { error: "Conversation not found." };
    if (convo.application?.status === "WITHDRAWN") return { error: "This application was withdrawn, so the conversation is closed." };
    await db.$transaction([
      db.message.create({ data: { conversationId: convo.id, senderId: user.id, body } }),
      db.conversation.update({ where: { id: convo.id }, data: { updatedAt: new Date() } }),
      db.conversationParticipant.update({ where: { conversationId_userId: { conversationId: convo.id, userId: user.id } }, data: { lastReadAt: new Date() } }),
    ]);
    const sender = user.role === "EMPLOYER" ? (convo.application?.job.company.name ?? user.name ?? "An employer") : (user.name ?? "A candidate");
    await Promise.all(
      convo.participants
        .filter((p) => p.userId !== user.id)
        .map((p) => notify({ userId: p.userId, type: "MESSAGE", title: `New message from ${sender}`, body: body.slice(0, 140), link: `/messages/${convo.id}`, email: true })),
    );
    revalidatePath(`/messages/${convo.id}`);
    revalidatePath("/messages");
    return { ok: true };
  } catch (err) {
    return handleActionError(err);
  }
}

// ─── Account ────────────────────────────────────────────────────────────────

export async function saveEmailPreferencesAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    await db.user.update({
      where: { id: user.id },
      data: {
        emailApplicationUpdates: fd.get("emailApplicationUpdates") === "on",
        emailMessages: fd.get("emailMessages") === "on",
        emailJobAlerts: fd.get("emailJobAlerts") === "on",
        emailMarketing: fd.get("emailMarketing") === "on",
      },
    });
    revalidatePath("/settings");
    return { ok: true, message: "Email preferences saved." };
  } catch (err) {
    return handleActionError(err);
  }
}

/**
 * Permanently deletes the account. Profiles, CVs, applications, saved jobs, alerts, notifications
 * and messages participation cascade in the database; stored CV files are removed from storage.
 * The sole owner of a company with other members can't delete until ownership is handled by support.
 */
export async function deleteAccountAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const sessionUser = await requireUser();
    if (!(await limitAction("delete-account", 5, 60 * 60_000, sessionUser.id)).ok) return { error: "Too many attempts. Try again later." };
    if (String(fd.get("confirm") ?? "").trim() !== "DELETE") return { fieldErrors: { confirm: ["Type DELETE to confirm"] } };
    const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id }, include: { employerProfile: true, files: true } });
    if (user.passwordHash) {
      const ok = await verifyPassword(String(fd.get("password") ?? ""), user.passwordHash);
      if (!ok) return { fieldErrors: { password: ["That password isn't right"] } };
    }
    if (user.role === "ADMIN" && user.adminRole === "SUPER_ADMIN") {
      const others = await db.user.count({ where: { role: "ADMIN", adminRole: "SUPER_ADMIN", status: "ACTIVE", id: { not: user.id } } });
      if (others === 0) return { error: "You're the only super admin. Promote another admin before deleting your account." };
    }
    if (user.employerProfile?.companyId && user.employerProfile.isOwner) {
      const members = await db.employerProfile.count({ where: { companyId: user.employerProfile.companyId } });
      if (members === 1) {
        // Last member: remove the company and its jobs too.
        await db.company.delete({ where: { id: user.employerProfile.companyId } });
      }
    }
    for (const f of user.files.filter((f) => f.purpose === "RESUME" || f.purpose === "AVATAR")) await deleteStoredFile(f.id);
    await db.user.delete({ where: { id: user.id } });
  } catch (err) {
    return handleActionError(err);
  }
  await signOut({ redirectTo: "/?deleted=1" });
  return { ok: true };
}

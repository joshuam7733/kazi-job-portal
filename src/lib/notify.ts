import "server-only";
import type { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { layout } from "@/lib/mail/templates";

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  /** Send an email too, subject to the user's preferences. */
  email?: boolean;
};

const EMAIL_PREF: Partial<Record<NotificationType, "emailApplicationUpdates" | "emailMessages" | "emailJobAlerts">> = {
  APPLICATION_RECEIVED: "emailApplicationUpdates",
  APPLICATION_STATUS: "emailApplicationUpdates",
  INTERVIEW_INVITE: "emailApplicationUpdates",
  MESSAGE: "emailMessages",
  JOB_ALERT: "emailJobAlerts",
};

export async function notify(input: NotifyInput) {
  const notification = await db.notification.create({
    data: { userId: input.userId, type: input.type, title: input.title, body: input.body, link: input.link },
  });
  if (input.email) {
    const user = await db.user.findUnique({ where: { id: input.userId } });
    const pref = EMAIL_PREF[input.type];
    if (user && user.status === "ACTIVE" && (!pref || user[pref])) {
      const { html, text } = layout({
        heading: input.title,
        body: input.body ?? "",
        cta: input.link ? { label: "Open in KAZI", href: input.link } : undefined,
      });
      await sendMail({ to: user.email, subject: input.title, html, text });
    }
  }
  return notification;
}

export async function notifyMany(userIds: string[], data: Omit<NotifyInput, "userId" | "email">) {
  if (userIds.length === 0) return 0;
  const res = await db.notification.createMany({
    data: userIds.map((userId) => ({ userId, type: data.type, title: data.title, body: data.body, link: data.link })),
  });
  return res.count;
}

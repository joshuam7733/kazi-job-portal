import "server-only";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { layout } from "@/lib/mail/templates";
import { consumeAuthToken, createAuthToken } from "@/lib/tokens";

export async function sendVerificationEmail(email: string, name?: string | null) {
  const token = await createAuthToken(email, "verify-email", 60 * 24);
  const { html, text } = layout({
    heading: "Confirm your email address",
    body: `Hi${name ? ` ${name.split(" ")[0]}` : ""}, confirm your email to keep your KAZI account secure. This link expires in 24 hours.`,
    cta: { label: "Confirm email", href: `/verify-email?token=${token}` },
  });
  await sendMail({ to: email, subject: "Confirm your KAZI email address", html, text });
}

export async function verifyEmailToken(token: string) {
  const email = await consumeAuthToken(token, "verify-email");
  if (!email) return false;
  await db.user.update({ where: { email }, data: { emailVerified: new Date() } });
  return true;
}

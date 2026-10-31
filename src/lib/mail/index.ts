import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { randomSuffix } from "@/lib/utils";

export type MailMessage = { to: string; subject: string; html: string; text: string };

export const smtpConfigured = () => Boolean(process.env.SMTP_HOST);

let transport: nodemailer.Transporter | null = null;

/**
 * Sends email through SMTP when configured. Otherwise writes the message to ./storage/mail
 * (viewable at /dev/mail in development) so nothing is silently dropped and nothing leaves the machine.
 */
export async function sendMail(msg: MailMessage) {
  try {
    if (smtpConfigured()) {
      transport ??= nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
      });
      await transport.sendMail({ from: process.env.SMTP_FROM ?? "KAZI <no-reply@kazi.example>", ...msg });
      return;
    }
    // Serverless hosts (Netlify, Vercel, AWS Lambda) have a read-only filesystem: just log the email.
    if (process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      console.info(`[mail:not-configured] "${msg.subject}" → ${msg.to}`);
      return;
    }
    const dir = path.resolve(process.cwd(), "storage", "mail");
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomSuffix(4)}.json`);
    await writeFile(file, JSON.stringify({ ...msg, sentAt: new Date().toISOString() }, null, 2));
    if (process.env.NODE_ENV !== "test") console.info(`[mail:dev] "${msg.subject}" → ${msg.to}`);
  } catch (err) {
    // Email failure must never break the user action that triggered it.
    console.error("[mail] failed to send", err);
  }
}

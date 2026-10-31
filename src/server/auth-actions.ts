"use server";

import { AuthError as NextAuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { layout } from "@/lib/mail/templates";
import { hashPassword, verifyPassword } from "@/lib/password";
import { limitAction } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { consumeAuthToken, createAuthToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/auth-emails";
import { safeInternalPath } from "@/lib/utils";
import { changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/auth";
import { formValues, handleActionError, zodFail, type ActionState } from "./action-utils";

export async function signUpAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd, ["name", "email", "role"]);
  const parsed = signUpSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodFail(parsed.error, values);
  try {
    if (!(await limitAction("signup", 6, 60 * 60_000)).ok) return { error: "Too many sign-up attempts. Try again in an hour.", values };
    const settings = await getSettings();
    if (parsed.data.role === "EMPLOYER" && !settings.allowEmployerSignup)
      return { error: "Employer sign-up is temporarily closed. Contact support to get access.", values };
    if (parsed.data.role === "JOB_SEEKER" && !settings.allowSeekerSignup)
      return { error: "Sign-up is temporarily closed. Try again later.", values };

    const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return { fieldErrors: { email: ["An account with this email already exists. Sign in instead."] }, values };

    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: parsed.data.role,
      },
    });
    await db.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Welcome to KAZI",
        body: user.role === "EMPLOYER" ? "Set up your company profile to start posting jobs." : "Finish your profile to get better job matches.",
        link: "/onboarding",
      },
    });
    await sendVerificationEmail(user.email, user.name);
  } catch (err) {
    return { ...handleActionError(err), values };
  }

  try {
    await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirectTo: "/onboarding" });
  } catch (err) {
    if (err instanceof NextAuthError) redirect("/signin");
    throw err;
  }
  return { ok: true };
}

export async function signInAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd, ["email"]);
  const parsed = signInSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodFail(parsed.error, values);
  const callbackUrl = safeInternalPath(String(fd.get("callbackUrl") ?? ""), "/post-signin");
  try {
    await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirectTo: callbackUrl });
  } catch (err) {
    if (err instanceof NextAuthError) {
      const code = (err as NextAuthError & { code?: string }).code;
      if (code === "rate_limited") return { error: "Too many sign-in attempts. Wait 15 minutes and try again.", values };
      if (code === "suspended") return { error: "This account is suspended. Contact support for help.", values };
      return { error: "That email and password don't match an account. Check them and try again.", values };
    }
    throw err;
  }
  return { ok: true };
}

export async function googleSignInAction(fd: FormData) {
  const callbackUrl = safeInternalPath(String(fd.get("callbackUrl") ?? ""), "/post-signin");
  await signIn("google", { redirectTo: callbackUrl });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function forgotPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodFail(parsed.error, formValues(fd, ["email"]));
  try {
    if (!(await limitAction("forgot", 5, 60 * 60_000)).ok) return { error: "Too many requests. Try again in an hour." };
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (user && user.status === "ACTIVE") {
      const token = await createAuthToken(user.email, "reset-password", 60);
      const { html, text } = layout({
        heading: "Reset your password",
        body: "We received a request to reset your KAZI password. This link expires in 1 hour. If you didn't ask for this, you can ignore this email.",
        cta: { label: "Choose a new password", href: `/reset-password?token=${token}` },
      });
      await sendMail({ to: user.email, subject: "Reset your KAZI password", html, text });
    }
    // Same response whether or not the account exists, so emails can't be enumerated.
    return { ok: true, message: "If an account exists for that email, we've sent a reset link. Check your inbox." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const email = await consumeAuthToken(parsed.data.token, "reset-password");
    if (!email) return { error: "This reset link has expired or was already used. Request a new one." };
    await db.user.update({
      where: { email },
      data: { passwordHash: await hashPassword(parsed.data.password), sessionVersion: { increment: 1 }, emailVerified: new Date() },
    });
  } catch (err) {
    return handleActionError(err);
  }
  redirect("/signin?reset=1");
}

export async function resendVerificationAction(): Promise<ActionState> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { error: "Sign in to continue." };
  if (!(await limitAction("verify-resend", 3, 60 * 60_000, sessionUser.id)).ok) return { error: "You've requested several links already. Try again later." };
  const user = await db.user.findUnique({ where: { id: sessionUser.id } });
  if (!user || user.emailVerified) return { ok: true, message: "Your email is already confirmed." };
  await sendVerificationEmail(user.email, user.name);
  return { ok: true, message: "Confirmation email sent. Check your inbox." };
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return { error: "Sign in to continue." };
    if (!(await limitAction("change-password", 5, 15 * 60_000, sessionUser.id)).ok) return { error: "Too many attempts. Try again in 15 minutes." };
    const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
    if (user.passwordHash && !(await verifyPassword(parsed.data.current, user.passwordHash)))
      return { fieldErrors: { current: ["That isn't your current password."] } };
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.password), sessionVersion: { increment: 1 } },
    });
  } catch (err) {
    return handleActionError(err);
  }
  // All sessions (including this one) are invalidated; sign in again with the new password.
  await signOut({ redirectTo: "/signin?changed=1" });
  return { ok: true };
}

export async function signOutEverywhereAction() {
  const sessionUser = await getSessionUser();
  if (sessionUser) await db.user.update({ where: { id: sessionUser.id }, data: { sessionVersion: { increment: 1 } } });
  await signOut({ redirectTo: "/signin" });
}

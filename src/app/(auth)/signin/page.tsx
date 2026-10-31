import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { googleEnabled } from "@/auth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, demoMode } from "@/lib/demo";
import { getSessionUser } from "@/lib/session";
import { safeInternalPath } from "@/lib/utils";
import { SignInForm } from "./sign-in-form";
import { GoogleButton } from "../google-button";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (await getSessionUser()) redirect("/post-signin");
  const callbackUrl = safeInternalPath(sp.callbackUrl, "/post-signin");
  const notice = sp.reset
    ? "Your password has been reset. Sign in with your new password."
    : sp.changed
      ? "Password changed. Sign in again on this device."
      : sp.error === "OAuthAccountNotLinked"
        ? "That email is already registered with a password. Sign in with your email and password."
        : undefined;

  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-muted">
        New to KAZI?{" "}
        <Link href="/signup" className="font-semibold text-accent-ink underline-offset-4 hover:underline dark:text-accent">
          Create an account
        </Link>
      </p>
      {notice && <p className="mt-6 rounded-[10px] bg-accent-soft px-3.5 py-3 text-sm font-medium text-accent-ink">{notice}</p>}
      <div className="mt-8 grid gap-5">
        {googleEnabled && (
          <>
            <GoogleButton callbackUrl={callbackUrl} />
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}
        <SignInForm callbackUrl={callbackUrl} />
      </div>
      {demoMode ? (
        <div className="mt-10 rounded-[14px] border border-dashed border-line-strong p-4 text-sm">
          <p className="font-semibold">Demo accounts</p>
          <p className="mt-1 text-muted">
            Every account uses the password <code className="rounded bg-surface-2 px-1.5 py-0.5 font-semibold text-ink">{DEMO_PASSWORD}</code>
          </p>
          <ul className="mt-3 grid gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email}>
                <span className="font-semibold">{a.role}:</span> <span className="select-all">{a.email}</span>
                <span className="block text-xs text-muted">{a.note}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        process.env.NODE_ENV !== "production" && (
          <div className="mt-10 rounded-[14px] border border-dashed border-line-strong p-4 text-sm text-muted">
            <p className="font-semibold text-ink">Demo accounts (development only)</p>
            <p className="mt-1">seeker@kazi.test, employer@kazi.test, admin@kazi.test — password in README.md.</p>
          </div>
        )
      )}
    </>
  );
}

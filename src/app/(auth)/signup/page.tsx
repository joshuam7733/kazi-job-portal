import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { googleEnabled } from "@/auth";
import { getSessionUser } from "@/lib/session";
import { SignUpForm } from "./sign-up-form";
import { GoogleButton } from "../google-button";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  if (await getSessionUser()) redirect("/post-signin");
  const { role } = await searchParams;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Create your KAZI account</h1>
      <p className="mt-2 text-muted">
        Already have one?{" "}
        <Link href="/signin" className="font-semibold text-accent-ink underline-offset-4 hover:underline dark:text-accent">
          Sign in
        </Link>
      </p>
      <div className="mt-8 grid gap-5">
        <SignUpForm defaultRole={role === "employer" ? "EMPLOYER" : "JOB_SEEKER"} />
        {googleEnabled && (
          <>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
            <GoogleButton callbackUrl="/onboarding" label="Sign up with Google (job seekers)" />
          </>
        )}
      </div>
    </>
  );
}

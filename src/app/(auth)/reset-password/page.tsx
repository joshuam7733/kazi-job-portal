import type { Metadata } from "next";
import Link from "next/link";
import { peekAuthToken } from "@/lib/tokens";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = token ? await peekAuthToken(token, "reset-password") : false;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Choose a new password</h1>
      {valid ? (
        <>
          <p className="mt-2 text-muted">You&apos;ll be signed out on other devices once you save it.</p>
          <ResetForm token={token!} />
        </>
      ) : (
        <>
          <p className="mt-2 text-muted">This reset link has expired or was already used.</p>
          <Link href="/forgot-password" className="mt-6 font-semibold text-accent-ink hover:underline dark:text-accent">
            Request a new link
          </Link>
        </>
      )}
    </>
  );
}

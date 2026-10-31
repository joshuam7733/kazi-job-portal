import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/lib/auth-emails";

export const metadata: Metadata = { title: "Confirm email", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const ok = token ? await verifyEmailToken(token) : false;
  return (
    <div className="text-center">
      {ok ? (
        <CheckCircle2 className="mx-auto size-12 text-accent" aria-hidden />
      ) : (
        <XCircle className="mx-auto size-12 text-danger" aria-hidden />
      )}
      <h1 className="mt-4 font-display text-3xl font-semibold">{ok ? "Email confirmed" : "This link can't be used"}</h1>
      <p className="mt-2 text-muted">
        {ok ? "Thanks — your email address is confirmed." : "It may have expired or already been used. Sign in and request a new confirmation email from Settings."}
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/post-signin">Continue</Link>
      </Button>
    </div>
  );
}

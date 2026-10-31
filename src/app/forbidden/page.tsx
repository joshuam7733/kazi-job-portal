import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";
import { homeForRole } from "@/lib/permissions";

export const metadata: Metadata = { title: "No access", robots: { index: false } };

export default async function Forbidden() {
  const user = await getSessionUser();
  return (
    <main id="main" className="container-page flex min-h-dvh flex-col py-8">
      <Logo />
      <div className="flex flex-1 flex-col items-start justify-center">
        <h1 className="font-display text-4xl font-semibold">You don&apos;t have access to this page</h1>
        <p className="mt-3 max-w-md text-lg text-muted">
          {user ? "This area belongs to a different type of account." : "Sign in with an account that has access."}
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href={user ? homeForRole(user.role) : "/signin"}>{user ? "Go to your dashboard" : "Sign in"}</Link>
        </Button>
      </div>
    </main>
  );
}

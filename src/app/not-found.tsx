import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="container-page flex min-h-dvh flex-col py-8">
      <Logo />
      <div className="flex flex-1 flex-col items-start justify-center py-16">
        <p className="font-display text-sm font-semibold text-muted">404</p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">This page isn&apos;t here</h1>
        <p className="mt-3 max-w-md text-lg text-muted">The job may have closed, or the link may be mistyped. Search open roles instead.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/jobs">Search jobs</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/">Go to homepage</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

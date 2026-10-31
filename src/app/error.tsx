"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="container-page flex min-h-[60dvh] flex-col items-start justify-center py-16">
      <h1 className="font-display text-3xl font-semibold">This page didn&apos;t load</h1>
      <p className="mt-2 max-w-md text-muted">
        Something went wrong on our side. Try again — if it keeps happening, contact support{error.digest ? ` and quote reference ${error.digest}` : ""}.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}

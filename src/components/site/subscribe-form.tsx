"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { subscribeAction } from "@/server/public-actions";

export function SubscribeForm() {
  const [state, action] = useActionState(subscribeAction, {});
  if (state.ok) return <FormMessage state={state} />;
  const err = state.fieldErrors?.email?.[0];
  return (
    <form action={action} className="grid gap-2" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="subscribe-email" className="sr-only">
          Email address
        </label>
        <Input
          id="subscribe-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(err)}
          aria-describedby={err ? "subscribe-error" : undefined}
          className="sm:flex-1"
        />
        <SubmitButton variant="accent" pendingText="Subscribing…">
          Get weekly job alerts
        </SubmitButton>
      </div>
      {err && (
        <p id="subscribe-error" className="text-sm font-medium text-danger">
          {err}
        </p>
      )}
      <FormMessage state={{ error: state.error }} />
    </form>
  );
}

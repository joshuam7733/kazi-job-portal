"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Input } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { forgotPasswordAction } from "@/server/auth-actions";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(forgotPasswordAction, {});
  return (
    <>
      <title>Reset your password | KAZI</title>
      <h1 className="font-display text-3xl font-semibold">Reset your password</h1>
      <p className="mt-2 text-muted">Enter the email you use for KAZI and we&apos;ll send you a link to choose a new password.</p>
      <form action={action} className="mt-8 grid gap-4" noValidate>
        <FormMessage state={state} />
        {!state.ok && (
          <>
            <Field label="Email" error={state.fieldErrors?.email}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} aria-describedby={describedBy} aria-invalid={invalid} />
              )}
            </Field>
            <SubmitButton size="lg" pendingText="Sending link…">
              Send reset link
            </SubmitButton>
          </>
        )}
      </form>
      <Link href="/signin" className="mt-6 text-sm font-semibold text-accent-ink hover:underline dark:text-accent">
        Back to sign in
      </Link>
    </>
  );
}

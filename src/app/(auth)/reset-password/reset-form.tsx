"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { resetPasswordAction } from "@/server/auth-actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, {});
  return (
    <form action={action} className="mt-8 grid gap-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <Field label="New password" hint="At least 8 characters, with a letter and a number." error={state.fieldErrors?.password}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} name="password" type="password" autoComplete="new-password" aria-describedby={describedBy} aria-invalid={invalid} />
        )}
      </Field>
      <Field label="Confirm new password" error={state.fieldErrors?.confirm}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} name="confirm" type="password" autoComplete="new-password" aria-describedby={describedBy} aria-invalid={invalid} />
        )}
      </Field>
      <SubmitButton size="lg" pendingText="Saving…">
        Save new password
      </SubmitButton>
    </form>
  );
}

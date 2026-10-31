"use client";

import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { requestVerificationAction } from "@/server/employer-actions";

export function VerificationForm() {
  const [state, action] = useActionState(requestVerificationAction, {});
  if (state.ok) return <FormMessage state={state} className="mt-4" />;
  return (
    <form action={action} className="mt-5 grid gap-4" noValidate>
      <FormMessage state={{ error: state.error }} />
      <Field label="Company registration number" hint="From your URSB certificate of incorporation or equivalent." error={state.fieldErrors?.registrationNumber}>
        {({ id, describedBy, invalid }) => <Input id={id} name="registrationNumber" aria-describedby={describedBy} aria-invalid={invalid} />}
      </Field>
      <Field label="Supporting document" optional hint="PDF or image, up to 4 MB. Only KAZI reviewers can see it.">
        {({ id, describedBy }) => (
          <input id={id} type="file" name="document" accept=".pdf,image/png,image/jpeg" aria-describedby={describedBy} className="block w-full text-sm file:mr-3 file:rounded-[8px] file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:font-semibold" />
        )}
      </Field>
      <Field label="Notes for reviewers" optional>
        {({ id }) => <Textarea id={id} name="notes" rows={3} maxLength={1000} />}
      </Field>
      <SubmitButton className="justify-self-start" pendingText="Sending request…">
        Request verification
      </SubmitButton>
    </form>
  );
}

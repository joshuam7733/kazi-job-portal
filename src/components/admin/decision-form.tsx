"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import type { ActionState } from "@/server/action-utils";

type Choice = { name: string; value: string; label: string; variant?: "primary" | "accent" | "danger" | "secondary" };

/** A note field plus one submit button per decision (approve / reject / remove…). */
export function DecisionForm({
  action,
  hidden,
  choices,
  notePlaceholder = "Note (required when rejecting or removing)",
  noteLabel = "Note to the employer",
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  hidden: Record<string, string>;
  choices: Choice[];
  notePlaceholder?: string;
  noteLabel?: string;
}) {
  // Toast straight from the result: a successful decision usually removes this item from its queue,
  // unmounting the form before an effect could run.
  const [state, formAction] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await action(prev, fd);
    if (res.ok && res.message) toast.success(res.message);
    return res;
  }, {});
  const id = `note-${Object.values(hidden).join("-")}`;
  return (
    <form action={formAction} className="grid gap-2">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <FormMessage state={{ error: state.error }} />
      <label htmlFor={id} className="sr-only">
        {noteLabel}
      </label>
      <Textarea id={id} name="note" rows={2} maxLength={1000} placeholder={notePlaceholder} aria-invalid={Boolean(state.fieldErrors?.note)} className="min-h-0" />
      {state.fieldErrors?.note && <p className="text-sm text-danger">{state.fieldErrors.note[0]}</p>}
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => (
          <SubmitButton key={c.value} name={c.name} value={c.value} size="sm" variant={c.variant ?? "secondary"}>
            {c.label}
          </SubmitButton>
        ))}
      </div>
    </form>
  );
}

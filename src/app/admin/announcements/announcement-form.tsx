"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { sendAnnouncementAction } from "@/server/admin-actions";

export function AnnouncementForm() {
  const [state, action] = useActionState(sendAnnouncementAction, {});
  const ref = useRef<HTMLFormElement>(null);
  const last = useRef<unknown>(null);
  useEffect(() => {
    if (state !== last.current && state.ok) ref.current?.reset();
    last.current = state;
  }, [state]);
  const fe = state.fieldErrors ?? {};
  return (
    <form ref={ref} action={action} className="grid gap-4" noValidate>
      <FormMessage state={state} />
      <Field label="Title" error={fe.title}>
        {({ id, invalid }) => <Input id={id} name="title" maxLength={120} aria-invalid={invalid} />}
      </Field>
      <Field label="Message" error={fe.body}>
        {({ id, invalid }) => <Textarea id={id} name="body" rows={4} maxLength={2000} aria-invalid={invalid} />}
      </Field>
      <Field label="Send to">
        {({ id }) => (
          <Select id={id} name="audience" defaultValue="ALL">
            <option value="ALL">Everyone (job seekers and employers)</option>
            <option value="JOB_SEEKERS">Job seekers only</option>
            <option value="EMPLOYERS">Employers only</option>
          </Select>
        )}
      </Field>
      <SubmitButton className="justify-self-start" pendingText="Sending…">
        Send announcement
      </SubmitButton>
    </form>
  );
}
